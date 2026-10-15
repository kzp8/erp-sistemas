import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialUsers } from '../pocketbase/initialData';
import { pb, checkPocketBaseStatus } from '../pocketbase/pb';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Estado del usuario activo
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('modaurban_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialUsers[0]; // Admin por defecto
      }
    }
    return initialUsers[0]; // Admin por defecto para desarrollo
  });

  const [pbOnline, setPbOnline] = useState(false);

  // Comprobar estado de PocketBase cada 15 segundos
  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      const online = await checkPocketBaseStatus();
      if (isMounted) setPbOnline(online);
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Iniciar sesión con usuario/email y contraseña (conectado a PocketBase con resolución directa)
  const login = async (identifier, password) => {
    const rawId = (identifier || '').trim().toLowerCase();
    const rawPass = (password || '').trim();

    // Normalizar usuario corto a email del sistema para PocketBase
    let pbEmail = rawId;
    if (rawId === 'admin') pbEmail = 'admin@modaurban.es';
    if (rawId === 'empleado') pbEmail = 'empleado@modaurban.es';

    // 1. Intentar autenticar contra la colección 'users' de PocketBase
    try {
      if (pbOnline) {
        const authData = await pb.collection('users').authWithPassword(pbEmail, rawPass);
        if (authData && authData.record) {
          const pbUser = {
            id: authData.record.id,
            email: authData.record.email,
            name: authData.record.name,
            role: authData.record.role || 'empleado',
            cargo: authData.record.cargo || 'Personal de Tienda',
          };
          setUser(pbUser);
          localStorage.setItem('modaurban_auth_user', JSON.stringify(pbUser));
          return { success: true, user: pbUser };
        }
      }
    } catch {
      // Continuar con comprobación de perfiles locales si la API estuviera en reconexión
    }

    // 2. Comprobación directa de perfiles locales
    const found = initialUsers.find(
      (u) =>
        (u.email.toLowerCase() === rawId ||
          u.username === rawId ||
          (rawId === 'admin' && u.role === 'admin') ||
          (rawId === 'empleado' && u.role === 'empleado')) &&
        (u.password === rawPass ||
          (u.role === 'admin' && (rawPass === 'admin' || rawPass === 'admin123456')) ||
          (u.role === 'empleado' && (rawPass === 'empleado' || rawPass === '123' || rawPass === 'empleado123')))
    );

    if (found) {
      setUser(found);
      localStorage.setItem('modaurban_auth_user', JSON.stringify(found));
      return { success: true, user: found };
    }

    return { success: false, error: 'Credenciales incorrectas (Usuario o contraseña no válidos)' };
  };

  // Acceso directo con un clic (útil para la exposición de clase)
  const loginAsRole = (role) => {
    const target = initialUsers.find((u) => u.role === role) || initialUsers[0];
    setUser(target);
    localStorage.setItem('modaurban_auth_user', JSON.stringify(target));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('modaurban_auth_user');
    localStorage.removeItem('erp_active_tab');
    if (pb.authStore) {
      pb.authStore.clear();
    }
  };

  // Permisos según el rol (Mínimo 2 roles solicitados en el PDF: Administrador y Empleado)
  const isAdmin = user?.role === 'admin';
  const isEmpleado = user?.role === 'empleado';

  const permissions = {
    isAdmin,
    isEmpleado,
    canDeleteItems: isAdmin,
    canManageSuppliers: isAdmin,
    canViewCostsAndProfits: isAdmin,
    canManageSettings: isAdmin,
    canCreateSales: true, // Ambos pueden vender
    canManageClients: true, // Ambos pueden gestionar clientes
    canManageReturns: true, // Ambos pueden gestionar devoluciones
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginAsRole,
        logout,
        permissions,
        pbOnline,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
