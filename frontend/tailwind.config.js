/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#f5efe1',
        parchment: '#ece2cb',
        paper: '#fdfaf1',
        navy: '#1e2c46',
        inkbl: '#2c3542',
        acad: '#3d5a80',
        sage: '#7e9070',
        terra: '#b2663f',
        mustard: '#c39a2b',
        wine: '#7d3b47',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'Palatino Linotype', 'serif'],
        sans: ['Space Grotesk', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
