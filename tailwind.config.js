/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        garmin: {
          blue: '#007CC3',
          dark: '#0f172a',
          gray: '#1e293b',
        },
      },
    },
  },
  plugins: [],
};
