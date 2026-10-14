/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FBF5ED',
        beige: '#F1E5D7',
        terracotta: '#B65335',
        gold: '#C9A16A',
        maroon: '#70263A',
        charcoal: '#382B27',
        cream: '#F7F2EA'
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'sans-serif']
      },
      boxShadow: {
        soft: '0 12px 30px rgba(56, 43, 39, 0.08)',
        card: '0 18px 45px rgba(112, 38, 58, 0.08)'
      },
      backgroundImage: {
        hero: "linear-gradient(rgba(22, 14, 12, 0.12), rgba(22, 14, 12, 0.18))"
      }
    }
  },
  plugins: []
};
