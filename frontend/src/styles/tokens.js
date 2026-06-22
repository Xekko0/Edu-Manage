/**
 * Design System Tokens — EduSmart Next-Gen v2.0
 * Chuẩn quốc tế: Canvas LMS, Stripe Dashboard, K-12 SaaS
 */

// === COLOR PALETTE ===
export const colors = {
  // Brand / Primary
  brand: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#4f46e5',  // Indigo primary
    600: '#4338ca',
    700: '#3730a3',
    800: '#312e81',
    900: '#1e1b4b',
  },

  // Teal accent (secondary)
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#0d9488',  // Teal primary
    600: '#0f766e',
    700: '#115e59',
    800: '#134e4a',
    900: '#042f2e',
  },

  // Neutrals (Zinc/Slate — never pure black)
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',  // Background
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',  // Text primary (never #000)
  },

  // Status / EWS / Competency
  status: {
    critical: '#dc2626',  // Crimson Red — EWS critical, overdue, broken
    high: '#d97706',      // Amber Orange — warning, partial, at-risk
    proficient: '#059669', // Emerald Green — success, proficient, paid
    info: '#0284c7',      // Sky Blue — online, system notifications
    low: '#65a30d',       // Lime — low risk, good condition
  },

  // Semantic
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0284c7',
};

// === DENSITY ===
export const density = {
  // Management Portal (Admin/Teacher) — Compact
  compact: {
    cellPadding: 'px-2 py-1.5',
    rowGap: 'gap-1',
    fontSize: 'text-xs',
    iconSize: 14,
    borderRadius: 'rounded-md',
  },

  // Family Portal (Parent/Student) — Spacious
  spacious: {
    cellPadding: 'px-4 py-3',
    rowGap: 'gap-3',
    fontSize: 'text-sm',
    iconSize: 18,
    borderRadius: 'rounded-2xl',
  },
};

// === TYPOGRAPHY ===
export const typography = {
  display: 'text-2xl md:text-3xl font-bold tracking-tight',
  h1: 'text-xl md:text-2xl font-bold',
  h2: 'text-lg font-semibold',
  h3: 'text-base font-semibold',
  body: 'text-sm',
  caption: 'text-xs text-zinc-500',
  mono: 'font-mono text-xs',
};

// === SHADOWS ===
export const shadows = {
  card: 'shadow-sm',
  dropdown: 'shadow-lg',
  modal: 'shadow-2xl',
  sidebar: 'shadow-xl',
};

// === TRANSITIONS ===
export const transitions = {
  fast: 'transition-all duration-150 ease-in-out',
  normal: 'transition-all duration-300 ease-in-out',
  slow: 'transition-all duration-500 ease-in-out',
};

// === BREAKPOINTS ===
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};
