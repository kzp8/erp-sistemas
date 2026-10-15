import PocketBase from 'pocketbase';
import {
  initialUsers,
  initialClientes,
  initialProductos,
  initialProveedores,
  initialCompras,
  initialVentas,
  initialFacturas,
  initialDevoluciones,
} from './initialData';

const getPocketBaseUrl = () => {
  // 1. Si se ejecuta en local (localhost, 127.0.0.1 o puerto dev 5173), usar la base de datos local
  if (typeof window !== 'undefined' && window.location) {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.port === '5173';

    if (isLocal) {
      return 'http://127.0.0.1:8090';
    }
  }

  // 2. En producción o despliegue Coolify, usar la URL del entorno
  const envUrl = import.meta.env.VITE_POCKETBASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim();
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://127.0.0.1:8090';
};

export const POCKETBASE_URL = getPocketBaseUrl();
export const pb = new PocketBase(POCKETBASE_URL);

// Comprobar estado de PocketBase
export async function checkPocketBaseStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${POCKETBASE_URL}/api/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

// Claves de almacenamiento local de respaldo
const STORAGE_KEYS = {
  users: 'modaurban_users',
  clientes: 'modaurban_clientes',
  productos: 'modaurban_productos',
  proveedores: 'modaurban_proveedores',
  compras: 'modaurban_compras',
  ventas: 'modaurban_ventas',
  facturas: 'modaurban_facturas',
  devoluciones: 'modaurban_devoluciones',
};

// Cargar colección directamente desde PocketBase (prioridad número 1) o LocalStorage/Mock (fallback)
export async function fetchCollection(collectionName, fallbackData) {
  try {
    const records = await pb.collection(collectionName).getFullList({ requestKey: null });
    if (Array.isArray(records)) {
      try {
        localStorage.setItem(`modaurban_${collectionName}`, JSON.stringify(records));
      } catch {}
      return records;
    }
  } catch (err) {
    console.warn(`[PocketBase] No se pudo cargar ${collectionName} desde el servidor (${err.message}). Usando respaldo.`);
  }

  // Fallback 1: LocalStorage de respaldo
  const stored = localStorage.getItem(`modaurban_${collectionName}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }

  // Fallback 2: Datos mock de fábrica
  return fallbackData;
}

// Crear registro en PocketBase + LocalStorage
export async function createRecord(collectionName, data) {
  let created = null;
  try {
    created = await pb.collection(collectionName).create(data, { requestKey: null });
  } catch (err) {
    console.warn(`[PocketBase] Fallo al crear en servidor para ${collectionName}:`, err.message);
  }

  if (!created) {
    created = { ...data, id: `${collectionName.slice(0, 3)}-${Date.now()}` };
  }
  return created;
}

// Actualizar registro en PocketBase + LocalStorage
export async function updateRecord(collectionName, id, data) {
  let updated = null;
  try {
    updated = await pb.collection(collectionName).update(id, data, { requestKey: null });
  } catch (err) {
    console.warn(`[PocketBase] Fallo al actualizar en servidor para ${collectionName}:`, err.message);
  }
  return updated || { ...data, id };
}

// Eliminar registro en PocketBase + LocalStorage
export async function deleteRecord(collectionName, id) {
  try {
    await pb.collection(collectionName).delete(id, { requestKey: null });
    return true;
  } catch (err) {
    console.warn(`[PocketBase] Fallo al eliminar en servidor para ${collectionName}:`, err.message);
  }
  return false;
}

export { STORAGE_KEYS };
