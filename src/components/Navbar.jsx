import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useErp } from '../context/ErpContext';
import {
  ShoppingBag,
  Users,
  Shirt,
  ShoppingCart,
  FileText,
  Truck,
  RotateCcw,
  BarChart3,
  LogOut,
  Database,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Bug,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';
import { POCKETBASE_URL } from '../pocketbase/pb';
import { useTheme } from '../context/ThemeContext';
import { tenantConfig, THEME_PRESETS, applyThemePreset } from '../config/tenantConfig';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, loginAsRole, pbOnline } = useAuth();
  const { resetearDemo } = useErp();
  const { isDark, toggleTheme } = useTheme();
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [activePalette, setActivePalette] = useState(() => {
    return localStorage.getItem('modaurban_theme_preset') || 'default';
  });
  const [storeNameState, setStoreNameState] = useState(tenantConfig.storeName);

  const handleSelectPalette = (presetKey) => {
    applyThemePreset(presetKey);
    setActivePalette(presetKey);
    const preset = THEME_PRESETS[presetKey];
    if (preset?.storeName) {
      setStoreNameState(preset.storeName);
    }
  };

  const handleReset = async () => {
    if (window.confirm('¿Desea restaurar la base de datos a los valores iniciales de prueba?')) {
      await resetearDemo();
      alert('Base de datos restaurada correctamente.');
    }
  };

  const allNavItems = [
    { id: 'dashboard', label: '1. Inicio / Panel', icon: BarChart3, roles: ['admin', 'empleado'] },
    { id: 'ventas', label: '2. TPV Caja', icon: ShoppingCart, roles: ['admin', 'empleado'] },
    { id: 'productos', label: '3. Catálogo Ropa', icon: Shirt, roles: ['admin', 'empleado'] },
    { id: 'clientes', label: '4. Clientes', icon: Users, roles: ['admin', 'empleado'] },
    { id: 'facturacion', label: '5. Facturación', icon: FileText, roles: ['admin', 'empleado'] },
    { id: 'devoluciones', label: '6. Devoluciones / Vales', icon: RotateCcw, roles: ['admin', 'empleado'] },
    { id: 'proveedores', label: '7. Proveedores & Pedidos', icon: Truck, roles: ['admin'], adminOnly: true },
    { id: 'informes', label: '8. Informes y Balances', icon: BarChart3, roles: ['admin'], adminOnly: true },
  ];

  const navItems = allNavItems.filter((item) =>
    item.roles.includes(user?.role || 'empleado')
  );

  const handleRoleChange = (role) => {
    loginAsRole(role);
    if (role === 'empleado' && (activeTab === 'proveedores' || activeTab === 'informes')) {
      setActiveTab('dashboard');
    }
  };

  return (
    <>
      <header
        style={{ backgroundColor: 'var(--erp-navbar-bg, #1e293b)' }}
        className="text-slate-100 border-b border-black/25 shadow-xs sticky top-0 z-40 select-none"
      >
        {/* Barra superior limpia */}
        <div
          style={{ backgroundColor: 'var(--erp-navbar-dark, rgba(0, 0, 0, 0.25))' }}
          className="px-3 py-1 text-xs border-b border-black/20 flex items-center justify-between gap-2"
        >
          {/* Logo y nombre de la tienda dinámico */}
          <div className="flex items-center gap-2">
            <div
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
              className="px-2 py-0.5 border font-mono text-[11px] font-bold text-white flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-white/80" />
              <span>{storeNameState}</span>
            </div>
          </div>

          {/* Acciones de usuario, conmutador de tema y logout */}
          <div className="flex items-center gap-2">
            {/* Botón selector Tema Claro/Oscuro */}
            <button
              type="button"
              onClick={toggleTheme}
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.25)' }}
              className="flex items-center gap-1.5 hover:bg-white/20 text-white px-2 py-0.5 border font-mono text-[11px] transition cursor-pointer"
              title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span>MODO CLARO</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-white/90" />
                  <span>MODO OSCURO</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1.5 px-2 text-xs text-white/90 font-mono">
              {user?.role === 'admin' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-white/70" />
              )}
              <span className="font-semibold">{user?.name?.toUpperCase()}</span>
              <span className="text-white/60 text-[10px]">({user?.role?.toUpperCase()})</span>
            </div>

            <button
              type="button"
              onClick={logout}
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.25)' }}
              className="hover:bg-red-600 hover:text-white text-white/80 px-1.5 py-0.5 border transition cursor-pointer"
              title="Desconectar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Barra de Pestañas Clásica de Software Administrativo */}
        <div
          style={{ backgroundColor: 'var(--erp-navbar-bg, #1e293b)' }}
          className="px-3 pt-1 border-b border-black/25 flex items-end overflow-x-auto gap-0.5"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                style={
                  isActive
                    ? { backgroundColor: 'var(--erp-bg)' }
                    : { backgroundColor: 'rgba(0, 0, 0, 0.25)', borderColor: 'rgba(0, 0, 0, 0.35)' }
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap border-t border-l border-r transition cursor-pointer ${
                  isActive
                    ? `${isDark ? 'text-slate-100 border-slate-600' : 'text-slate-900 border-slate-300'} font-bold -mb-[1px] pb-2 z-10`
                    : 'text-white/80 hover:bg-black/35 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--erp-primary)]' : 'text-white/70'}`} />
                <span className={isActive ? (isDark ? 'text-slate-100' : 'text-slate-900') : 'text-inherit'}>
                  {item.label}
                </span>
                {item.adminOnly && (
                  <span
                    style={
                      isActive && !isDark
                        ? { backgroundColor: 'rgba(0, 0, 0, 0.08)', borderColor: 'rgba(0, 0, 0, 0.2)' }
                        : { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.25)' }
                    }
                    className={`text-[9px] px-1 border font-mono ml-0.5 ${
                      isActive && !isDark ? 'text-slate-700' : 'text-white'
                    }`}
                  >
                    ADM
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Botón flotante Debug situado encima del footer a la izquierda */}
      <div className="fixed bottom-10 left-3 z-50 font-mono text-xs select-none">
        {isDebugOpen && (
          <div className="mb-2 w-80 border-2 border-slate-600 bg-white shadow-2xl erp-window">
            {/* Cabecera del panel Debug */}
            <div className="erp-header-bar px-2.5 py-1 flex items-center justify-between text-[11px] font-bold uppercase">
              <span className="flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5 text-amber-300" />
                <span>PANEL DEPURACIÓN / DEBUG</span>
              </span>
              <button
                type="button"
                onClick={() => setIsDebugOpen(false)}
                className="text-slate-300 hover:text-white px-1 font-bold"
                title="Cerrar panel"
              >
                ✕
              </button>
            </div>

            {/* Contenido del panel */}
            <div className="p-3 space-y-2.5 bg-slate-50 text-slate-800">
              {/* 1. Estado de la Base de Datos */}
              <div>
                <span className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Motor de Base de Datos:
                </span>
                <div
                  className={`inline-flex items-center justify-between w-full px-2 py-1 border text-[11px] font-mono ${
                    pbOnline
                      ? 'bg-slate-100 text-slate-800 border-slate-400'
                      : 'bg-zinc-800 text-amber-300 border-amber-900'
                  }`}
                >
                  <div className="flex items-center">
                    <Database className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                    <span>{pbOnline ? 'ONLINE (PocketBase)' : 'LOCAL_REPLICA'}</span>
                  </div>
                  {pbOnline && (
                    <a
                      href={`${POCKETBASE_URL}/_/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-700 hover:text-blue-900 underline font-bold"
                    >
                      [Panel /_/]
                    </a>
                  )}
                </div>
              </div>

              {/* 2. Conmutador de Rol / Nivel */}
              <div>
                <span className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Cambiar Nivel de Usuario:
                </span>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    style={
                      user?.role === 'admin'
                        ? { backgroundColor: 'var(--erp-primary)', borderColor: 'var(--erp-primary-hover)', color: '#ffffff' }
                        : {}
                    }
                    className={`px-2 py-1 border text-xs font-bold font-mono transition cursor-pointer ${
                      user?.role === 'admin'
                        ? 'shadow-xs'
                        : 'bg-white text-slate-700 border-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    ADMIN
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('empleado')}
                    style={
                      user?.role === 'empleado'
                        ? { backgroundColor: 'var(--erp-primary)', borderColor: 'var(--erp-primary-hover)', color: '#ffffff' }
                        : {}
                    }
                    className={`px-2 py-1 border text-xs font-bold font-mono transition cursor-pointer ${
                      user?.role === 'empleado'
                        ? 'shadow-xs'
                        : 'bg-white text-slate-700 border-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    EMPLEADO
                  </button>
                </div>
              </div>

              {/* 3. Branding SaaS en Vivo (Paleta de Colores Dinámica) */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase mb-1">
                  <span className="flex items-center gap-1">
                    <Palette className="w-3 h-3 text-slate-500" />
                    <span>Branding SaaS en Vivo:</span>
                  </span>
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-mono font-normal">0ms / en caliente</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {Object.values(THEME_PRESETS).map((p) => {
                    const isSelected = activePalette === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPalette(p.id)}
                        style={
                          isSelected
                            ? { backgroundColor: 'var(--erp-primary)', borderColor: 'var(--erp-primary-hover)', color: '#ffffff' }
                            : {}
                        }
                        className={`px-1 py-1 border text-[11px] font-bold font-mono transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          isSelected
                            ? 'ring-1 ring-amber-400 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-400 hover:bg-slate-100'
                        }`}
                        title={`Activar paleta ${p.label} (${p.storeName})`}
                      >
                        <span className="text-sm">{p.icon}</span>
                        <span className="text-[10px]">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Reset Demo */}
              <div className="pt-1 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full erp-btn flex items-center justify-center gap-1.5 text-[11px] px-2 py-1.5 font-bold font-mono transition"
                  title="Restaurar base de datos a valores por defecto"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Reset Demo (Valores Iniciales)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botón activador Debug */}
        <button
          type="button"
          onClick={() => setIsDebugOpen(!isDebugOpen)}
          style={{
            backgroundColor: isDebugOpen ? 'var(--erp-primary-hover)' : 'var(--erp-primary)',
            borderColor: 'var(--erp-primary-hover)',
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-white border shadow-md font-bold font-mono text-[11px] transition cursor-pointer"
          title="Abrir panel de depuración (Base de datos, Nivel y Reset)"
        >
          <Bug className="w-3.5 h-3.5 text-amber-300" />
          <span>Debug</span>
        </button>
      </div>
    </>
  );
}
