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
    },
  },
  plugins: [require('@tailwindcss/typography')],
  darkMode: 'class',
}