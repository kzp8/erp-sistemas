import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErpProvider, useErp } from './context/ErpContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Clientes from './components/Clientes';
import Productos from './components/Productos';
import Ventas from './components/Ventas';
import Facturas from './components/Facturas';
import Proveedores from './components/Proveedores';
import Devoluciones from './components/Devoluciones';
import Informes from './components/Informes';

function ErpAppContent() {
  const { user } = useAuth();
  const { loading } = useErp();
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('erp_active_tab');
      if (saved) return saved;
    } catch {
      // fallback
    }
    return 'dashboard';
  });

  useEffect(() => {
    try {
      if (activeTab) {
        localStorage.setItem('erp_active_tab', activeTab);
      }
    } catch {
      // ignore
    }
  }, [activeTab]);

  if (!user) {
    return <Login />;
  }

  if (loading) {
    return (
      <div
        style={{ backgroundColor: 'var(--erp-bg)' }}
        className="min-h-screen flex items-center justify-center font-mono select-none p-4"
      >
        <div className="erp-window border-2 border-slate-500 bg-white p-6 shadow-md max-w-sm w-full text-center space-y-3">
          <div className="erp-header-bar px-2.5 py-1 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>SISTEMA ERP</span>
            <span className="animate-pulse text-slate-300">● SINCRONIZANDO</span>
          </div>
          <div className="py-4 space-y-2.5">
            <div className="w-6 h-6 border-2 border-slate-700 border-t-transparent animate-spin rounded-full mx-auto" />
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Cargando Base de Datos...
            </p>
            <p className="text-[10px] text-slate-500">
              Conectando con PocketBase y recuperando registros reales
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';
  const isRestrictedForEmpleado = !isAdmin && (activeTab === 'proveedores' || activeTab === 'informes');

  return (
    <div
      style={{ backgroundColor: 'var(--erp-bg)' }}
      className="min-h-screen flex flex-col font-sans text-slate-800"
    >
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 w-full max-w-[1400px] mx-auto p-3 sm:p-4">
        {isRestrictedForEmpleado ? (
          <div className="erp-window max-w-lg mx-auto my-12 border-2 border-slate-400">
            <div className="erp-header-bar px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wide flex items-center justify-between">
              <span>ALERTA DE SEGURIDAD · CÓDIGO 403</span>
              <span className="text-red-300">[RESTRINGIDO]</span>
            </div>
            <div className="p-6 text-center space-y-4 bg-slate-50">
              <div className="w-10 h-10 border-2 border-slate-500 bg-slate-200 text-slate-800 flex items-center justify-center mx-auto text-xl font-bold font-mono">
                !
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  Acceso Restringido a Perfil Administrador
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  El módulo seleccionado (<strong>{activeTab === 'proveedores' ? 'Gestión de Proveedores' : 'Informes Financieros'}</strong>) requiere credenciales con nivel de autorización de Gerencia.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="erp-btn-primary px-4 py-1.5 text-xs font-bold uppercase"
                >
                  Regresar al Panel Principal
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
            {activeTab === 'ventas' && <Ventas setActiveTab={setActiveTab} />}
            {activeTab === 'productos' && <Productos />}
            {activeTab === 'clientes' && <Clientes />}
            {activeTab === 'facturacion' && <Facturas />}
            {activeTab === 'proveedores' && <Proveedores />}
            {activeTab === 'devoluciones' && <Devoluciones />}
            {activeTab === 'informes' && <Informes />}
          </div>
        )}
      </main>

      <footer className="bg-slate-200 border-t border-slate-300 py-1.5 px-4 text-slate-700 text-xs font-mono flex items-center justify-center select-none">
        <a
          href="https://github.com/kzp8"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-950 font-bold transition-colors"
          title="Visitar GitHub @kzp8"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span>@kzp8</span>
        </a>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErpProvider>
          <ErpAppContent />
        </ErpProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
