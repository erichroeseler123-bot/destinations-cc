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
      }
    },
  },
  plugins: [
    typography,
  ],
};
