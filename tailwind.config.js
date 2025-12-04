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
        // Sidewalk 品牌渐变色系统
        purple: {
          600: '#9333EA',
        },
        pink: {
          500: '#EC4899',
        },
        orange: {
          500: '#F97316',
        },
      },
      backgroundImage: {
        'gradient-brand-full': 'linear-gradient(to right, #9333EA, #EC4899, #F97316)',
        'gradient-brand-dual': 'linear-gradient(to right, #9333EA, #EC4899)',
        // Instagram 核心渐变色
        'gradient-instagram': 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)',
        'gradient-instagram-text': 'linear-gradient(90deg, #833AB4, #E1306C, #F77737)',
        'gradient-bg-soft': 'radial-gradient(circle at 50% 0%, #fdf2f8 0%, #ffffff 70%)',
        // 光晕背景效果
        'glow-pink': 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, rgba(0,0,0,0) 70%)',
      },
      boxShadow: {
        'card': '0 10px 40px -10px rgba(0,0,0,0.08)',
        'float': '0 20px 50px -12px rgba(139, 92, 246, 0.25)',
        'instagram': '0 10px 20px rgba(236, 72, 153, 0.3)',
      },
      borderRadius: {
        'xl': '24px',
        '2xl': '32px',
        '3xl': '40px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-merriweather)', 'serif'],
      },
    },
  },
  plugins: [],
}
