/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        xs:   ['0.8rem',  { lineHeight: '1.4' }],
        sm:   ['0.9rem',  { lineHeight: '1.5' }],
        base: ['1rem',    { lineHeight: '1.6' }],
        lg:   ['1.125rem',{ lineHeight: '1.55' }],
        xl:   ['1.25rem', { lineHeight: '1.5' }],
        '2xl':['1.5rem',  { lineHeight: '1.4' }],
        '3xl':['1.875rem',{ lineHeight: '1.3' }],
      },
      colors: {
        brand: colors.indigo,
        slate: colors.slate,
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
    },
  },
  plugins: [],
};
