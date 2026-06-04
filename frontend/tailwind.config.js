/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0d9488',
          light: '#14b8a6',
          dark: '#0f766e',
        },
        primary: {
          DEFAULT: '#0d9488',
          light: '#14b8a6',
          dark: '#0f766e',
          foreground: '#ffffff',
        },
        surface: {
          DEFAULT: '#f8fafc',
          card: '#ffffff',
        },
        accent: {
          DEFAULT: '#06b6d4',
          muted: '#ecfeff',
        },
      },
      borderRadius: {
        card: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)',
        popover: '0 12px 32px rgb(15 23 42 / 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
