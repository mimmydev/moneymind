// Design System - Centralized color configuration
// This file provides a single source of truth for all colors used in the application

// Semantic color palette
export const colors = {
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    dark: '#111827',
    darkSecondary: '#1f2937',
  },

  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
    dark: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
      tertiary: '#9ca3af',
    },
  },

  // Border colors
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    dark: '#9ca3af',
    darkMode: '#374151',
  },

  // Neutral colors
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Status colors
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
} as const;

// Chart-specific colors
export const chartColors = {
  // Primary chart colors
  primary: '#10b981',
  secondary: '#3b82f6',
  accent: '#8b5cf6',

  // Chart element colors
  line: {
    primary: '#10b981',
    secondary: '#3b82f6',
    accent: '#8b5cf6',
  },

  point: {
    background: '#10b981',
    border: '#ffffff',
    hover: '#059669',
  },

  fill: {
    primary: 'rgba(16, 185, 129, 0.1)',
    secondary: 'rgba(59, 130, 246, 0.1)',
  },

  // Pie/Doughnut chart colors
  pie: {
    primary: '#10b981',
    secondary: '#3b82f6',
    accent: '#8b5cf6',
  },

  // Tooltip colors
  tooltip: {
    background: 'rgba(0, 0, 0, 0.8)',
    title: '#ffffff',
    body: '#ffffff',
    border: '#10b981',
  },

  // Dark mode tooltip
  tooltipDark: {
    background: 'rgba(31, 41, 55, 0.95)',
    title: '#ffffff',
    body: '#ffffff',
    border: '#10b981',
  },
} as const;

// Category-specific colors for expense categories
export const categoryColors = {
  // Transport category
  transport: {
    grab: '#3b82f6',
    fuel: '#1e40af',
    parking: '#60a5fa',
  },

  // Food category
  food: {
    mamak: '#ef4444',
    restaurant: '#f97316',
    coffee: '#a855f7',
    japan: '#84cc16',
  },

  // Shopping category
  shopping: {
    online: '#10b981',
    offline: '#8b5cf6',
  },

  // Other categories
  entertainment: '#ec4899',
  utilities: '#6b7280',
  rent: '#059669',
  healthcare: '#dc2626',
  education: '#7c3aed',
  miscellaneous: '#f59e0b',
} as const;

// Semantic category color mapping
export const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    // Transport
    transport_grab: categoryColors.transport.grab,
    transport_fuel: categoryColors.transport.fuel,
    transport_parking: categoryColors.transport.parking,

    // Food
    food_mamak: categoryColors.food.mamak,
    food_restaurant: categoryColors.food.restaurant,
    food_coffee: categoryColors.food.coffee,
    food_japan: categoryColors.food.japan,

    // Shopping
    shopping_online: categoryColors.shopping.online,
    shopping_offline: categoryColors.shopping.offline,

    // Other categories
    entertainment: categoryColors.entertainment,
    utilities: categoryColors.utilities,
    rent: categoryColors.rent,
    healthcare: categoryColors.healthcare,
    education: categoryColors.education,
    other_miscellaneous: categoryColors.miscellaneous,
  };

  return colorMap[category] || colors.neutral[500];
};

// Dark mode color utilities
export const darkModeColors = {
  text: {
    primary: colors.text.dark.primary,
    secondary: colors.text.dark.secondary,
    tertiary: colors.text.dark.tertiary,
  },

  background: {
    primary: colors.background.dark,
    secondary: colors.background.darkSecondary,
  },

  border: {
    primary: colors.border.darkMode,
  },

  grid: {
    primary: 'rgba(75, 85, 99, 0.3)',
    secondary: 'rgba(156, 163, 175, 0.2)',
  },
} as const;

// Export all colors for easy access
export default {
  colors,
  chartColors,
  categoryColors,
  getCategoryColor,
  darkModeColors,
};
