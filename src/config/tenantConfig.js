/**
 * Configuración Multi-tenant / Marca Blanca (SaaS) para el ERP
 * Permite personalizar el nombre del comercio, datos fiscales, divisas y paleta de colores
 * mediante variables de entorno (.env).
 */

export const tenantConfig = {
  // Identidad comercial
  storeName: import.meta.env.VITE_STORE_NAME || 'ModaDaw',
  storeTagline: import.meta.env.VITE_STORE_TAGLINE || 'Sistema de Gestión Comercial y TPV',

  // Datos fiscales y de contacto para Tickets, Facturas y Documentos oficiales
  company: {
    legalName: import.meta.env.VITE_COMPANY_LEGAL_NAME || 'MODA URBAN S.L.',
    activity: import.meta.env.VITE_COMPANY_ACTIVITY || 'Comercio Minorista de Confección Textil y Ropa',
    cif: import.meta.env.VITE_COMPANY_CIF || 'B-99887766',
    address: import.meta.env.VITE_COMPANY_ADDRESS || 'Calle Gran Vía 10 · 28013 Madrid (España)',
    phone: import.meta.env.VITE_COMPANY_PHONE || '(+34) 91 555 44 33',
    email: import.meta.env.VITE_COMPANY_EMAIL || 'facturas@modaurban.es',
    bank: import.meta.env.VITE_COMPANY_BANK || 'CaixaBank / Operativa Comercial',
    iban: import.meta.env.VITE_COMPANY_IBAN || 'ES91 2100 0418 4502 0005 1324',
    regData: import.meta.env.VITE_COMPANY_REG_DATA || 'Inscrita en el Registro Mercantil de Madrid, Tomo 34.201, Folio 88, Sección 8, Hoja M-615243',
    website: import.meta.env.VITE_COMPANY_WEBSITE || 'www.modadaw.es',
  },

  // Configuración de Venta y Facturación
  pos: {
    currencySymbol: import.meta.env.VITE_CURRENCY_SYMBOL || '€',
    defaultTaxRate: Number(import.meta.env.VITE_DEFAULT_TAX_RATE) || 21,
  },

  // Paleta de colores personalizable (Branding)
  theme: {
    primary: import.meta.env.VITE_THEME_PRIMARY_COLOR || '#334155',
    primaryHover: import.meta.env.VITE_THEME_PRIMARY_HOVER || '#1e293b',
    navbarBg: import.meta.env.VITE_THEME_NAVBAR_BG || '#1e293b',
    accent: import.meta.env.VITE_THEME_ACCENT_COLOR || '#0284c7',
    bgLight: import.meta.env.VITE_THEME_BG_LIGHT || '#eaedf1',
    bgDark: import.meta.env.VITE_THEME_BG_DARK || '#0b1120',
  },
};

/**
 * Paletas prediseñadas para demostración en caliente (Multi-tenant SaaS)
 */
export const THEME_PRESETS = {
  default: {
    id: 'default',
    label: 'Pizarra',
    icon: '🏢',
    storeName: tenantConfig.storeName || 'ModaDaw',
    primary: tenantConfig.theme.primary,
    primaryHover: tenantConfig.theme.primaryHover,
    navbarBg: tenantConfig.theme.navbarBg,
    navbarDark: '#0f172a',
    accent: tenantConfig.theme.accent,
    bgLight: tenantConfig.theme.bgLight,
    bgDark: tenantConfig.theme.bgDark,
    surfaceDark: '#151e2e',
    surfaceSubtleDark: '#0f172a',
    borderDark: '#2d3e53',
  },
  rose: {
    id: 'rose',
    label: 'Rosa',
    icon: '🌸',
    storeName: 'Boutique Rose',
    primary: '#be185d',
    primaryHover: '#9d174d',
    navbarBg: '#831843',
    navbarDark: '#500724',
    accent: '#ec4899',
    bgLight: '#fdf2f8',
    bgDark: '#1a0510',
    surfaceDark: '#2a081c',
    surfaceSubtleDark: '#1f0716',
    borderDark: '#5c1638',
  },
  emerald: {
    id: 'emerald',
    label: 'Esmeralda',
    icon: '🌿',
    storeName: 'Eco Fashion',
    primary: '#047857',
    primaryHover: '#065f46',
    navbarBg: '#064e3b',
    navbarDark: '#022c22',
    accent: '#10b981',
    bgLight: '#f0fdf4',
    bgDark: '#021a13',
    surfaceDark: '#062c20',
    surfaceSubtleDark: '#032017',
    borderDark: '#115e45',
  },
};

