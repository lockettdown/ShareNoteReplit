/**
 * ShareNote design tokens — derived from the Figma design (key: 5qer5C4vmD9pfCspOcjHay).
 * Primary: #9b5cf6 purple · Background: #f4efff lavender
 * Strong purple (#7437d8) used for section headings per Figma.
 */

const colors = {
  light: {
    // Legacy aliases
    text: '#25232b',
    tint: '#9b5cf6',

    // Core surfaces
    background: '#f4efff',
    foreground: '#25232b',

    // Cards / elevated surfaces
    card: '#ffffff',
    cardForeground: '#25232b',
    cardSoft: '#fbf9ff',
    chip: '#f7f4fb',
    tabBar: '#F4F0FF',

    // Primary action (buttons, links, active states)
    primary: '#9b5cf6',
    primaryForeground: '#ffffff',

    // Stronger purple — used for section headings.
    primaryStrong: '#7437d8',

    // Secondary surfaces (icon backgrounds, toggles)
    secondary: '#efe8ff',
    secondaryForeground: '#7437d8',

    // Muted / subdued elements
    muted: '#eee7fb',
    mutedForeground: '#625b6f',

    // Accent highlights (drag handles, orbs)
    accent: '#d9c3ff',
    accentForeground: '#25232b',
    accentTeal: '#12c7a0',
    accentPink: '#f04e9b',
    accentOrange: '#f6a53a',
    accentBlue: '#5bb6ff',
    accentDangerSoft: '#fff0f7',

    // Destructive actions
    destructive: '#e83f88',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#e1d8f2',
    input: '#e1d8f2',
    divider: '#ece6f5',
    overlay: 'rgba(37, 35, 43, 0.5)',
    shadow: '#9b5cf6',

    // Decorative orb colors (Login screen)
    orbPurple: '#e6d8ff',
    orbBlue: '#d7efff',
  },

  dark: {
    text: '#f0ebff',
    tint: '#a87ef5',
    background: '#13101e',
    foreground: '#f0ebff',
    card: '#1e1830',
    cardForeground: '#f0ebff',
    cardSoft: '#251d3a',
    chip: '#2b243a',
    tabBar: '#F4F0FF',
    primary: '#9b5cf6',
    primaryForeground: '#ffffff',
    primaryStrong: '#b088f5',
    secondary: '#2d1f5c',
    secondaryForeground: '#c8b6f0',
    muted: '#1e1830',
    mutedForeground: '#8b7ab0',
    accent: '#3a2870',
    accentForeground: '#f0ebff',
    accentTeal: '#2dd4bf',
    accentPink: '#f472b6',
    accentOrange: '#fbbf24',
    accentBlue: '#60a5fa',
    accentDangerSoft: '#3a1b31',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#2d1f5c',
    input: '#2d1f5c',
    divider: '#2d1f5c',
    overlay: 'rgba(10, 8, 16, 0.65)',
    shadow: '#000000',
    orbPurple: '#3a2870',
    orbBlue: '#1a2e5a',
  },

  // Border radius in px
  radius: 16,
};

export default colors;
