import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function setupUsers() {
  console.log('--- Configurando usuarios y roles en PocketBase ---');
  await pb.collection('_superusers').authWithPassword('admin@modaurban.es', 'admin123456');

  // Obtener colección users
  const usersCol = await pb.collections.getOne('users');

  // Añadir campos role y cargo si no existen
  const hasRole = usersCol.fields.some((f) => f.name === 'role');
  const hasCargo = usersCol.fields.some((f) => f.name === 'cargo');

  if (!hasRole || !hasCargo) {
    const updatedFields = [...usersCol.fields];
    if (!hasRole) updatedFields.push({ name: 'role', type: 'text' });
    if (!hasCargo) updatedFields.push({ name: 'cargo', type: 'text' });

    await pb.collections.update('users', {
      fields: updatedFields,
      listRule: '',
      viewRule: '',
    });
    console.log('✓ Campos "role" y "cargo" añadidos a la colección users en PocketBase.');
  }

  // Comprobar y crear usuarios en PocketBase
  const demoUsers = [
    {
      email: 'admin@modaurban.es',
      password: 'admin123456',
      passwordConfirm: 'admin123456',
      name: 'Laura Gómez',
      role: 'admin',
      cargo: 'Gerente de Tienda',
    },
    {
      email: 'empleado@modaurban.es',
      password: 'empleado123',
      passwordConfirm: 'empleado123',
      name: 'Carlos Ruiz',
      role: 'empleado',
      cargo: 'Dependiente / Cajero',
    },
  ];

  for (const u of demoUsers) {
    try {
      // Buscar si ya existe
      const existing = await pb.collection('users').getFirstListItem(`email="${u.email}"`);
      await pb.collection('users').update(existing.id, {
        name: u.name,
        role: u.role,
        cargo: u.cargo,
      });
      console.log(`✓ Usuario "${u.email}" actualizado en PocketBase (Rol: ${u.role}).`);
    } catch {
      // Si no existe, crearlo
      try {
        await pb.collection('users').create(u);
        console.log(`✓ Usuario "${u.email}" creado en PocketBase (Rol: ${u.role}).`);
      } catch (err) {
        console.error(`Error creando usuario ${u.email}:`, err.message);
      }
    }
  }

  const all = await pb.collection('users').getFullList();
  console.log('Usuarios finales en PocketBase:', all.map(x => ({ email: x.email, name: x.name, role: x.role })));
}

setupUsers().catch(console.error);
