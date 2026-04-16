/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        catppuccin: {
          bg: 'var(--bg-primary)',
          'bg-soft': 'var(--bg-secondary)',
          text: 'var(--text-primary)',
          'text-soft': 'var(--text-secondary)',
          accent: 'var(--accent-primary)',
          'accent-soft': 'var(--accent-secondary)',
        }
      }
    },
  },
  darkMode: 'class',
  plugins: [],
}
