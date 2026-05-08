import type { Config } from 'tailwindcss'
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A96E',
          light: '#F0DEB8',
          lighter: '#FBF5E8',
          dark: '#8B6914',
        },
        blush: {
          DEFAULT: '#F4C5C5',
          dark: '#9B4A4A',
        },
        luma: {
          black: '#141414',
          dark: '#1E1E1E',
          mid: '#4A4A4A',
          muted: '#888888',
          border: '#E5DFD3',
          bg: '#FAF8F5',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
