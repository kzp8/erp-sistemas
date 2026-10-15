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

async function setup() {
  console.log('--- Configurando Colecciones con Esquema Completo en PocketBase ---');
  await pb.collection('_superusers').authWithPassword('admin@modaurban.es', 'Admin123456!');

  const schemas = [
    {
      name: 'clientes',
      fields: [
        { name: 'nombre', type: 'text', required: true },
        { name: 'dni', type: 'text', required: true },
        { name: 'email', type: 'text' },
        { name: 'telefono', type: 'text' },
        { name: 'direccion', type: 'text' },
        { name: 'ciudad', type: 'text' },
        { name: 'puntosFidelidad', type: 'number' },
        { name: 'totalGastado', type: 'number' },
        { name: 'fechaAlta', type: 'text' },
      ],
      initial: initialClientes,
    },
    {
      name: 'productos',
      fields: [
        { name: 'sku', type: 'text', required: true },
        { name: 'nombre', type: 'text', required: true },
        { name: 'categoria', type: 'text' },
        { name: 'temporada', type: 'text' },
        { name: 'precioCompra', type: 'number' },
        { name: 'precioVenta', type: 'number', required: true },
        { name: 'stock', type: 'number' },
        { name: 'tallas', type: 'json' },
        { name: 'colores', type: 'json' },
        { name: 'descripcion', type: 'text' },
      ],
      initial: initialProductos,
    },
    {
      name: 'proveedores',
      fields: [
        { name: 'cif', type: 'text', required: true },
        { name: 'nombre', type: 'text', required: true },
        { name: 'contacto', type: 'text' },
        { name: 'telefono', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'ciudad', type: 'text' },
        { name: 'categoria', type: 'text' },
        { name: 'plazoEntregaDias', type: 'number' },
      ],
      initial: initialProveedores,
    },
    {
      name: 'ventas',
      fields: [
        { name: 'numeroTicket', type: 'text', required: true },
        { name: 'fecha', type: 'text' },
        { name: 'mes', type: 'text' },
        { name: 'clienteId', type: 'text' },
        { name: 'clienteNombre', type: 'text' },
        { name: 'vendedor', type: 'text' },
        { name: 'metodoPago', type: 'text' },
        { name: 'items', type: 'json' },
        { name: 'subtotalBruto', type: 'number' },
        { name: 'descuentoVale', type: 'number' },
        { name: 'valeCodigo', type: 'text' },
        { name: 'baseImponible', type: 'number' },
        { name: 'iva', type: 'number' },
        { name: 'total', type: 'number' },
        { name: 'facturada', type: 'bool' },
      ],
      initial: initialVentas,
    },
    {
      name: 'facturas',
      fields: [
        { name: 'numeroFactura', type: 'text', required: true },
        { name: 'ticketOrigen', type: 'text' },
        { name: 'fecha', type: 'text' },
        { name: 'clienteId', type: 'text' },
        { name: 'clienteNombre', type: 'text' },
        { name: 'clienteDni', type: 'text' },
        { name: 'clienteDireccion', type: 'text' },
        { name: 'items', type: 'json' },
        { name: 'baseImponible', type: 'number' },
        { name: 'ivaPorcentaje', type: 'number' },
        { name: 'ivaCuota', type: 'number' },
        { name: 'total', type: 'number' },
        { name: 'estado', type: 'text' },
      ],
      initial: initialFacturas,
    },
    {
      name: 'compras',
      fields: [
        { name: 'numeroPedido', type: 'text', required: true },
        { name: 'proveedorId', type: 'text' },
        { name: 'proveedorNombre', type: 'text' },
        { name: 'fecha', type: 'text' },
        { name: 'estado', type: 'text' },
        { name: 'articulos', type: 'json' },
        { name: 'total', type: 'number' },
      ],
      initial: initialCompras,
    },
    {
      name: 'devoluciones',
      fields: [
        { name: 'codigo', type: 'text', required: true },
        { name: 'ticketOrigen', type: 'text' },
        { name: 'fecha', type: 'text' },
        { name: 'clienteNombre', type: 'text' },
        { name: 'tipo', type: 'text' },
        { name: 'producto', type: 'text' },
        { name: 'tallaDevuelta', type: 'text' },
        { name: 'nuevaTalla', type: 'text' },
        { name: 'motivo', type: 'text' },
        { name: 'resolucion', type: 'text' },
        { name: 'atendidoPor', type: 'text' },
        { name: 'importe', type: 'number' },
        { name: 'estado', type: 'text' },
        { name: 'ticketCanje', type: 'text' },
        { name: 'fechaCanje', type: 'text' },
        { name: 'prendaDefectuosa', type: 'bool' },
      ],
      initial: initialDevoluciones,
    },
  ];

  for (const item of schemas) {
    try {
      // Si existe, eliminarla para recrearla con los campos completos
      try {
        await pb.collections.delete(item.name);
        console.log(`Reemplazando colección "${item.name}"...`);
      } catch {}

      const col = await pb.collections.create({
        name: item.name,
        type: 'base',
        fields: item.fields,
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
      });
      console.log(`✓ Colección "${item.name}" creada con esquema completo.`);

      // Poblar datos
      for (const row of item.initial) {
        const { id, ...data } = row;
        await pb.collection(item.name).create(data);
      }
      console.log(`✓ "${item.name}" poblada con ${item.initial.length} registros reales.`);
    } catch (err) {
      console.error(`Error en ${item.name}:`, err.message, err.response);
    }
  }

  console.log('--- ¡PocketBase listo y 100% operativo con datos reales! ---');
}

setup().catch(console.error);
