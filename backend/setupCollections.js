import PocketBase from 'pocketbase';
import {
  initialClientes,
  initialProductos,
  initialProveedores,
  initialCompras,
  initialVentas,
  initialFacturas,
  initialDevoluciones,
} from '../src/pocketbase/initialData.js';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
  console.log('--- Conectando a PocketBase en http://127.0.0.1:8090 ---');

  try {
    const authData = await pb.collection('_superusers').authWithPassword('admin@modaurban.es', 'Admin123456!');
    console.log('✓ Autenticado como superusuario en _superusers:', authData.token?.substring(0, 10));
  } catch (err) {
    console.error('Error detallado:', err.status, err.message, err.response);
  }

  const collections = [
    { name: 'clientes', initial: initialClientes },
    { name: 'productos', initial: initialProductos },
    { name: 'proveedores', initial: initialProveedores },
    { name: 'compras', initial: initialCompras },
    { name: 'ventas', initial: initialVentas },
    { name: 'facturas', initial: initialFacturas },
    { name: 'devoluciones', initial: initialDevoluciones },
  ];

  for (const col of collections) {
    let exists = false;
    try {
      await pb.collections.getOne(col.name);
      exists = true;
      console.log(`Colección "${col.name}" ya existe.`);
    } catch {
      exists = false;
    }

    if (!exists) {
      console.log(`Creando colección "${col.name}"...`);
      try {
        await pb.collections.create({
          name: col.name,
          type: 'base',
          listRule: '',
          viewRule: '',
          createRule: '',
          updateRule: '',
          deleteRule: '',
        });
        console.log(`✓ Colección "${col.name}" creada con éxito.`);
      } catch (e) {
        console.error(`Error al crear colección ${col.name}:`, e.message);
      }
    }

    // Insertar registros iniciales si está vacía
    try {
      const records = await pb.collection(col.name).getList(1, 1);
      if (records.totalItems === 0) {
        console.log(`Poblando datos iniciales para "${col.name}"...`);
        for (const item of col.initial) {
          // Remover id prefijado no estándar si PocketBase genera ids de 15 caracteres
          const { id, ...dataToInsert } = item;
          try {
            await pb.collection(col.name).create(dataToInsert);
          } catch (insertErr) {
            console.warn(`Aviso al insertar en ${col.name}:`, insertErr.message);
          }
        }
        console.log(`✓ "${col.name}" poblada con éxito.`);
      } else {
        console.log(`"${col.name}" ya contiene ${records.totalItems} registros.`);
      }
    } catch (readErr) {
      console.error(`Error comprobando registros en ${col.name}:`, readErr.message);
    }
  }

  console.log('--- Setup de PocketBase finalizado correctamente ---');
}

main().catch(console.error);
