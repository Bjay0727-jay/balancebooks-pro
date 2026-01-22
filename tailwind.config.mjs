/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy-dark': '#0f172a',
        'navy': '#1e3a5f',
        'teal': '#14b8a6',
        'teal-dark': '#0d9488',
      },
    },
  },
  plugins: [],
}
