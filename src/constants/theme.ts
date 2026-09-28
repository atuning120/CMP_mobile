export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string; // I will add this since it's used in LoginScreen
  border: string;
  primary: string;
  success: string;
  danger: string;
  warning: string;
  
  // Specific properties used by quickOp unselected, ms button, etc.
  // To keep it strictly to the requested keys, I'll map them.
  cardAlt: string; // for MS button dark theme or inputs
  transparentPrimary: string;
}

export const lightTheme: ThemeColors = {
  background: '#f1f5f9',
  card: '#ffffff',
  text: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  border: '#e2e8f0',
  primary: '#1A73E8', // User explicitly asked for this
  success: '#34d399',
  danger: '#f87171',
  warning: '#f59e0b',
  
  cardAlt: '#f8fafc',
  transparentPrimary: 'rgba(26, 115, 232, 0.15)',
};

export const darkTheme: ThemeColors = {
  background: '#0A1017',
  card: '#101824',
  text: '#ffffff',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  border: '#1e293b',
  primary: '#1A73E8', 
  success: '#34d399',
  danger: '#f87171',
  warning: '#f59e0b',

  cardAlt: '#0B121C',
  transparentPrimary: 'rgba(26, 115, 232, 0.15)',
};
