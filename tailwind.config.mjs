import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        putrajaya: {
          navy: '#09111e',
          surface: '#0f172a',
          card: '#131f33',
          accent: '#FACC15',
          text: '#ffffff',
          muted: '#cbd5e1',
        },
      },
    },
  },
  plugins: [],
};
