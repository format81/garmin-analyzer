import { NextRequest, NextResponse } from 'next/server';
import { Activity, WellnessDay, SleepData, ParseResponse } from '@/lib/types';

// FIT file constants
const FIT_EPOCH = new Date('1989-12-31T00:00:00Z').getTime();

// Base types for FIT parsing
const BASE_TYPES: Record<number, { size: number; signed: boolean }> = {
  0x00: { size: 1, signed: false }, // enum
  0x01: { size: 1, signed: true },  // sint8
  0x02: { size: 1, signed: false }, // uint8
  0x03: { size: 2, signed: true },  // sint16
  0x04: { size: 2, signed: false }, // uint16
  0x05: { size: 4, signed: true },  // sint32
  0x06: { size: 4, signed: false }, // uint32
  0x07: { size: 1, signed: false }, // string
  0x0A: { size: 1, signed: false }, // uint8z
  0x0B: { size: 2, signed: false }, // uint16z
  0x0C: { size: 4, signed: false }, // uint32z
  0x84: { size: 2, signed: false }, // uint16
  0x85: { size: 4, signed: true },  // sint32
  0x86: { size: 4, signed: false }, // uint32
  0x8C: { size: 4, signed: false }, // uint32
};

const SPORT_TYPES: Record<number, string> = {
  0: 'other',
  1: 'running',
  2: 'cycling',
  5: 'swimming',
  11: 'walking',
  17: 'hiking',
  37: 'running', // indoor_running
};

function fitTimestampToISO(timestamp: number | null): string | null {
  if (timestamp === null || timestamp === 0xFFFFFFFF) return null;
  return new Date(FIT_EPOCH + timestamp * 1000).toISOString();
}

function semicirclesToDegrees(semicircles: number | null): number | null {
  if (semicircles === null) return null;
  return semicircles * (180.0 / Math.pow(2, 31));
}

