/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0d0b08',
          900: '#14110d',
          800: '#1c1812',
          700: '#2a241b',
          600: '#3d3428',
        },
        paper: {
          50: '#f7f1e4',
          100: '#efe4cf',
          200: '#e2d2b3',
        },
        copper: {
          400: '#e0894d',
          500: '#d46a2f',
          600: '#b4531e',
        },
        brass: '#c9a15b',
        moss: '#6f8b6a',
        ember: '#c94a38',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        stamp: '0 18px 50px rgba(0,0,0,0.35)',
        card: '0 8px 24px rgba(0,0,0,0.22)',
      },
    },
  },
  plugins: [],
};
