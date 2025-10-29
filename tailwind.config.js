/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand': '#000000',
        'charcoal': '#1a1a1a',
        'light': {
          100: '#f8f9fa',
          200: '#e9ecef',
          300: '#dee2e6',
        },
        'mid': {
          300: '#6c757d',
          400: '#868e96',
          600: '#495057',
        },
        'dark': {
          100: '#495057',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
