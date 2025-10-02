/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3063b4',
          600: '#2952a3',
          700: '#224189',
          800: '#1e3a75',
          900: '#1a3260',
          950: '#11204a',
        },
      },
    },
  },
  plugins: [],
};
