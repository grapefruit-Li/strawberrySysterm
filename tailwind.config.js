/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        strawberry: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#E63946',
          600: '#C62D3A',
          700: '#A3232F',
          800: '#7F1A24',
          900: '#5C1219',
        },
        forest: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#2D6A4F',
          600: '#245840',
          700: '#1B4631',
          800: '#123422',
          900: '#092213',
        },
        midnight: {
          50: '#F3F4F6',
          100: '#E5E7EB',
          200: '#D1D5DB',
          300: '#9CA3AF',
          400: '#6B7280',
          500: '#4B5563',
          600: '#374151',
          700: '#2D3142',
          800: '#232738',
          900: '#1A1B2E',
        },
      },
      fontFamily: {
        heading: ['"DM Serif Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
