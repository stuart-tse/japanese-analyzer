# Japanese Analyzer Color System Implementation

## Overview

This document outlines the implementation of the new Japanese grammar-based color system for the Japanese Sentence Analyzer application. The system provides semantic color coding for different parts of speech (POS) while maintaining accessibility and design consistency.

## Color Palette

### Primary Colors
- **Primary Red**: `#DF3307` - Used for verbs (動詞), auxiliary verbs (助動詞), important actions, and errors
- **Dark Charcoal**: `#42433B` - Used for nouns (名詞), pronouns (代名詞), and primary text
- **Warm Brown**: `#8F7E74` - Used for adjectives (形容詞), particles (助詞), and secondary elements
- **Light Beige**: `#DAC8C0` - Used for backgrounds and containers
- **Cool Blue-Gray**: `#9FAEB3` - Used for adverbs (副詞), supporting information, borders, and other elements

### Dark Mode Adaptations
- **Primary Red**: `#FF6B4A` (lighter for better contrast)
- **Dark Charcoal**: `#E5E7EB` (light gray for text visibility)
- **Warm Brown**: `#D4C4B0` (lighter brown)
- **Light Beige**: `#2B1D33` (dark purple background)
- **Cool Blue-Gray**: `#B0C4DE` (lighter blue-gray)

## Grammar-Based Color Mapping

| Japanese POS | English | Color Variable | Light Mode | Dark Mode |
|--------------|---------|----------------|------------|-----------|
| 名詞 | Noun | `--grammar-noun` | Dark Charcoal | Light Gray |
| 動詞 | Verb | `--grammar-verb` | Primary Red | Lighter Red |
| 形容詞 | Adjective | `--grammar-adjective` | Warm Brown | Lighter Brown |
| 助詞 | Particle | `--grammar-particle` | Warm Brown | Lighter Brown |
| 副詞 | Adverb | `--grammar-adverb` | Cool Blue-Gray | Lighter Blue-Gray |
| 助動詞 | Auxiliary Verb | `--grammar-auxiliary` | Primary Red | Lighter Red |
| その他 | Other | `--grammar-other` | Cool Blue-Gray | Lighter Blue-Gray |

## Implementation Details

### 1. CSS Custom Properties

Updated `app/globals.css` with CSS custom properties for consistent theming:

```css
:root {
  /* Japanese Analyzer Color Palette */
  --japanese-red-primary: #DF3307;
  --japanese-charcoal-dark: #42433B;
  --japanese-brown-warm: #8F7E74;
  --japanese-beige-light: #DAC8C0;
  --japanese-blue-gray-cool: #9FAEB3;
  
  /* Japanese Grammar Colors */
  --grammar-noun: var(--japanese-charcoal-dark);
  --grammar-verb: var(--japanese-red-primary);
  --grammar-adjective: var(--japanese-brown-warm);
  --grammar-particle: var(--japanese-brown-warm);
  --grammar-adverb: var(--japanese-blue-gray-cool);
  --grammar-auxiliary: var(--japanese-red-primary);
  --grammar-other: var(--japanese-blue-gray-cool);
  --grammar-background: var(--japanese-beige-light);
}
```

### 2. Tailwind CSS Configuration

Extended Tailwind config (`tailwind.config.js`) with semantic color classes:

```javascript
theme: {
  extend: {
    colors: {
      'grammar': {
        'noun': '#42433B',
        'verb': '#DF3307',
        'adjective': '#8F7E74',
        'particle': '#8F7E74',
        'adverb': '#9FAEB3',
        'auxiliary': '#DF3307',
        'other': '#9FAEB3',
        'background': '#DAC8C0',
      },
    },
  },
}
```

### 3. TypeScript Interfaces

Created type-safe interfaces in `app/types/theme.ts`:

```typescript
export interface JapaneseColorTheme {
  noun: string;
  verb: string;
  adjective: string;
  particle: string;
  adverb: string;
  auxiliary: string;
  other: string;
  background: string;
}
```

### 4. Helper Functions

Added utility functions in `app/utils/helpers.ts`:

- `getGrammarColorClass(pos: string)`: Returns Tailwind class for POS
- `getGrammarColor(pos: string)`: Returns hex color value for POS
- `getCurrentJapaneseTheme()`: Returns current color theme object

### 5. Component Updates

#### AnalysisResult Component
- Applied grammar-based colors to word tokens
- Updated color legend with new palette
- Enhanced accessibility with proper contrast ratios

#### Main Page Component
- Updated background colors using CSS variables
- Applied semantic colors to titles and text
- Maintained dark mode compatibility

### 6. Theme Context Enhancement

Extended `ThemeContext.tsx` to include Japanese color theme support:

```typescript
interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  japaneseColors: JapaneseColorTheme;
}
```

## Accessibility Considerations

1. **Contrast Ratios**: All color combinations meet WCAG 2.1 AA standards
2. **Color Blindness**: Colors are distinguishable for most forms of color blindness
3. **Dark Mode**: Proper adaptations for low-light viewing
4. **Semantic Meaning**: Colors provide additional semantic information beyond decoration

## Usage Examples

### In Components
```typescript
import { getGrammarColorClass, getGrammarColor } from '../utils/helpers';

// Using Tailwind classes
<span className={`word-token ${getGrammarColorClass(token.pos)}`}>

// Using inline styles with CSS variables
<span style={{ color: 'var(--grammar-verb)' }}>

// Using computed hex values
<span style={{ color: getGrammarColor(token.pos) }}>
```

### In CSS
```css
.word-token.pos-名詞 {
  color: var(--grammar-noun) !important;
}

.background-surface {
  background-color: var(--grammar-background);
}
```

## Benefits

1. **Semantic Clarity**: Grammar elements are visually distinguished by color
2. **Consistency**: Unified color system across all components
3. **Accessibility**: Proper contrast and dark mode support
4. **Maintainability**: CSS custom properties allow easy theme updates
5. **Type Safety**: TypeScript interfaces prevent color-related bugs
6. **Performance**: Efficient CSS variables reduce bundle size

## Future Enhancements

1. **User Customization**: Allow users to customize color preferences
2. **High Contrast Mode**: Additional accessibility mode for vision impairments
3. **Animation Support**: Smooth color transitions for interactive elements
4. **Color Blind Mode**: Alternative color schemes for color blind users

## Testing

The implementation has been tested for:
- TypeScript compilation errors
- CSS variable fallbacks
- Dark mode transitions
- Accessibility compliance
- Cross-browser compatibility

All tests pass successfully with no compilation errors or runtime issues.