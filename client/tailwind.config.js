/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Add path for Tremor components
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Safelist ALL color variations for Tremor charts
    {
      pattern: /^(bg|text|border|fill|stroke)-(blue|emerald|slate|amber|purple|indigo|red|green|yellow|gray)-(50|100|200|300|400|500|600|700|800|900)$/,
      variants: ['hover', 'focus', 'active'],
    },
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
        // Explicitly define Tremor colors to ensure they exist
        tremor: {
          brand: {
            faint: '#eff6ff',
            muted: '#bfdbfe',
            subtle: '#60a5fa',
            DEFAULT: '#3b82f6',
            emphasis: '#1d4ed8',
            inverted: '#ffffff',
          },
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}