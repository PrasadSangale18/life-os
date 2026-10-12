/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        prahari: {
          orange: '#FF5A1F',
          orangeHover: '#EA580C',
          peach: '#FFF4EC',
          peachBorder: '#FFD8BF',
          peachText: '#E04F16',
        },
        dark: {
          canvas: '#0B0F17',
          sidebar: '#0E131F',
          card: '#131924',
          cardHover: '#1A2232',
          border: 'rgba(255, 255, 255, 0.08)',
        }
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.04)',
        cardDark: '0 8px 32px rgba(0, 0, 0, 0.35)',
        glowOrange: '0 0 20px rgba(255, 90, 31, 0.25)',
      }
    },
  },
  plugins: [],
};
