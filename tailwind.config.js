/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          50: '#FDF2F2',
          100: '#FDE8E8',
          200: '#FBD5D5',
          300: '#F8B4B4',
          400: '#F98080',
          500: '#EF5350',
          600: '#E53935',
          DEFAULT: '#C62828', // Primary medical red
          700: '#C62828',
          800: '#9B1C1C',
          900: '#771D1D',
          dark: '#B71C1C',
        },
        navy: {
          50: '#F0F3F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#627D98',
          500: '#334E68',
          600: '#243B53',
          DEFAULT: '#17243A', // Primary dark navy
          700: '#17243A',
          800: '#101B2B',
          900: '#0B131F',
        },
        surface: {
          DEFAULT: '#F6F8FB',
          card: '#FFFFFF',
          muted: '#F1F4F9',
        },
        primaryText: '#172033',
        secondaryText: '#697586',
        borderNeutral: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        cardHover: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        elevated: '0 10px 15px -3px rgba(23, 36, 58, 0.08), 0 4px 6px -2px rgba(23, 36, 58, 0.04)',
      },
    },
  },
  plugins: [],
}
