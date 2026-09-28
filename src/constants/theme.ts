export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  primary: string;
  success: string;
  danger: string;
  warning: string;
  white: string;

  cardAlt: string;
  transparentPrimary: string;
}

export const lightTheme: ThemeColors = {
  background: '#f8f9fa',
  card: '#FFFFFF',
  text: '#202124',
  textSecondary: '#5f6368',
  textTertiary: '#80868b',
  border: '#dadce0',
  primary: '#1A73E8',
  success: '#1e8e3e',
  danger: '#d93025',
  warning: '#f9ab00',
  white: '#FFFFFF',

  cardAlt: '#f1f3f4',
  transparentPrimary: 'rgba(26, 115, 232, 0.1)',
};

export const darkTheme: ThemeColors = {
  background: '#202124',
  card: '#292a2d',
  text: '#FFFFFF',
  textSecondary: '#9aa0a6',
  textTertiary: '#bdc1c6',
  border: '#3c4043',
  primary: '#1A73E8',
  success: '#81c995',
  danger: '#f28b82',
  warning: '#fde293',
  white: '#FFFFFF',

  cardAlt: '#303134',
  transparentPrimary: 'rgba(26, 115, 232, 0.2)',
};
