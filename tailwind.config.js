/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Mobile-first breakpoints for game UI
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      // Game-specific animations and transitions
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-fast': 'pulse 1s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      // Colors optimized for game UI
      colors: {
        'game-primary': '#3B82F6',
        'game-secondary': '#8B5CF6',
        'game-accent': '#F59E0B',
        'game-success': '#10B981',
        'game-danger': '#EF4444',
        'game-dark': '#1F2937',
        'game-light': '#F9FAFB',
      },
      // Touch-friendly spacing for mobile
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
} 