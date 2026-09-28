/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Paleta da landing page (clara, "papel e tinta")
        paper: {
          DEFAULT: '#F5F2EC',
          2: '#ECE7DE',
          line: '#DAD3C7',
        },
        ink: {
          DEFAULT: '#16140F',
          soft: '#57524A',
          mute: '#8A8478',
        },
        leaf: {
          DEFAULT: '#0E6B45',
          dark: '#0A5236',
          light: '#DCEDE1',
        },
        ember: '#E8572A',
        whatsapp: {
          light: '#25D366',
          dark: '#075E54',
          chat: '#efeae2',
          bubbleOut: '#d9fdd3',
          bubbleIn: '#ffffff',
          darkBg: '#0b141a',
          darkChat: '#111b21',
          darkBubbleOut: '#005c4b',
          darkBubbleIn: '#202c33',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
