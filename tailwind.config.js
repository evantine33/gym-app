/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Override grays with pure-black tones to match Stretch Collective branding
        gray: {
          950: '#000000', // body background — true black
          900: '#0f0f0f', // sidebar, cards
          800: '#1a1a1a', // inputs, hover surfaces
          700: '#262626', // borders
          600: '#3d3d3d', // disabled / subtle
          500: '#737373', // muted text
          400: '#a3a3a3', // secondary text
          300: '#d4d4d4', // light text
          200: '#e5e5e5',
          100: '#f5f5f5',
        },
        // Match the orange from the Stretch Collective logo
        orange: {
          300: '#ffaa5e',
          400: '#ff7a30',
          500: '#f05000', // primary brand orange
          600: '#d44500',
          700: '#b33b00',
          800: '#7a2800',
          900: '#3d1400',
        },
      },
    },
  },
  plugins: [],
}
