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
      // Colors from design system (HSL format for shadcn compatibility)
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          hover: 'hsl(var(--primary-hover))',
          light: 'hsl(var(--primary-light))',
          dark: 'hsl(var(--primary-dark))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          hover: 'hsl(var(--secondary-hover))',
        },
        background: 'hsl(var(--background))',
        surface: 'hsl(var(--surface))',
        border: 'hsl(var(--border))',
        // Semantic colors
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        error: 'hsl(var(--error))',
        info: 'hsl(var(--info))',
        // Explicitly define Tremor colors to ensure they exist
        tremor: {
          brand: {
            faint: 'hsl(var(--primary-light))',
            muted: 'hsl(var(--primary-light))',
            subtle: 'hsl(var(--primary))',
            DEFAULT: 'hsl(var(--primary))',
            emphasis: 'hsl(var(--primary-dark))',
            inverted: '#ffffff',
          },
        },
      },
      // Font families from design system
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      // Font weights from design system (shadcn/Tremor range)
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      // Letter spacing from design system
      letterSpacing: {
        tighter: 'var(--tracking-tighter)',
        tight: 'var(--tracking-tight)',
        normal: 'var(--tracking-normal)',
        wide: 'var(--tracking-wide)',
        wider: 'var(--tracking-wider)',
      },
      // Spacing from design system
      spacing: {
        '0.5': 'var(--spacing-0_5)',
        '1': 'var(--spacing-1)',
        '1.5': 'var(--spacing-1_5)',
        '2': 'var(--spacing-2)',
        '2.5': 'var(--spacing-2_5)',
        '3': 'var(--spacing-3)',
        '3.5': 'var(--spacing-3_5)',
        '4': 'var(--spacing-4)',
        '5': 'var(--spacing-5)',
        '6': 'var(--spacing-6)',
        '8': 'var(--spacing-8)',
        '10': 'var(--spacing-10)',
        '12': 'var(--spacing-12)',
        '16': 'var(--spacing-16)',
        '20': 'var(--spacing-20)',
        '24': 'var(--spacing-24)',
      },
      // Border radius from design system
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-base)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
      },
      // Shadows from design system
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-base)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
      // Z-index from design system
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        fixed: 'var(--z-fixed)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        tooltip: 'var(--z-tooltip)',
      },
      // Transitions from design system
      transitionDuration: {
        fast: '150ms',
        DEFAULT: '200ms',
        slow: '300ms',
        slower: '500ms',
      },
      // Custom keyframes for loading animations
      keyframes: {
        loadingbar: {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(150%)' },
          '100%': { transform: 'translateX(400%)' },
        },
      },
      animation: {
        loadingbar: 'loadingbar 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}