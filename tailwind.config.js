/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-mint': '#00E676',
        'brand-violet': '#4C1D95',
        'charcoal': '#1F2937',
        'nola-ivory': '#FDFBF7',
        'nola-shutter': '#2E4A35',
        'nola-charcoal': '#2C2C2C',
        'nola-tobacco': '#8E5B3D',
        'nola-brass': '#C5A059',
        'nola-oxblood': '#7A2021',
        'nola-amber': '#F5E6D3',
      }
    },
  },
  plugins: [
    typography,
  ],
};
