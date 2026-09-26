/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F3EEE4',
        panel: '#FFFFFF',
        plum: {
          DEFAULT: '#2C1B3F',
          dark: '#1F122D',
          light: '#3D2856',
        },
        hairline: '#E4DDCC',
        dim: '#8A8071',
        brick: {
          DEFAULT: '#9C3B2E',
          dark: '#822E22',
        },
        gold: {
          DEFAULT: '#B8860B',
          dark: '#996F08',
        },
        sage: {
          DEFAULT: '#4B7A63',
          dark: '#3D6351',
        },
      },
      fontFamily: {
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
