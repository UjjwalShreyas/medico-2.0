/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FAF6F0',
          100: '#F5ECE1',
          200: '#F0E3D3',
          DEFAULT: '#EEDCC8', // Cream Vanilla
          300: '#EEDCC8',
          400: '#E4CCB2',
          500: '#D9BC9C',
        },
        lemon: {
          50: '#FAF6F0',
          100: '#F5ECE1',
          200: '#F0E3D3',
          DEFAULT: '#EEDCC8', // Cream Vanilla mapped to existing classes
          300: '#EEDCC8',
          400: '#E4CCB2',
          500: '#D9BC9C',
        },
        ruby: {
          50: '#FDF2F2',
          100: '#FCE6E6',
          200: '#F8BDBD',
          light: '#780B07',
          DEFAULT: '#570300', // Dark Ruby
          hover: '#6B0502',
          dark: '#3D0200',
        }
      }
    }
  },
  plugins: [],
}
