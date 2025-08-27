/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui color system
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // New Japanese Analyzer Color Palette
        'japanese': {
          'red': {
            'primary': '#DF3307', // Primary Red for verbs, important actions, errors
          },
          'charcoal': {
            'dark': '#42433B', // Dark Charcoal for primary text, nouns
          },
          'brown': {
            'warm': '#8F7E74', // Warm Brown for adjectives, particles, secondary elements
          },
          'beige': {
            'light': '#DAC8C0', // Light Beige for backgrounds
          },
          'blue-gray': {
            'cool': '#9FAEB3', // Cool Blue-Gray for adverbs, supporting information, borders
          },
        },
        // Semantic color mappings for Japanese grammar
        'grammar': {
          'noun': '#42433B',        // Dark Charcoal - 名詞
          'verb': '#DF3307',        // Primary Red - 動詞
          'adjective': '#8F7E74',   // Warm Brown - 形容詞
          'particle': '#8F7E74',    // Warm Brown - 助詞
          'adverb': '#9FAEB3',      // Cool Blue-Gray - 副詞
          'auxiliary': '#DF3307',   // Primary Red - 助動詞
          'other': '#9FAEB3',       // Cool Blue-Gray - その他
          'background': '#DAC8C0',  // Light Beige - 背景
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
  darkMode: 'class',
}