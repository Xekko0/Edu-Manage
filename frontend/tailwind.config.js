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
          ink: '#042f2e',
          soft: '#ccfbf1',
        },
        primary: {
          DEFAULT: '#0d9488',
          light: '#14b8a6',
          dark: '#0f766e',
          foreground: '#ffffff',
        },
        surface: {
          DEFAULT: '#f6f7f9',
          card: '#ffffff',
          muted: '#eef2f6',
          subtle: '#fafafa',
        },
        accent: {
          DEFAULT: '#06b6d4',
          muted: '#ecfeff',
        },
        ink: {
          DEFAULT: '#172033',
          muted: '#5f6b7a',
          soft: '#8a95a3',
        },
      },
      borderRadius: {
        card: '0.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.06), 0 8px 24px rgb(15 23 42 / 0.04)',
        popover: '0 18px 48px rgb(15 23 42 / 0.16)',
        nav: '0 10px 30px rgb(15 23 42 / 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
