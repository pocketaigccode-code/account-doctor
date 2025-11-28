/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#fdfcf8',
          100: '#f4f1ea',
          200: '#e6e2d6',
        },
        charcoal: {
          900: '#191919',
          800: '#333333',
          600: '#666666',
        },
        terracotta: {
          DEFAULT: '#d97757',
          light: '#fdf3f0',
        },
        sage: {
          DEFAULT: '#8DA399',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-merriweather)', 'serif'],
      },
    },
  },
  plugins: [],
}
