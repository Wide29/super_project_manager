import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        skyBrand: '#62B6FF',
        skySoft: '#DFF1FF',
        skyStrong: '#1F7AE0',
        slateDeep: '#1F2A44',
        panelLine: '#D7E7F5',
        cloud: '#F6FBFF'
      },
      boxShadow: {
        panel: '0 14px 38px rgba(32, 82, 140, 0.08)'
      },
      borderRadius: {
        panel: '18px'
      }
    }
  },
  plugins: []
} satisfies Config;
