/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Task-it brand colors
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
          success: 'var(--brand-success)',
          warning: 'var(--brand-warning)',
          danger: 'var(--brand-danger)',
        },
        // Task-it priority colors
        priority: {
          urgent: 'var(--priority-urgent)',
          important: 'var(--priority-important)',
          nice: 'var(--priority-nice)',
          delegate: 'var(--priority-delegate)',
          big3: 'var(--priority-big3)',
          sport: 'var(--priority-sport)',
        },
        // Semantic colors
        background: 'var(--color-background)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          focus: 'var(--color-border-focus)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
      },
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        'card': 'var(--card-padding)',
        'card-compact': 'var(--card-padding-compact)',
      },
      borderRadius: {
        'card': 'var(--card-radius)',
      },
      minHeight: {
        'touch': 'var(--touch-target-min)',
        'button': 'var(--button-height)',
        'button-compact': 'var(--button-height-compact)',
      },
      minWidth: {
        'touch': 'var(--touch-target-min)',
      },
      height: {
        'button': 'var(--button-height)',
        'button-compact': 'var(--button-height-compact)',
        'input': 'var(--input-height)',
        'bottom-nav': 'var(--bottom-nav-height)',
        'header': 'var(--header-height)',
      },
      boxShadow: {
        'card': 'var(--card-shadow)',
        'elevated': 'var(--card-shadow-elevated)',
      },
      fontSize: {
        'xs': ['var(--font-size-xs)', { lineHeight: '1.4' }],
        'sm': ['var(--font-size-sm)', { lineHeight: '1.4' }],
        'base': ['var(--font-size-base)', { lineHeight: '1.6' }],
        'lg': ['var(--font-size-lg)', { lineHeight: '1.6' }],
        'xl': ['var(--font-size-xl)', { lineHeight: '1.6' }],
        '2xl': ['var(--font-size-2xl)', { lineHeight: '1.4' }],
        '3xl': ['var(--font-size-3xl)', { lineHeight: '1.2' }],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: 'var(--spacing-md)',
          sm: 'var(--spacing-lg)',
          lg: 'var(--spacing-xl)',
          xl: 'var(--spacing-2xl)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-8px)' },
          '60%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}