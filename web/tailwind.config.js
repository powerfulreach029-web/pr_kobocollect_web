/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#3e9fcc',
          DEFAULT: '#3e9fcc',
          dark: '#4cbcf0',
        },
        surface: {
          light: '#ffffff',
          dark: '#001117',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
