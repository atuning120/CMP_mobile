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

  // Superficies sobre fondo difuminado (cápsula de vidrio y lo que va dentro)
  glassOverlay: string;
  glassBorder: string;
  glassSurface: string;
  glassSurfaceBorder: string;
  // Velo sobre la foto de fondo: reemplaza a la opacidad de la imagen para que el blur lo vea
  backgroundVeil: string;
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

  glassOverlay: 'rgba(255, 255, 255, 0.30)',
  glassBorder: 'rgba(255, 255, 255, 0.55)',
  glassSurface: '#FFFFFF',
  glassSurfaceBorder: '#dadce0',
  backgroundVeil: 'rgba(248, 249, 250, 0.10)',
};

export const darkTheme: ThemeColors = {
  background: '#202124',
  card: '#292a2d',
  text: '#FFFFFF',
  textSecondary: '#9aa0a6',
  textTertiary: '#bdc1c6',
  border: '#3c4043',
  primary: '#1A73E8',
  success: '#1e8e3e',
  danger: '#d93025',
  warning: '#f9ab00',
  white: '#FFFFFF',

  cardAlt: '#303134',
  transparentPrimary: 'rgba(26, 115, 232, 0.2)',

  // Bajo: el fondo ya viene oscurecido por backgroundVeil, más opacidad tapa el desenfoque
  glassOverlay: 'rgba(16, 17, 20, 0.22)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassSurface: 'rgba(23, 24, 28, 0.88)',
  glassSurfaceBorder: 'rgba(255, 255, 255, 0.07)',
  backgroundVeil: 'rgba(32, 33, 36, 0.70)',
};
