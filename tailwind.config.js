/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['Sora', '"Instrument Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          /** RGB + `<alpha-value>` để Tailwind sinh các lớp dạng `brand-coral/60`, `shadow-brand-coral/20`, v.v. */
          ink: 'rgb(7 8 13 / <alpha-value>)',
          panel: 'rgb(14 16 24 / <alpha-value>)',
          accent: 'rgb(225 29 72 / <alpha-value>)',
          coral: 'rgb(244 63 94 / <alpha-value>)',
          gold: 'rgb(251 191 36 / <alpha-value>)',
        },
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out forwards',
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
}
