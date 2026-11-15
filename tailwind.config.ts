import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        thorn: {
          DEFAULT: '#2D1036', // Thorn Crown
          dark: '#1D0924',
          light: '#3E174B',
        },
        bargain: {
          DEFAULT: '#6B0733', // Blood Bargain
          dark: '#4D0424',
          light: '#8A0B43',
        },
        opal: {
          DEFAULT: '#6850AD', // Opal
          dark: '#4E3A87',
          light: '#8770CC',
        },
        fae: {
          DEFAULT: '#D97352', // Fae Fruit
          dark: '#B85A3B',
          light: '#EB9275',
        },
        parchment: '#FFF5EE',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        rpg: ['"Cinzel"', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
