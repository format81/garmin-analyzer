"""
FIT File Parser for Vercel Serverless Functions
Parses Garmin FIT files and returns structured JSON data
"""

import struct
from datetime import datetime, timedelta
from typing import Any
import hashlib
import base64

# FIT timestamp epoch: December 31, 1989 00:00:00 UTC
FIT_EPOCH = datetime(1989, 12, 31)

# Base type definitions
BASE_TYPES = {
    0x00: ('enum', 1, 'B'),
    0x01: ('sint8', 1, 'b'),
    0x02: ('uint8', 1, 'B'),
    0x03: ('sint16', 2, 'h'),
    0x04: ('uint16', 2, 'H'),
    0x05: ('sint32', 4, 'i'),
    0x06: ('uint32', 4, 'I'),
    0x07: ('string', 1, 's'),
    0x08: ('float32', 4, 'f'),
    0x09: ('float64', 8, 'd'),
    0x0A: ('uint8z', 1, 'B'),
    0x0B: ('uint16z', 2, 'H'),
    0x0C: ('uint32z', 4, 'I'),
    0x0D: ('byte', 1, 'B'),
    0x84: ('uint16', 2, 'H'),
    0x85: ('sint32', 4, 'i'),
    0x86: ('uint32', 4, 'I'),
    0x8B: ('uint16z', 2, 'H'),
    0x8C: ('uint32', 4, 'I'),
}

# Sport types
SPORT_TYPES = {
    0: 'other',
    1: 'running',
    2: 'cycling',
    5: 'swimming',
    11: 'walking',
    17: 'hiking',
    37: 'indoor_running',
}


def fit_timestamp_to_iso(timestamp: int | None) -> str | None:
    """Convert FIT timestamp to ISO string"""
    if timestamp is None or timestamp == 0xFFFFFFFF:
        return None
    dt = FIT_EPOCH + timedelta(seconds=timestamp)
    return dt.isoformat()


def semicircles_to_degrees(semicircles: int | None) -> float | None:
    """Convert semicircles to degrees"""
    if semicircles is None:
        return None
    return semicircles * (180.0 / 2**31)


def generate_activity_id(data: bytes, start_time: str | None) -> str:
    """Generate unique ID for activity"""
    content = data[:1000] + (start_time or '').encode()
    return hashlib.sha256(content).hexdigest()[:16]


