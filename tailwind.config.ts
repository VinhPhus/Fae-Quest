import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Obsidian & Steel Monochrome (6 Tiers)
        obsidian: {
          deep: '#06141B',      // Tier 1: Deepest Background
          surface: '#11212D',   // Tier 2: Primary Surface
          elevated: '#253745',  // Tier 3: Elevated Surface & Border
          accent: '#4A5C6A',    // Tier 4: Accent & Progress
          muted: '#9BA8AB',     // Tier 5: Muted Text & Secondary Icons
          silver: '#CCD0CF',    // Tier 6: Primary Text & CTA
        },
        // Mapped legacy tokens for seamless backward compatibility
        thorn: {
          DEFAULT: '#11212D',
          dark: '#06141B',
          light: '#253745',
        },
        bargain: {
          DEFAULT: '#253745',
          dark: '#11212D',
          light: '#4A5C6A',
        },
        opal: {
          DEFAULT: '#4A5C6A',
          dark: '#253745',
          light: '#9BA8AB',
        },
        fae: {
          DEFAULT: '#CCD0CF',
          dark: '#9BA8AB',
          light: '#FFFFFF',
        },
        parchment: '#CCD0CF',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        rpg: ['"Playfair Display"', '"Cormorant Garamond"', 'serif'],
        cinzel: ['"Cinzel"', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