/**
 * Aplica una paleta predefinida en caliente sin necesidad de reiniciar la app
 */
export function applyThemePreset(presetKeyOrObject) {
  const preset = typeof presetKeyOrObject === 'string'
    ? THEME_PRESETS[presetKeyOrObject] || THEME_PRESETS.default
    : presetKeyOrObject;

  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (preset.primary) root.style.setProperty('--erp-primary', preset.primary);
  if (preset.primaryHover) root.style.setProperty('--erp-primary-hover', preset.primaryHover);
  if (preset.navbarBg) root.style.setProperty('--erp-navbar-bg', preset.navbarBg);
  if (preset.navbarDark) root.style.setProperty('--erp-navbar-dark', preset.navbarDark);
  if (preset.accent) root.style.setProperty('--erp-accent', preset.accent);
  if (preset.bgLight) root.style.setProperty('--erp-bg-light', preset.bgLight);
  if (preset.bgDark) root.style.setProperty('--erp-bg-dark', preset.bgDark);
  if (preset.surfaceDark) root.style.setProperty('--erp-surface-dark', preset.surfaceDark);
  if (preset.surfaceSubtleDark) root.style.setProperty('--erp-surface-subtle-dark', preset.surfaceSubtleDark);
  if (preset.borderDark) root.style.setProperty('--erp-border-dark', preset.borderDark);

  const isDark = root.classList.contains('dark');
  root.style.setProperty('--erp-bg', isDark ? (preset.bgDark || '#0b1120') : (preset.bgLight || '#eaedf1'));

  if (preset.storeName) {
    tenantConfig.storeName = preset.storeName;
    document.title = `${preset.storeName} ERP · ${tenantConfig.storeTagline}`;
  }

  try {
    localStorage.setItem('modaurban_theme_preset', preset.id || 'custom');
  } catch {
    // noop
  }
}

/**
 * Aplica las variables dinámicas de branding al documento HTML y a los tokens CSS
 */
export function initTenantBranding() {
  if (typeof document === 'undefined') return;

  const savedPreset = localStorage.getItem('modaurban_theme_preset');
  if (savedPreset && THEME_PRESETS[savedPreset] && savedPreset !== 'default') {
    applyThemePreset(savedPreset);
    return;
  }

  // Actualizar título de la pestaña del navegador
  if (tenantConfig.storeName) {
    document.title = `${tenantConfig.storeName} ERP · ${tenantConfig.storeTagline}`;
  }

  const root = document.documentElement;

  // Aplicar propiedades CSS personalizadas
  if (tenantConfig.theme.primary) {
    root.style.setProperty('--erp-primary', tenantConfig.theme.primary);
  }
  if (tenantConfig.theme.primaryHover) {
    root.style.setProperty('--erp-primary-hover', tenantConfig.theme.primaryHover);
  }
  if (tenantConfig.theme.navbarBg) {
    root.style.setProperty('--erp-navbar-bg', tenantConfig.theme.navbarBg);
  }
  root.style.setProperty('--erp-navbar-dark', '#0f172a');
  if (tenantConfig.theme.accent) {
    root.style.setProperty('--erp-accent', tenantConfig.theme.accent);
  }
  if (tenantConfig.theme.bgLight) {
    root.style.setProperty('--erp-bg-light', tenantConfig.theme.bgLight);
  }
  if (tenantConfig.theme.bgDark) {
    root.style.setProperty('--erp-bg-dark', tenantConfig.theme.bgDark);
  }
  root.style.setProperty('--erp-surface-dark', '#151e2e');
  root.style.setProperty('--erp-surface-subtle-dark', '#0f172a');
  root.style.setProperty('--erp-border-dark', '#2d3e53');
}
