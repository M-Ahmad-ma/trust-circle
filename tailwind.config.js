/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],

  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Warm paper stock — the base surface of the whole app.
        paper: {
          50: '#fdfaf4',
          100: '#faf5ec',
          200: '#f3ecdd',
          300: '#e7dcc9',
          400: '#d9cbb2',
        },

        // Warm near-black ink, never pure #000.
        ink: {
          300: '#9a8e85',
          400: '#7b6f66',
          500: '#6b6058',
          600: '#4a423b',
          700: '#342d27',
          800: '#1c1815',
          900: '#0e0c0a',
          DEFAULT: '#1c1815',
        },

        // Oxblood/berry — the single dominant accent.
        primary: {
          50: '#faedee',
          100: '#f4dcdf',
          200: '#e9bcc3',
          300: '#da93a0',
          400: '#c4687a',
          500: '#b04456',
          600: '#a03246',
          700: '#7e2534',
          800: '#5e1b26',
          900: '#3f1119',
          fg: '#fdfaf4',
          DEFAULT: '#a03246',
        },

        // Blush — the social-proof surfaces ("People you know", "Your Circle").
        rose: {
          50: '#fdf4f4',
          100: '#faeaeb',
          200: '#f7e3e5',
          300: '#f0d2d6',
          400: '#e3b3bb',
          500: '#cf8b97',
          fg: '#7e2534',
          DEFAULT: '#f7e3e5',
        },

        // Amber — ratings only. Kept out of `accent`, which stays brass for seals.
        amber: {
          100: '#fdf3e0',
          200: '#fbe7c2',
          300: '#f0c063',
          400: '#e8ae48',
          500: '#de9a34',
          600: '#c07e22',
          700: '#96601a',
          fg: '#3f1119',
          DEFAULT: '#de9a34',
        },

        // Old brass — ratings, seals, small glints.
        accent: {
          50: '#fbf3e3',
          100: '#f5e4c2',
          200: '#ebcb8e',
          300: '#e0b25c',
          400: '#d19b33',
          500: '#c08a2e',
          600: '#a06c22',
          700: '#7c531c',
          fg: '#0e0c0a',
          DEFAULT: '#c08a2e',
        },

        // Muted foliage — secondary data series.
        moss: {
          100: '#dfe7df',
          300: '#9db3a0',
          400: '#6e8a72',
          500: '#4a6b52',
          600: '#3c5943',
          700: '#2e4434',
          fg: '#fdfaf4',
          DEFAULT: '#4a6b52',
        },

        // Sand — map wash and dividers.
        sand: {
          200: '#f0e7d3',
          300: '#eadfc8',
          400: '#e0d2b4',
          500: '#d2c09c',
          600: '#b8a37c',
        },

        success: {
          100: '#e6f4ec',
          300: '#7cc39a',
          500: '#3e9b6b',
          600: '#2f7d55',
          fg: '#fdfaf4',
          DEFAULT: '#3e9b6b',
        },
        warning: {
          300: '#e0b25c',
          500: '#c08a2e',
          600: '#a06c22',
          fg: '#0e0c0a',
          DEFAULT: '#c08a2e',
        },
        danger: {
          100: '#f0d5d4',
          500: '#9b3543',
          600: '#8e2c39',
          700: '#6e1f2a',
          fg: '#fdfaf4',
          DEFAULT: '#8e2c39',
        },

        background: '#faf5ec',
        foreground: '#1c1815',
        surface: {
          DEFAULT: '#f3ecdd',
          raised: '#fdfaf4',
          sunken: '#efe7d6',
        },
        border: '#e0d2b4',
        ring: '#a03246',
        muted: {
          DEFAULT: '#efe7d6',
          foreground: '#6b6058',
        },

        night: {
          background: '#14100e',
          surface: '#1e1917',
          raised: '#272120',
          sunken: '#191413',
          foreground: '#f2eadd',
          muted: {
            DEFAULT: '#2a2321',
            foreground: '#a99c90',
          },
          border: '#3a3130',
          paper: '#221c1a',
          ink: '#0a0808',
          primary: '#c9565f',
          accent: '#e0b25c',
          moss: '#6e8a72',
          sand: '#4a3f3a',
        },
      },

      fontFamily: {
        display: ['Fraunces_700Bold'],
        'display-semibold': ['Fraunces_600SemiBold'],
        'display-medium': ['Fraunces_500Medium'],
        'display-italic': ['Fraunces_400Regular_Italic'],
        body: ['Sora_400Regular'],
        'body-light': ['Sora_300Light'],
        'body-medium': ['Sora_500Medium'],
        'body-semibold': ['Sora_600SemiBold'],
        'body-bold': ['Sora_700Bold'],
      },

      borderRadius: {
        card: '18px',
        pill: '999px',
      },

      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.14em' }],
        '3xs': ['9px', { lineHeight: '12px', letterSpacing: '0.16em' }],
      },
    },
  },
  plugins: [],
};
