import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShoppingBag, ShieldCheck, UserCheck, KeyRound, AlertCircle, Database, Sun, Moon } from 'lucide-react';
import { POCKETBASE_URL } from '../pocketbase/pb';
import { tenantConfig } from '../config/tenantConfig';

export default function Login() {
  const { login, loginAsRole, pbOnline } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(username, password);
    if (!res.success) {
      setError(res.error);
    }
  };

  return (
    <div
      style={{ backgroundColor: 'var(--erp-bg)' }}
      className="min-h-screen flex items-center justify-center p-4 font-sans select-none"
    >
      <div className="w-full max-w-md border-2 border-slate-500 bg-white shadow-md">
        {/* Barra de título de ventana clásica */}
        <div
          style={{ backgroundColor: 'var(--erp-primary, #1e293b)' }}
          className="text-slate-100 px-3 py-1.5 flex items-center justify-between border-b border-slate-900"
        >
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wide">
            <ShoppingBag className="w-4 h-4 text-slate-300" />
            <span>{tenantConfig.storeName} ERP · Autenticación</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.25)' }}
              className="flex items-center gap-1 hover:bg-white/25 text-white px-1.5 py-0.5 border font-mono text-[10px] transition cursor-pointer"
              title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDark ? (
                <>
                  <Sun className="w-3 h-3 text-amber-300" />
                  <span>CLARO</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-white/90" />
                  <span>OSCURO</span>
                </>
              )}
            </button>
            <span
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
              className="font-mono text-[10px] text-white/80 px-1 border"
            >
              SEC_LEVEL_2
            </span>
          </div>
        </div>

        {/* Subcabecera descriptiva */}
        <div className="bg-slate-100 p-3 border-b border-slate-300 text-xs text-slate-600 flex items-center justify-between">
          <span>Control de Acceso de Usuarios al Sistema</span>
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
            <Database className="w-3 h-3" />
            <span>{pbOnline ? `SQLITE ${POCKETBASE_URL}` : 'OFFLINE_CACHE'}</span>
          </div>
        </div>

        {/* Cuerpo del formulario */}
        <div className="p-5 bg-white space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-400 text-red-800 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                Usuario / Identificador:
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-400 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:border-slate-700 font-mono"
                placeholder="admin o empleado"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                Contraseña (Password):
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-400 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:border-slate-700 font-mono"
                placeholder="admin o empleado"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="submit"
                className="w-full erp-btn-primary font-bold py-2 px-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2 font-mono shadow-xs cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Ingresar al Sistema</span>
              </button>
            </div>
          </form>

          {/* Botones de conmutación rápida para evaluación */}
          <div className="pt-3 border-t border-slate-300">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5 text-center font-bold">
              [Credenciales de Acceso Simplificadas]
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('admin');
                  loginAsRole('admin');
                }}
                className="p-2 border border-slate-400 bg-slate-100 hover:bg-slate-200 text-left transition"
              >
                <div className="flex items-center gap-1 font-bold text-xs text-slate-800 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ADMINISTRADOR</span>
                </div>
                <span className="text-[10px] text-slate-600 block mt-0.5 font-mono">
                  user: <strong>admin</strong><br />pass: <strong>admin</strong>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername('empleado');
                  setPassword('empleado');
                  loginAsRole('empleado');
                }}
                className="p-2 border border-slate-400 bg-slate-100 hover:bg-slate-200 text-left transition"
              >
                <div className="flex items-center gap-1 font-bold text-xs text-slate-800 font-mono">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>DEPENDIENTE</span>
                </div>
                <span className="text-[10px] text-slate-600 block mt-0.5 font-mono">
                  user: <strong>empleado</strong><br />pass: <strong>empleado</strong>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pie de ventana con datos del superusuario */}
        <div className="bg-slate-200 px-3 py-1.5 border-t border-slate-300 text-slate-700 text-[10px] font-mono flex flex-col gap-0.5">
          <div className="flex justify-between items-center">
            <span>ESTADO BD: {pbOnline ? `ONLINE (${POCKETBASE_URL})` : 'MODO LOCAL'}</span>
            <span>SUPERUSER: admin@admin.com</span>
          </div>
          <div className="text-[9px] text-slate-500">
            <a
              href={`${POCKETBASE_URL}/_/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 hover:text-slate-900 underline font-bold"
            >
              PocketBase Admin Panel ({POCKETBASE_URL}/_/)
            </a>{' '}
            &rarr; admin@admin.com / admin@admin.com
          </div>
        </div>
      </div>
    </div>
  );
}
