/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Source Serif 4"', 'Georgia', 'serif'],
        body: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        compliscan: {
          navy: '#1B2A4A',
          bg: '#F7F5F0',
          gold: '#C9A227',
          secondary: '#5C5C52',
          border: '#E4E0D7',
          card: '#FFFFFF',
          compliant: {
            DEFAULT: '#2F6844',
            bg: '#EAF3ED',
            text: '#1E472E',
            border: '#BFE0CB',
          },
          flagged: {
            DEFAULT: '#A13D2C',
            bg: '#FCEBE9',
            text: '#7A281A',
            border: '#F2C2BC',
          },
          review: {
            DEFAULT: '#B45309',
            bg: '#FEF3C7',
            text: '#92400E',
            border: '#FDE68A',
          },
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
