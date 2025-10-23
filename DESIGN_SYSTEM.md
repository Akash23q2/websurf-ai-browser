# WebSurf AI - Design System

## Overview
This design system combines Claude's minimalist aesthetic with Gemini's modern depth and gradients, creating a premium, clean interface.

## Color Palette

### Primary Colors
- **Primary Blue**: `#4A90FF` - Main action color
- **Primary Hover**: `#357AE8` - Hover state for primary elements
- **Primary Soft**: `rgba(74, 144, 255, 0.15)` - Subtle backgrounds
- **Secondary Purple**: `#8B5CF6` - Accent and gradients
- **Accent Warm**: `#F59E0B` - Highlights and warmth
- **Accent Cool**: `#06B6D4` - Cool accents

### Background Colors
- **Primary**: `#0F0F0F` - Main background
- **Secondary**: `#1A1A1A` - Secondary surfaces
- **Elevated**: `#242424` - Raised elements
- **Glass**: `rgba(30, 30, 30, 0.8)` - Glassmorphic surfaces
- **Overlay**: `rgba(0, 0, 0, 0.6)` - Modal overlays

### Text Colors
- **Primary**: `#FFFFFF` - Main text
- **Secondary**: `#B4B4B4` - Secondary text
- **Tertiary**: `#6B6B6B` - Muted text
- **Inverse**: `#0F0F0F` - Text on light backgrounds

### Border Colors
- **Subtle**: `rgba(255, 255, 255, 0.08)`
- **Medium**: `rgba(255, 255, 255, 0.12)`
- **Strong**: `rgba(255, 255, 255, 0.2)`

### State Colors
- **Error**: `#EF4444`
- **Success**: `#10B981`
- **Warning**: `#F59E0B`

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif;
```

### Font Smoothing
- `-webkit-font-smoothing: antialiased`
- `-moz-osx-font-smoothing: grayscale`

### Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

## Spacing System
- Base unit: 4px
- Common spacings: 8px, 12px, 16px, 20px, 24px, 32px

## Border Radius
- Small: 6px-8px
- Medium: 10px-12px
- Large: 14px-16px
- XL: 20px
- Circle: 50%

## Shadows
- **Small**: `0 2px 8px rgba(0, 0, 0, 0.3)`
- **Medium**: `0 4px 16px rgba(0, 0, 0, 0.4)`
- **Large**: `0 8px 32px rgba(0, 0, 0, 0.5)`
- **Glow**: `0 0 24px rgba(74, 144, 255, 0.3)`

## Glassmorphism
All glass surfaces use:
- `backdrop-filter: blur(40px) saturate(150%)`
- `-webkit-backdrop-filter: blur(40px) saturate(150%)`
- Semi-transparent backgrounds
- Subtle borders

## Animation
### Timing Functions
- Standard: `cubic-bezier(0.4, 0, 0.2, 1)`
- Bounce: `cubic-bezier(0.16, 1, 0.3, 1)`

### Transitions
- Fast: 0.15s
- Standard: 0.2s
- Slow: 0.3s

## Components

### Buttons
- **Primary**: Blue gradient background, white text
- **Icon**: Subtle background with hover effects
- **Danger**: Red with transparent background

### Inputs
- Border: 1.5px solid
- Focus: Primary color border with soft glow
- Hover: Stronger border color

### Message Bubbles
- **Bot**: Secondary background
- **User**: Primary blue background with glow
- Padding: 10px 14px (with 32px bottom for copy button)
- Border radius: 12px

### Cards & Surfaces
- Glass background
- Medium borders
- Shadow-md for elevation

## Accessibility
- High contrast text (white on dark)
- Clear focus states
- Sufficient padding for touch targets (min 34px)
- Semantic HTML structure
- Smooth animations with reduced motion support

## Best Practices
1. Always use CSS variables for colors
2. Apply glassmorphism consistently
3. Use smooth transitions (cubic-bezier)
4. Maintain consistent spacing
5. Follow the color hierarchy
6. Use appropriate shadows for depth
7. Keep animations subtle and fast
