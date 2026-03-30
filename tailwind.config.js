/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        carbon: '#101010',
        pure: '#FFFFFF',
        offwhite: '#F8F9FA',
        nazar: '#1E3A8A',
        'rainbow-blue': '#3B82F6',
        'rainbow-purple': '#8B5CF6',
        'rainbow-cyan': '#22D3EE',
        'theme-primary': 'var(--theme-primary, #1E3A8A)',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        signature: ['Great Vibes', 'cursive']
      }
    },
  },
  plugins: [],
}
