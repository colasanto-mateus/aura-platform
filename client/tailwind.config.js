/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          darkest: '#1e1f22',
          darker: '#2b2d31',
          sidebar: '#1e1f22',
          channel: '#2b2d31',
          chat: '#313338',
          hover: '#35373c',
          text: '#dbdee1',
          muted: '#949ba4',
          accent: '#5865f2',
          accentHover: '#4752c4',
          green: '#23a55a',
          red: '#f23f43',
          yellow: '#f0b232',
          nitro: '#f47fff'
        }
      },
      fontFamily: {
        orbitron: ["'Orbitron'", "sans-serif"],
        pixel: ["'Press Start 2P'", "monospace"],
        fira: ["'Fira Code'", "monospace"],
        comfortaa: ["'Comfortaa'", "cursive"],
        bungee: ["'Bungee'", "sans-serif"]
      }
    },
  },
  plugins: [],
}
