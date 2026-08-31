/**
 * ShareNote design tokens — derived from the Figma design (key: 5qer5C4vmD9pfCspOcjHay).
 * Primary: #935bf0 purple · Background: #f4f0ff lavender
 * Strong purple (#7236cd) used for section headings per Figma.
 */

const colors = {
  light: {
    // Legacy aliases
    text: '#1c1b1b',
    tint: '#935bf0',

    // Core surfaces
    background: '#f4f0ff',
    foreground: '#1c1b1b',

    // Cards / elevated surfaces
    card: '#ffffff',
    cardForeground: '#1c1b1b',

    // Primary action (buttons, links, active states)
    primary: '#935bf0',
    primaryForeground: '#ffffff',

    // Stronger purple — used for section headings (Figma: #7236cd)
    primaryStrong: '#7236cd',

    // Secondary surfaces (icon backgrounds, toggles)
    secondary: '#ede8ff',
    secondaryForeground: '#935bf0',

    // Muted / subdued elements
    muted: '#f0ecff',
    mutedForeground: '#4a4454',

    // Accent highlights (drag handles, orbs)
    accent: '#d4bbff',
    accentForeground: '#1c1b1b',

    // Destructive actions
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#e8e0f7',
    input: '#e8e0f7',

    // Decorative orb colors (Login screen)
    orbPurple: '#d4bbff',
    orbBlue: '#a4c9ff',
  },

  dark: {
    text: '#f0ebff',
    tint: '#a87ef5',
    background: '#13101e',
    foreground: '#f0ebff',
    card: '#1e1830',
    cardForeground: '#f0ebff',
    primary: '#935bf0',
    primaryForeground: '#ffffff',
    primaryStrong: '#b088f5',
    secondary: '#2d1f5c',
    secondaryForeground: '#c8b6f0',
    muted: '#1e1830',
    mutedForeground: '#8b7ab0',
    accent: '#3a2870',
    accentForeground: '#f0ebff',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#2d1f5c',
    input: '#2d1f5c',
    orbPurple: '#3a2870',
    orbBlue: '#1a2e5a',
  },

  // Border radius in px
  radius: 16,
};

export default colors;
