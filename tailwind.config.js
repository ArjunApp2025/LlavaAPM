/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // VisionX color palette
        'vx': {
          'bg': '#141929',
          'bg-alt': '#1A2840',
          'surface': '#1F2B45',
          'border': '#2D3B59',
          'primary': '#11D8F7',
          'primary-soft': '#1199A2',
          'purple': '#6C69FC',
          'orange': '#EA570B',
          'red': '#C05E38',
          'green': '#00C853',
          'text': '#FFFFFF',
          'text-muted': '#B3B4C4',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'vx': '20px',
        'vx-lg': '24px',
      },
      boxShadow: {
        'vx': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'vx-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}