async function generateId(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

interface FieldDef {
  fieldDefNum: number;
  size: number;
  baseType: number;
}

interface Definition {
  globalMsgNum: number;
  littleEndian: boolean;
  fields: FieldDef[];
}

interface ParsedRecord {
  msgNum: number;
  fields: Record<number, number | number[] | string | null>;
}

class FITParser {
  private data: DataView;
  private pos: number = 0;
  private definitions: Map<number, Definition> = new Map();
  private records: ParsedRecord[] = [];
  private sessions: ParsedRecord[] = [];
  private laps: ParsedRecord[] = [];
  private fileId: ParsedRecord | null = null;
  private monitoring: ParsedRecord[] = [];
  private stress: ParsedRecord[] = [];
  private sleep: ParsedRecord[] = [];

  constructor(buffer: ArrayBuffer) {
    this.data = new DataView(buffer);
  }

  parse(): { activity: Activity | null; wellness: WellnessDay | null; sleep: SleepData | null; error?: string } {
    try {
      const header = this.parseHeader();
      if (!header.valid) {
        return { activity: null, wellness: null, sleep: null, error: 'Invalid FIT file' };
      }

      const endPos = this.pos + header.dataSize;

      while (this.pos < endPos - 2) {
        try {
          this.parseRecord();
        } catch {
          this.pos++;
        }
      }

      return this.buildResult();
    } catch (e) {
      return { activity: null, wellness: null, sleep: null, error: String(e) };
    }
  }

  private parseHeader(): { valid: boolean; dataSize: number } {
    const headerSize = this.data.getUint8(0);
    const dataSize = this.data.getUint32(4, true);
    
    // Check signature ".FIT"
    const sig = String.fromCharCode(
      this.data.getUint8(8),
      this.data.getUint8(9),
      this.data.getUint8(10),
      this.data.getUint8(11)
    );

    this.pos = headerSize;
    return { valid: sig === '.FIT', dataSize };
  }

  private parseRecord(): void {
    const header = this.data.getUint8(this.pos);
    this.pos++;

    if (header & 0x80) {
      // Compressed timestamp
      const localMsgType = (header >> 5) & 0x03;
      this.parseDataRecord(localMsgType);
    } else if (header & 0x40) {
      // Definition message
      const localMsgType = header & 0x0F;
      this.parseDefinition(localMsgType);
    } else {
      // Data message
      const localMsgType = header & 0x0F;
      this.parseDataRecord(localMsgType);
    }
  }

  private parseDefinition(localMsgType: number): void {
    this.pos++; // reserved
    const arch = this.data.getUint8(this.pos);
    this.pos++;

    const littleEndian = arch === 0;
    const globalMsgNum = this.data.getUint16(this.pos, littleEndian);
    this.pos += 2;

    const numFields = this.data.getUint8(this.pos);
    this.pos++;

    const fields: FieldDef[] = [];
    for (let i = 0; i < numFields; i++) {
      fields.push({
        fieldDefNum: this.data.getUint8(this.pos),
        size: this.data.getUint8(this.pos + 1),
        baseType: this.data.getUint8(this.pos + 2),
      });
      this.pos += 3;
    }

    this.definitions.set(localMsgType, { globalMsgNum, littleEndian, fields });
  }

  private parseDataRecord(localMsgType: number): void {
    const def = this.definitions.get(localMsgType);
    if (!def) return;

    const record: ParsedRecord = {
      msgNum: def.globalMsgNum,
      fields: {},
    };

    for (const field of def.fields) {
      const value = this.readField(field, def.littleEndian);
      record.fields[field.fieldDefNum] = value;
    }

    this.storeRecord(record);
  }

  private readField(field: FieldDef, littleEndian: boolean): number | number[] | string | null {
    const typeInfo = BASE_TYPES[field.baseType & 0x1F] || { size: 1, signed: false };

    if (field.baseType === 0x07) {
      // String
      const bytes = new Uint8Array(this.data.buffer, this.pos, field.size);
      this.pos += field.size;
      let str = '';
      for (const byte of bytes) {
        if (byte === 0) break;
        str += String.fromCharCode(byte);
      }
      return str;
    }

    if (field.size === typeInfo.size) {
      const value = this.readValue(typeInfo.size, typeInfo.signed, littleEndian);
      return value;
    }

    if (field.size > typeInfo.size) {
      const count = Math.floor(field.size / typeInfo.size);
      const values: number[] = [];
      for (let i = 0; i < count; i++) {
        values.push(this.readValue(typeInfo.size, typeInfo.signed, littleEndian));
      }
      // Skip remaining bytes
      this.pos += field.size - (count * typeInfo.size);
      return values;
    }

    this.pos += field.size;
    return null;
  }

  private readValue(size: number, signed: boolean, littleEndian: boolean): number {
    let value: number;
    switch (size) {
      case 1:
        value = signed ? this.data.getInt8(this.pos) : this.data.getUint8(this.pos);
        break;
      case 2:
        value = signed ? this.data.getInt16(this.pos, littleEndian) : this.data.getUint16(this.pos, littleEndian);
        break;
      case 4:
        value = signed ? this.data.getInt32(this.pos, littleEndian) : this.data.getUint32(this.pos, littleEndian);
        break;
      default:
        value = this.data.getUint8(this.pos);
    }
    this.pos += size;
    return value;
  }

  private storeRecord(record: ParsedRecord): void {
    switch (record.msgNum) {
      case 0: this.fileId = record; break;
      case 18: this.sessions.push(record); break;
      case 19: this.laps.push(record); break;
      case 20: this.records.push(record); break;
      case 55: this.monitoring.push(record); break;
      case 227: this.stress.push(record); break;
      case 275: this.sleep.push(record); break;
    }
  }

  private buildResult(): { activity: Activity | null; wellness: WellnessDay | null; sleep: SleepData | null } {
    return {
      activity: this.buildActivity(),
      wellness: this.buildWellness(),
      sleep: this.buildSleep(),
    };
  }

  private buildActivity(): Activity | null {
    if (this.sessions.length === 0) return null;

    const session = this.sessions[0].fields;
    const sportNum = (session[5] as number) || 0;
    const sport = (SPORT_TYPES[sportNum] || 'other') as Activity['sport'];

    const startTime = fitTimestampToISO(session[2] as number);
    const endTime = fitTimestampToISO(session[253] as number);

    const totalTime = session[7] ? (session[7] as number) / 1000 : 0;
    const totalDistance = session[9] ? (session[9] as number) / 100 : 0;

    // Build records
    const activityRecords = this.records.map(rec => {
      const speed = rec.fields[6] ? (rec.fields[6] as number) / 1000 : null;
      return {
        timestamp: fitTimestampToISO(rec.fields[253] as number) || '',
        heartRate: (rec.fields[3] as number) || null,
        speed,
        pace: speed && speed > 0 ? 1000 / speed : null,
        distance: rec.fields[5] ? (rec.fields[5] as number) / 100 : 0,
        cadence: (rec.fields[4] as number) || null,
        altitude: rec.fields[2] ? (rec.fields[2] as number) / 5 - 500 : null,
        lat: semicirclesToDegrees(rec.fields[0] as number),
        lon: semicirclesToDegrees(rec.fields[1] as number),
        power: (rec.fields[7] as number) || null,
        groundContactTime: null,
        verticalOscillation: null,
      };
    });

    // Build laps
    const activityLaps = this.laps.map((lap, i) => {
      const lapTime = lap.fields[7] ? (lap.fields[7] as number) / 1000 : null;
      const lapDist = lap.fields[9] ? (lap.fields[9] as number) / 100 : null;
      return {
        index: i + 1,
        startTime: fitTimestampToISO(lap.fields[2] as number) || '',
        totalTime: lapTime,
        distance: lapDist,
        avgHeartRate: (lap.fields[15] as number) || null,
        maxHeartRate: (lap.fields[16] as number) || null,
        avgPace: lapDist && lapTime && lapDist > 0 ? lapTime / (lapDist / 1000) : null,
        avgCadence: (lap.fields[17] as number) || null,
        calories: (lap.fields[11] as number) || null,
      };
    });

    const avgSpeed = session[14] ? (session[14] as number) / 1000 : null;
    const maxSpeed = session[15] ? (session[15] as number) / 1000 : null;

    return {
      id: '', // Will be set later
      filename: '',
      sport,
      name: '',
      startTime: startTime || '',
      endTime: endTime || '',
      totalTime,
      movingTime: session[8] ? (session[8] as number) / 1000 : totalTime,
      totalDistance,
      avgHeartRate: (session[16] as number) || null,
      maxHeartRate: (session[17] as number) || null,
      minHeartRate: (session[64] as number) || null,
      avgPace: totalDistance > 0 && totalTime > 0 ? totalTime / (totalDistance / 1000) : null,
      maxPace: maxSpeed && maxSpeed > 0 ? 1000 / maxSpeed : null,
      avgSpeed,
      maxSpeed,
      avgCadence: (session[18] as number) || null,
      maxCadence: (session[19] as number) || null,
      totalAscent: (session[22] as number) || null,
      totalDescent: (session[23] as number) || null,
      calories: (session[11] as number) || null,
      avgPower: (session[20] as number) || null,
      maxPower: (session[21] as number) || null,
      avgGroundContactTime: null,
      avgVerticalOscillation: null,
      records: activityRecords,
      laps: activityLaps,
    };
  }

  private buildWellness(): WellnessDay | null {
    if (this.stress.length === 0 && this.monitoring.length === 0) return null;

    let date: string | null = null;
    if (this.monitoring.length > 0) {
      const timestamp = this.monitoring[0].fields[253] as number;
      if (timestamp) {
        date = new Date(FIT_EPOCH + timestamp * 1000).toISOString().split('T')[0];
      }
    }

    const stressValues = this.stress
      .map(s => s.fields[0] as number)
      .filter(v => v !== null && v !== undefined && v >= 0 && v <= 100);

    return {
      date: date || '',
      stressAvg: stressValues.length > 0 ? stressValues.reduce((a, b) => a + b, 0) / stressValues.length : null,
      stressMax: stressValues.length > 0 ? Math.max(...stressValues) : null,
      stressMin: stressValues.length > 0 ? Math.min(...stressValues) : null,
      restingHR: null,
      hrv: null,
      hrvStatus: null,
      steps: null,
      activeCalories: null,
      totalCalories: null,
      floorsClimbed: null,
      intensityMinutes: null,
      bodyBattery: null,
      bodyBatteryChange: null,
    };
  }

  private buildSleep(): SleepData | null {
    if (this.sleep.length === 0) return null;

    const timestamp = this.sleep[0].fields[253] as number;
    const date = timestamp ? new Date(FIT_EPOCH + timestamp * 1000).toISOString().split('T')[0] : '';

    return {
      date,
      sleepScore: null,
      totalSleepTime: null,
      deepSleep: null,
      lightSleep: null,
      remSleep: null,
      awakeTime: null,
      sleepStart: null,
      sleepEnd: null,
      avgHR: null,
      avgHRV: null,
      respirationRate: null,
      spo2: null,
    };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ParseResponse>> {
  try {
    const body = await request.json();
    const { files } = body as { files: { name: string; content: string }[] };

    if (!files || !Array.isArray(files)) {
      return NextResponse.json({
        success: false,
        activities: [],
        wellness: [],
        sleep: [],
        errors: ['No files provided'],
        warnings: [],
      });
    }

    const activities: Activity[] = [];
    const wellness: WellnessDay[] = [];
    const sleep: SleepData[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const file of files) {
      try {
        // Decode base64
        const binaryString = atob(file.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const parser = new FITParser(bytes.buffer);
        const result = parser.parse();

        if (result.error) {
          errors.push(`${file.name}: ${result.error}`);
          continue;
        }

        if (result.activity) {
          result.activity.filename = file.name;
          result.activity.id = await generateId(bytes.buffer);
          activities.push(result.activity);
        }

        if (result.wellness) {
          wellness.push(result.wellness);
        }

        if (result.sleep) {
          sleep.push(result.sleep);
        }
      } catch (e) {
        errors.push(`${file.name}: ${String(e)}`);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      activities,
      wellness,
      sleep,
      errors,
      warnings,
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      activities: [],
      wellness: [],
      sleep: [],
      errors: [String(e)],
      warnings: [],
    });
  }
}