class FITParser:
    def __init__(self, data: bytes):
        self.data = data
        self.pos = 0
        self.definitions = {}
        self.records = []
        self.sessions = []
        self.laps = []
        self.events = []
        self.file_id = {}
        self.device_info = {}
        self.monitoring = []
        self.stress = []
        self.sleep = []
        self.hrv = []
        
    def parse(self) -> dict:
        """Parse the FIT file and return structured data"""
        try:
            header = self._parse_header()
            if header['signature'] != '.FIT':
                return {'error': 'Invalid FIT file signature'}
            
            end_pos = self.pos + header['data_size']
            
            while self.pos < end_pos - 2:
                try:
                    self._parse_record()
                except Exception:
                    self.pos += 1
                    
            return self._build_result()
        except Exception as e:
            return {'error': str(e)}
    
    def _parse_header(self) -> dict:
        """Parse FIT file header"""
        header_size = self.data[0]
        protocol_version = self.data[1]
        profile_version = struct.unpack('<H', self.data[2:4])[0]
        data_size = struct.unpack('<I', self.data[4:8])[0]
        signature = self.data[8:12].decode('ascii', errors='ignore')
        
        self.pos = header_size
        
        return {
            'header_size': header_size,
            'protocol_version': protocol_version,
            'profile_version': profile_version,
            'data_size': data_size,
            'signature': signature,
        }
    
    def _parse_record(self):
        """Parse a single record"""
        header = self.data[self.pos]
        self.pos += 1
        
        if header & 0x80:  # Compressed timestamp
            local_msg_type = (header >> 5) & 0x03
            self._parse_data_record(local_msg_type)
        elif header & 0x40:  # Definition message
            local_msg_type = header & 0x0F
            self._parse_definition(local_msg_type)
        else:  # Data message
            local_msg_type = header & 0x0F
            self._parse_data_record(local_msg_type)
    
    def _parse_definition(self, local_msg_type: int):
        """Parse definition message"""
        reserved = self.data[self.pos]
        arch = self.data[self.pos + 1]
        self.pos += 2
        
        endian = '<' if arch == 0 else '>'
        
        global_msg_num = struct.unpack(endian + 'H', self.data[self.pos:self.pos+2])[0]
        self.pos += 2
        
        num_fields = self.data[self.pos]
        self.pos += 1
        
        fields = []
        for _ in range(num_fields):
            field_def_num = self.data[self.pos]
            field_size = self.data[self.pos + 1]
            base_type = self.data[self.pos + 2]
            self.pos += 3
            
            fields.append({
                'field_def_num': field_def_num,
                'size': field_size,
                'base_type': base_type,
            })
        
        self.definitions[local_msg_type] = {
            'global_msg_num': global_msg_num,
            'endian': endian,
            'fields': fields,
        }
    
    def _parse_data_record(self, local_msg_type: int):
        """Parse data message"""
        if local_msg_type not in self.definitions:
            return
            
        definition = self.definitions[local_msg_type]
        global_msg_num = definition['global_msg_num']
        endian = definition['endian']
        
        record = {'_msg_num': global_msg_num}
        
        for field in definition['fields']:
            field_size = field['size']
            base_type = field['base_type']
            field_def_num = field['field_def_num']
            
            field_data = self.data[self.pos:self.pos + field_size]
            self.pos += field_size
            
            type_info = BASE_TYPES.get(base_type & 0x1F, ('unknown', 1, 'B'))
            type_name, type_size, fmt_char = type_info
            
            try:
                if type_name == 'string':
                    value = field_data.decode('ascii', errors='ignore').rstrip('\x00')
                elif field_size == type_size:
                    value = struct.unpack(endian + fmt_char, field_data)[0]
                elif field_size > type_size:
                    num_values = field_size // type_size
                    value = list(struct.unpack(endian + fmt_char * num_values, 
                                               field_data[:num_values * type_size]))
                else:
                    value = None
            except:
                value = None
            
            record[field_def_num] = value
        
        # Route to appropriate storage based on message type
        self._store_record(global_msg_num, record)
    
    def _store_record(self, msg_num: int, record: dict):
        """Store parsed record in appropriate list"""
        if msg_num == 0:  # file_id
            self.file_id = record
        elif msg_num == 20:  # record (data point)
            self.records.append(record)
        elif msg_num == 18:  # session
            self.sessions.append(record)
        elif msg_num == 19:  # lap
            self.laps.append(record)
        elif msg_num == 21:  # event
            self.events.append(record)
        elif msg_num == 23:  # device_info
            self.device_info = record
        elif msg_num == 55:  # monitoring
            self.monitoring.append(record)
        elif msg_num == 227:  # stress_level
            self.stress.append(record)
        elif msg_num == 275:  # sleep_level
            self.sleep.append(record)
        elif msg_num == 78:  # hrv
            self.hrv.append(record)
    
    def _build_result(self) -> dict:
        """Build final result structure"""
        # Determine file type
        file_type = self.file_id.get(0, 0)  # field 0 is type
        
        result = {
            'file_type': file_type,
            'activity': None,
            'wellness': None,
            'sleep': None,
        }
        
        # Activity file (type 4)
        if file_type == 4 or self.sessions:
            result['activity'] = self._build_activity()
        
        # Monitoring/wellness
        if self.monitoring or self.stress:
            result['wellness'] = self._build_wellness()
        
        # Sleep data
        if self.sleep:
            result['sleep'] = self._build_sleep()
        
        return result
    
    def _build_activity(self) -> dict | None:
        """Build activity structure from parsed data"""
        if not self.sessions:
            return None
        
        session = self.sessions[0]
        
        # Get sport type
        sport_num = session.get(5, 0)  # field 5 is sport
        sport = SPORT_TYPES.get(sport_num, 'other')
        if sport == 'indoor_running':
            sport = 'running'
        
        # Get timestamps
        start_time = fit_timestamp_to_iso(session.get(2))  # start_time
        timestamp = fit_timestamp_to_iso(session.get(253))  # timestamp
        
        # Build records array
        records = []
        for rec in self.records:
            record_data = {
                'timestamp': fit_timestamp_to_iso(rec.get(253)),
                'heartRate': rec.get(3),  # heart_rate
                'speed': rec.get(6) / 1000 if rec.get(6) else None,  # speed in m/s
                'distance': rec.get(5) / 100 if rec.get(5) else None,  # distance in m
                'cadence': rec.get(4),  # cadence
                'altitude': rec.get(2) / 5 - 500 if rec.get(2) else None,  # altitude
                'lat': semicircles_to_degrees(rec.get(0)),
                'lon': semicircles_to_degrees(rec.get(1)),
                'power': rec.get(7),  # power
            }
            
            # Calculate pace from speed
            if record_data['speed'] and record_data['speed'] > 0:
                record_data['pace'] = 1000 / record_data['speed']  # sec/km
            else:
                record_data['pace'] = None
                
            records.append(record_data)
        
        # Build laps array
        laps = []
        for i, lap in enumerate(self.laps):
            lap_data = {
                'index': i + 1,
                'startTime': fit_timestamp_to_iso(lap.get(2)),
                'totalTime': lap.get(7) / 1000 if lap.get(7) else None,  # total_elapsed_time
                'distance': lap.get(9) / 100 if lap.get(9) else None,  # total_distance
                'avgHeartRate': lap.get(15),  # avg_heart_rate
                'maxHeartRate': lap.get(16),  # max_heart_rate
                'avgCadence': lap.get(17),  # avg_cadence
                'calories': lap.get(11),  # total_calories
            }
            
            # Calculate pace
            if lap_data['distance'] and lap_data['totalTime'] and lap_data['distance'] > 0:
                lap_data['avgPace'] = lap_data['totalTime'] / (lap_data['distance'] / 1000)
            else:
                lap_data['avgPace'] = None
                
            laps.append(lap_data)
        
        # Calculate aggregates
        total_time = session.get(7, 0) / 1000 if session.get(7) else 0  # total_elapsed_time
        total_distance = session.get(9, 0) / 100 if session.get(9) else 0  # total_distance
        
        activity = {
            'id': generate_activity_id(self.data, start_time),
            'filename': '',
            'sport': sport,
            'name': '',
            'startTime': start_time,
            'endTime': timestamp,
            'totalTime': total_time,
            'movingTime': session.get(8, 0) / 1000 if session.get(8) else total_time,
            'totalDistance': total_distance,
            'avgHeartRate': session.get(16),  # avg_heart_rate
            'maxHeartRate': session.get(17),  # max_heart_rate
            'minHeartRate': session.get(64),  # min_heart_rate
            'avgSpeed': session.get(14) / 1000 if session.get(14) else None,  # avg_speed
            'maxSpeed': session.get(15) / 1000 if session.get(15) else None,  # max_speed
            'avgCadence': session.get(18),  # avg_cadence
            'maxCadence': session.get(19),  # max_cadence
            'totalAscent': session.get(22),  # total_ascent
            'totalDescent': session.get(23),  # total_descent
            'calories': session.get(11),  # total_calories
            'avgPower': session.get(20),  # avg_power
            'maxPower': session.get(21),  # max_power
            'records': records,
            'laps': laps,
        }
        
        # Calculate pace
        if total_distance > 0 and total_time > 0:
            activity['avgPace'] = total_time / (total_distance / 1000)
        else:
            activity['avgPace'] = None
            
        if activity['maxSpeed'] and activity['maxSpeed'] > 0:
            activity['maxPace'] = 1000 / activity['maxSpeed']
        else:
            activity['maxPace'] = None
        
        return activity
    
    def _build_wellness(self) -> dict | None:
        """Build wellness data structure"""
        if not self.stress and not self.monitoring:
            return None
        
        # Get date from first record
        date = None
        if self.monitoring:
            timestamp = self.monitoring[0].get(253)
            if timestamp:
                dt = FIT_EPOCH + timedelta(seconds=timestamp)
                date = dt.strftime('%Y-%m-%d')
        
        # Aggregate stress data
        stress_values = [s.get(0) for s in self.stress if s.get(0) is not None and s.get(0) >= 0]
        
        return {
            'date': date,
            'stressAvg': sum(stress_values) / len(stress_values) if stress_values else None,
            'stressMax': max(stress_values) if stress_values else None,
            'stressMin': min(stress_values) if stress_values else None,
            'restingHR': None,  # Need specific message type
            'hrv': None,
            'steps': None,
            'activeCalories': None,
            'totalCalories': None,
        }
    
    def _build_sleep(self) -> dict | None:
        """Build sleep data structure"""
        if not self.sleep:
            return None
        
        # Get date from first record
        timestamp = self.sleep[0].get(253)
        date = None
        if timestamp:
            dt = FIT_EPOCH + timedelta(seconds=timestamp)
            date = dt.strftime('%Y-%m-%d')
        
        return {
            'date': date,
            'sleepScore': None,
            'totalSleepTime': None,
            'deepSleep': None,
            'lightSleep': None,
            'remSleep': None,
            'awakeTime': None,
        }


def parse_fit_file(data: bytes, filename: str = '') -> dict:
    """Main entry point for parsing a FIT file"""
    parser = FITParser(data)
    result = parser.parse()
    
    if result.get('activity'):
        result['activity']['filename'] = filename
    
    return result


def parse_fit_base64(base64_data: str, filename: str = '') -> dict:
    """Parse FIT file from base64 encoded string"""
    try:
        data = base64.b64decode(base64_data)
        return parse_fit_file(data, filename)
    except Exception as e:
        return {'error': f'Failed to decode base64: {str(e)}'}
