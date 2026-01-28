/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eu: {
          blue: '#003399',
          gold: '#FFCC00',
          'dark-blue': '#002266',
          'light-blue': '#4D7FCC',
          'pale-blue': '#E6EDF7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
