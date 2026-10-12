/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
         brand: {
            50:  '#EAF3FA',
            100: '#D3E6F4',
            200: '#A6CDE9',
            300: '#78B3DD',
            400: '#3F90CC',
            500: '#0067B1',
            600: '#0067B1',
            700: '#00508C',
            800: '#003A66',
            900: '#0B2A4A',
            950: '#071A2E',
          },
          gold: { 100: '#FFF3B8', 300: '#FFE566', 500: '#FFD200', 600: '#E6BC00' },

          secondary: {
            50:  '#EBFFED',
            100: '#BAEFBF',
            200: '#9BDDA2',
            300: '#7CCA85',
            400: '#5BB768',
            500: '#28A645',
            600: '#008610',
            700: '#006500',
            800: '#004400',
            900: '#002500',
            950: '#000800',
          },

          accent: {
            50:  '#FFDEDC',
            100: '#FFC2C0',
            200: '#FFA2A2',
            300: '#FA8384',
            400: '#E96267',
            500: '#DB3545',
            600: '#BF0022',
            700: '#9B0000',
            800: '#740000',
            900: '#4C0000',
            950: '#270000',
          },

          typo: {
            50:  '#F9F9F9',
            100: '#DCDCDC',
            200: '#BFBFC0',
            300: '#A3A3A4',
            400: '#888889',
            500: '#6E6E6F',
            600: '#555555',
            700: '#3D3D3E',
            800: '#272727',
            900: '#121212',
            950: '#030303',
          },

          warning: {
            50:  '#FEFDE8',
            100: '#FFFDC2',
            200: '#FFF887',
            300: '#FFED43',
            400: '#FFDE21',
            500: '#EFC203',
            600: '#CE9700',
            700: '#A46B04',
            800: '#88540B',
            900: '#734410',
            950: '#432305',
          },
        cream: {
          50:  '#FBF8F2',
          100: '#F5EFE6',
          200: '#ECE2D2',
        },
      },
      // `shadow-xs` is a Tailwind v4 default token, not present in v3.4
      // (installed here) — defined explicitly so the Bento dashboard's
      // `shadow-xs` card surfaces (BentoTile/BentoFunnelCard/
      // BentoActionQueue) render a shadow instead of silently no-op'ing.
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
}
