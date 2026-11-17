/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    borderRadius: {
      none: '0',
      DEFAULT: '0',
      full: '9999px',
    },
    extend: {
      fontFamily: {
        display: ['"Barlow Condensed"', 'Arial Narrow', 'sans-serif'],
        sans: ['Barlow', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      colors: {
        navy: '#09111e',
        paper: '#F4F1EA',
        accent: '#FACC15',
        'on-navy': {
          DEFAULT: '#ffffff',
          muted: '#cbd5e1',
          faint: '#9aa3b2',
        },
        'on-paper': {
          muted: '#4b5563',
          rule: '#7c8392',
        },
      },
    },
  },
  plugins: [],
};
