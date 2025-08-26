// Japanese Analyzer - New Color Palette Configuration
// Add this to your tailwind.config.js file

module.exports = {
  theme: {
    extend: {
      colors: {
        // Core Palette
        'primary-red': '#DF3307',
        'dark-charcoal': '#42433B',
        'warm-brown': '#8F7E74',
        'light-beige': '#DAC8C0',
        'blue-gray': '#9FAEB3',
        
        // Brand Colors (semantic naming)
        primary: {
          DEFAULT: '#DF3307',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#DF3307',
          600: '#c62d06',
          700: '#b82a05',
          800: '#a52a04',
          900: '#7f1d1d',
        },
        
        // Text Colors
        text: {
          primary: '#42433B',
          secondary: '#8F7E74',
          tertiary: '#9FAEB3',
        },
        
        // Background Colors
        background: {
          DEFAULT: '#DAC8C0',
          surface: '#FFFFFF',
          subtle: '#f8fafc',
        },
        
        // Border Colors
        border: {
          DEFAULT: '#9FAEB3',
          light: '#e2e8f0',
          strong: '#42433B',
        },
        
        // Parts of Speech Colors
        pos: {
          noun: {
            DEFAULT: '#42433B',
            bg: '#f5f5f4',
            'bg-gradient': 'linear-gradient(135deg, #f5f5f4, #e7e5e4)',
          },
          verb: {
            DEFAULT: '#DF3307',
            bg: '#fef2f2',
            'bg-gradient': 'linear-gradient(135deg, #fef2f2, #fecaca)',
          },
          adjective: {
            DEFAULT: '#8F7E74',
            bg: '#faf7f4',
            'bg-gradient': 'linear-gradient(135deg, #faf7f4, #f3eeea)',
          },
          particle: {
            DEFAULT: '#8F7E74',
            bg: '#faf7f4',
            'bg-gradient': 'linear-gradient(135deg, #faf7f4, #f3eeea)',
          },
          adverb: {
            DEFAULT: '#9FAEB3',
            bg: '#f8fafc',
            'bg-gradient': 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
          },
          other: {
            DEFAULT: '#9FAEB3',
            bg: '#f8fafc',
            'bg-gradient': 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
          },
        },
        
        // Semantic Colors
        semantic: {
          success: '#8F7E74',
          warning: '#DF3307',
          error: '#DF3307',
          info: '#9FAEB3',
        },
        
        // State Colors
        state: {
          hover: '#c62d06',
          active: '#b82a05',
          focus: 'rgba(223, 51, 7, 0.1)',
          disabled: '#DAC8C0',
        }
      },
      
      // Custom Spacing for Japanese Text
      spacing: {
        'token': '0.75rem',
        'furigana': '0.125rem',
      },
      
      // Line Heights for Japanese Typography
      lineHeight: {
        'token': '2.5',
        'furigana': '1',
        'romaji': '1',
      },
      
      // Font Sizes for Japanese Elements
      fontSize: {
        'furigana': '0.7rem',
        'romaji': '0.65rem',
        'token': '1rem',
      },
      
      // Box Shadows with New Colors
      boxShadow: {
        'focus': '0 0 0 3px rgba(223, 51, 7, 0.1)',
        'token': '0 4px 8px rgba(0, 0, 0, 0.15)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
      
      // Border Radius
      borderRadius: {
        'token': '8px',
        'card': '12px',
      },
      
      // Animation Durations
      transitionDuration: {
        'token': '300ms',
      },
    },
  },
  
  // Custom Utilities
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.token-base': {
          display: 'inline-block',
          margin: '0.125rem',
          padding: '0.75rem',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          verticalAlign: 'top',
          minWidth: '60px',
          textAlign: 'center',
          lineHeight: '2.5',
          border: '2px solid transparent',
        },
        '.token-hover': {
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          },
        },
        '.furigana-text': {
          fontSize: '0.7rem',
          lineHeight: '1',
          marginBottom: '0.125rem',
          opacity: '0.8',
          display: 'block',
          textAlign: 'center',
        },
        '.romaji-text': {
          fontSize: '0.65rem',
          lineHeight: '1',
          marginTop: '0.125rem',
          opacity: '0.7',
          fontStyle: 'italic',
          display: 'block',
          textAlign: 'center',
        },
        '.main-text': {
          fontWeight: '600',
          fontSize: '1rem',
          lineHeight: '1',
          marginBottom: '0.125rem',
          display: 'block',
        },
      }
      
      addUtilities(newUtilities)
    }
  ],
}

// CSS Custom Properties Alternative
// Add this to your globals.css file if you prefer CSS variables:

/*
:root {
  /* Core Palette */
  --color-primary: #DF3307;
  --color-primary-hover: #c62d06;
  --color-primary-active: #b82a05;
  
  /* Text Colors */
  --color-text-primary: #42433B;
  --color-text-secondary: #8F7E74;
  --color-text-tertiary: #9FAEB3;
  
  /* Background Colors */
  --color-background: #DAC8C0;
  --color-surface: #FFFFFF;
  --color-surface-subtle: #f8fafc;
  
  /* Border Colors */
  --color-border: #9FAEB3;
  --color-border-light: #e2e8f0;
  --color-border-strong: #42433B;
  
  /* Parts of Speech */
  --color-pos-noun: #42433B;
  --color-pos-noun-bg: #f5f5f4;
  --color-pos-verb: #DF3307;
  --color-pos-verb-bg: #fef2f2;
  --color-pos-adjective: #8F7E74;
  --color-pos-adjective-bg: #faf7f4;
  --color-pos-particle: #8F7E74;
  --color-pos-particle-bg: #faf7f4;
  --color-pos-adverb: #9FAEB3;
  --color-pos-adverb-bg: #f8fafc;
  --color-pos-other: #9FAEB3;
  --color-pos-other-bg: #f8fafc;
  
  /* Semantic Colors */
  --color-success: #8F7E74;
  --color-warning: #DF3307;
  --color-error: #DF3307;
  --color-info: #9FAEB3;
  
  /* Typography */
  --font-size-furigana: 0.7rem;
  --font-size-romaji: 0.65rem;
  --font-size-token: 1rem;
  
  /* Spacing */
  --spacing-token: 0.75rem;
  --spacing-furigana: 0.125rem;
  
  /* Line Heights */
  --line-height-token: 2.5;
  --line-height-furigana: 1;
  --line-height-romaji: 1;
  
  /* Shadows */
  --shadow-focus: 0 0 0 3px rgba(223, 51, 7, 0.1);
  --shadow-token: 0 4px 8px rgba(0, 0, 0, 0.15);
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  /* Border Radius */
  --radius-token: 8px;
  --radius-card: 12px;
  
  /* Transitions */
  --transition-token: all 0.3s ease;
}
*/