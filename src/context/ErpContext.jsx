import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  pb,
  fetchCollection,
  createRecord,
  updateRecord,
  deleteRecord,
  checkPocketBaseStatus,
} from '../pocketbase/pb';
import {
  initialClientes,
  initialProductos,
  initialProveedores,
  initialCompras,
  initialVentas,
  initialFacturas,
  initialDevoluciones,
} from '../pocketbase/initialData';

const ErpContext = createContext();

export function ErpProvider({ children }) {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [compras, setCompras] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [devoluciones, setDevoluciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos REALES desde PocketBase al montar el componente
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [c, p, prov, comp, v, f, d] = await Promise.all([
          fetchCollection('clientes', initialClientes),
          fetchCollection('productos', initialProductos),
          fetchCollection('proveedores', initialProveedores),
          fetchCollection('compras', initialCompras),
          fetchCollection('ventas', initialVentas),
          fetchCollection('facturas', initialFacturas),
          fetchCollection('devoluciones', initialDevoluciones),
        ]);

        const normalizeTicket = (t) => {
          if (t === 'TCK-2026-03-01') return 'TCK-2026-003';
          if (t === 'TCK-2026-03-02') return 'TCK-2026-004';
          return t;
        };

        const sanitizedV = v.map((venta) => ({
          ...venta,
          numeroTicket: normalizeTicket(venta.numeroTicket),
        }));

        const sanitizedF = f.map((fac) => ({
          ...fac,
          ticketOrigen: normalizeTicket(fac.ticketOrigen),
        }));

        const sanitizedD = d.map((dev) => {
          let importeVal = dev.importe;
          let estadoVal = dev.estado;
          if (dev.tipo === 'Devolución con Vale') {
            if (importeVal === undefined || importeVal === null || Number(importeVal) === 0) {
              const matchingInit = initialDevoluciones.find((init) => init.codigo === dev.codigo);
              importeVal = matchingInit ? matchingInit.importe : 14.50;
            }
            if (!estadoVal) {
              estadoVal = 'Pendiente';
            }
          }
          return {
            ...dev,
            ticketOrigen: normalizeTicket(dev.ticketOrigen),
            importe: importeVal !== undefined ? parseFloat(Number(importeVal).toFixed(2)) : 0,
            estado: estadoVal || (dev.tipo === 'Devolución con Vale' ? 'Pendiente' : 'Completado'),
          };
        });

        if (isMounted) {
          setClientes(c);
          setProductos(p);
          setProveedores(prov);
          setCompras(comp);
          setVentas(sanitizedV);
          setFacturas(sanitizedF);
          setDevoluciones(sanitizedD);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Error cargando colecciones de PocketBase:', err);
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // ==================== MÓDULO CLIENTES ====================
  const addCliente = async (nuevoCliente) => {
    const payload = {
      ...nuevoCliente,
      puntosFidelidad: 0,
      totalGastado: 0,
      fechaAlta: new Date().toISOString().split('T')[0],
    };
    const saved = await createRecord('clientes', payload);
    setClientes((prev) => [saved, ...prev]);
    return saved;
  };

  const updateCliente = async (clienteActualizado) => {
    const { id, ...data } = clienteActualizado;
    await updateRecord('clientes', id, data);
    setClientes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...clienteActualizado } : c))
    );
  };

  const deleteCliente = async (id) => {
    await deleteRecord('clientes', id);
    setClientes((prev) => prev.filter((c) => c.id !== id));
  };

  // ==================== MÓDULO PRODUCTOS (ROPA) ====================
  const addProducto = async (nuevoProducto) => {
    const payload = {
      ...nuevoProducto,
      stock: parseInt(nuevoProducto.stock, 10) || 0,
      precioCompra: parseFloat(nuevoProducto.precioCompra) || 0,
      precioVenta: parseFloat(nuevoProducto.precioVenta) || 0,
      tallas: Array.isArray(nuevoProducto.tallas)
        ? nuevoProducto.tallas
        : nuevoProducto.tallas ? nuevoProducto.tallas.split(',').map((t) => t.trim()) : ['Única'],
      colores: Array.isArray(nuevoProducto.colores)
        ? nuevoProducto.colores
        : nuevoProducto.colores ? nuevoProducto.colores.split(',').map((c) => c.trim()) : ['Varios'],
    };
    const saved = await createRecord('productos', payload);
    setProductos((prev) => [saved, ...prev]);
    return saved;
  };

  const updateProducto = async (prodActualizado) => {
    const { id, ...data } = prodActualizado;
    await updateRecord('productos', id, data);
    setProductos((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...prodActualizado,
              stock: parseInt(prodActualizado.stock, 10) || 0,
              precioCompra: parseFloat(prodActualizado.precioCompra) || 0,
              precioVenta: parseFloat(prodActualizado.precioVenta) || 0,
            }
          : p
      )
    );
  };

  const deleteProducto = async (id) => {
    await deleteRecord('productos', id);
    setProductos((prev) => prev.filter((p) => p.id !== id));
  };

  // ==================== MÓDULO VENTAS (TPV) ====================
  const registrarVenta = async ({
    clienteId,
    items,
    metodoPago,
    vendedor,
    descuentoVale = 0,
    valeCodigo = null,
    total: totalOverride,
  }) => {
    if (!items || items.length === 0) return null;

    const subtotalBruto = items.reduce((acc, it) => acc + it.precioUnitario * it.cantidad, 0);
    const descVale = Math.min(subtotalBruto, Math.max(0, parseFloat(descuentoVale || 0)));
    const total = totalOverride !== undefined
      ? Math.max(0, parseFloat(Number(totalOverride).toFixed(2)))
      : Math.max(0, parseFloat((subtotalBruto - descVale).toFixed(2)));
    const baseImponible = parseFloat((total / 1.21).toFixed(2));
    const iva = parseFloat((total - baseImponible).toFixed(2));

    const cliente = clientes.find((c) => c.id === clienteId) || {
      id: 'mostrador',
      nombre: 'Venta Mostrador',
      dni: '99999999X',
    };

    const nuevoTicketNum = `TCK-2026-${String(ventas.length + 1).padStart(3, '0')}`;
    const fechaHora = new Date();
    const fechaStr = `${fechaHora.toISOString().split('T')[0]} ${String(fechaHora.getHours()).padStart(2, '0')}:${String(fechaHora.getMinutes()).padStart(2, '0')}`;
    const mesStr = fechaHora.toISOString().substring(0, 7);

    const ventaData = {
      numeroTicket: nuevoTicketNum,
      fecha: fechaStr,
      mes: mesStr,
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      vendedor: vendedor || 'Dependiente de Tienda',
      metodoPago: metodoPago || (total === 0 ? 'Vale de Tienda' : 'Tarjeta'),
      items,
      subtotalBruto: parseFloat(subtotalBruto.toFixed(2)),
      descuentoVale: descVale,
      valeCodigo: valeCodigo || null,
      baseImponible,
      iva,
      total,
      facturada: false,
    };

    // 1. Guardar venta en PocketBase
    const savedVenta = await createRecord('ventas', ventaData);
    setVentas((prev) => [savedVenta, ...prev]);

    // 2. Si se utilizó un vale, marcarlo como Canjeado
    if (valeCodigo) {
      await canjearVale(valeCodigo, nuevoTicketNum);
    }

    // 3. Reducir stock de cada prenda vendida en PocketBase
    items.forEach(async (it) => {
      const prod = productos.find((p) => p.id === it.productoId);
      if (prod) {
        const nuevoStock = Math.max(0, prod.stock - it.cantidad);
        await updateRecord('productos', prod.id, { stock: nuevoStock });
      }
    });

    setProductos((prev) =>
      prev.map((prod) => {
        const itemVendido = items.find((it) => it.productoId === prod.id);
        if (itemVendido) {
          return { ...prod, stock: Math.max(0, prod.stock - itemVendido.cantidad) };
        }
        return prod;
      })
    );

    // 4. Sumar puntos de fidelidad y total gastado al cliente
    if (cliente.id !== 'mostrador' && !cliente.nombre.includes('Mostrador')) {
      const puntosNuevos = Math.floor(total / 10);
      const nuevoTotal = parseFloat(((cliente.totalGastado || 0) + total).toFixed(2));
      const nuevosPuntos = (cliente.puntosFidelidad || 0) + puntosNuevos;

      await updateRecord('clientes', cliente.id, {
        totalGastado: nuevoTotal,
        puntosFidelidad: nuevosPuntos,
      });

      setClientes((prev) =>
        prev.map((c) =>
          c.id === cliente.id
            ? { ...c, totalGastado: nuevoTotal, puntosFidelidad: nuevosPuntos }
            : c
        )
      );
    }

    return savedVenta;
  };

  // ==================== MÓDULO FACTURACIÓN ====================
  const generarFacturaDeVenta = async (ventaId) => {
    const venta = ventas.find((v) => v.id === ventaId);
    if (!venta) return null;

    const cliente = clientes.find((c) => c.id === venta.clienteId) || {
      nombre: venta.clienteNombre || 'Cliente Mostrador',
      dni: '',
      direccion: '',
      ciudad: '',
    };

    const currentYear = new Date().getFullYear();
    const numFactura = `FAC-${currentYear}-${String(facturas.length + 1).padStart(3, '0')}`;
    const itemsFactura = venta.items.map((it, idx) => ({
      codigo: it.codigo || `PRENDA-${idx + 1}`,
      descripcion: `${it.nombre}${it.talla ? ` (Talla: ${it.talla}` : ''}${it.color ? `, Color: ${it.color})` : it.talla ? ')' : ''}`,
      cantidad: it.cantidad,
      precioUnitario: it.precioUnitario,
      total: it.subtotal || it.cantidad * it.precioUnitario,
    }));

    const facturaData = {
      numeroFactura: numFactura,
      ticketOrigen: venta.numeroTicket,
      fecha: new Date().toISOString().split('T')[0],
      fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      formaPago: venta.metodoPago ? `Contado (${venta.metodoPago.toUpperCase()})` : 'Efectivo',
      clienteId: cliente.id || null,
      clienteNombre: cliente.nombre,
      clienteDni: cliente.dni || 'B-00000000',
      clienteDireccion: cliente.direccion ? `${cliente.direccion}${cliente.ciudad ? `, ${cliente.ciudad}` : ''}` : 'Tienda física / Venta presencial',
      clienteTelefono: cliente.telefono || '',
      clienteEmail: cliente.email || '',
      items: itemsFactura,
      baseImponible: Number(venta.baseImponible.toFixed(2)),
      ivaPorcentaje: 21,
      ivaCuota: Number(venta.iva.toFixed(2)),
      total: Number(venta.total.toFixed(2)),
      estado: 'Cobrada',
      observaciones: `Factura oficial simplificada vinculada a ticket ${venta.numeroTicket}`,
    };

    const savedFactura = await createRecord('facturas', facturaData);
    setFacturas((prev) => [savedFactura, ...prev]);

    // Marcar venta como facturada en PocketBase
    await updateRecord('ventas', venta.id, { facturada: true });
    setVentas((prev) =>
      prev.map((v) => (v.id === ventaId ? { ...v, facturada: true } : v))
    );

    return savedFactura;
  };

  const crearFacturaDirecta = async (nuevaData) => {
    const currentYear = new Date().getFullYear();
    const numFactura = nuevaData.numeroFactura || `FAC-${currentYear}-${String(facturas.length + 1).padStart(3, '0')}`;

    const facturaData = {
      numeroFactura: numFactura,
      ticketOrigen: nuevaData.ticketOrigen || 'VENTA DIRECTA / B2B',
      fecha: nuevaData.fecha || new Date().toISOString().split('T')[0],
      fechaVencimiento: nuevaData.fechaVencimiento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      formaPago: nuevaData.formaPago || 'Transferencia Bancaria (30 días)',
      clienteId: nuevaData.clienteId || null,
      clienteNombre: nuevaData.clienteNombre || 'Cliente General',
      clienteDni: nuevaData.clienteDni || '',
      clienteDireccion: nuevaData.clienteDireccion || '',
      clienteTelefono: nuevaData.clienteTelefono || '',
      clienteEmail: nuevaData.clienteEmail || '',
      items: nuevaData.items || [],
      baseImponible: Number(nuevaData.baseImponible || 0),
      ivaPorcentaje: Number(nuevaData.ivaPorcentaje || 21),
      ivaCuota: Number(nuevaData.ivaCuota || 0),
      total: Number(nuevaData.total || 0),
      estado: nuevaData.estado || 'Emitida',
      observaciones: nuevaData.observaciones || '',
    };

    const saved = await createRecord('facturas', facturaData);
    setFacturas((prev) => [saved, ...prev]);
    return saved;
  };

  const actualizarFactura = async (id, datosActualizados) => {
    const updated = await updateRecord('facturas', id, datosActualizados);
    setFacturas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...datosActualizados } : f))
    );
    return updated;
  };

  // ==================== MÓDULO PROVEEDORES Y COMPRAS ====================
  const addProveedor = async (nuevoProv) => {
    const saved = await createRecord('proveedores', nuevoProv);
    setProveedores((prev) => [saved, ...prev]);
    return saved;
  };

  const updateProveedor = async (provActualizado) => {
    const { id, ...data } = provActualizado;
    await updateRecord('proveedores', id, data);
    setProveedores((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...provActualizado } : p))
    );
  };

  const deleteProveedor = async (id) => {
    await deleteRecord('proveedores', id);
    setProveedores((prev) => prev.filter((p) => p.id !== id));
  };

  const registrarCompra = async ({ proveedorId, articulos }) => {
    const prov = proveedores.find((p) => p.id === proveedorId);
    if (!prov || !articulos || articulos.length === 0) return null;

    const total = articulos.reduce((sum, a) => sum + a.cantidad * a.precioUnitario, 0);
    const numPedido = `PED-PROV-2026-${String(compras.length + 1).padStart(3, '0')}`;

    const compraData = {
      numeroPedido: numPedido,
      proveedorId: prov.id,
      proveedorNombre: prov.nombre,
      fecha: new Date().toISOString().split('T')[0],
      estado: 'Recibido',
      articulos,
      total: parseFloat(total.toFixed(2)),
    };

    const savedCompra = await createRecord('compras', compraData);
    setCompras((prev) => [savedCompra, ...prev]);

    // Incrementar stock en PocketBase para cada artículo recibido
    articulos.forEach(async (art) => {
      const prod = productos.find((p) => p.id === art.productoId);
      if (prod) {
        const nuevoStock = prod.stock + parseInt(art.cantidad, 10);
        await updateRecord('productos', prod.id, { stock: nuevoStock });
      }
    });

    setProductos((prev) =>
      prev.map((prod) => {
        const artRecibido = articulos.find((a) => a.productoId === prod.id);
        if (artRecibido) {
          return { ...prod, stock: prod.stock + parseInt(artRecibido.cantidad, 10) };
        }
        return prod;
      })
    );

    return savedCompra;
  };

  // ==================== DEVOLUCIONES / CAMBIOS / VALES ====================
  const registrarDevolucion = async ({
    ticketOrigen,
    clienteNombre,
    tipo,
    productoId,
    tallaDevuelta,
    nuevaTalla,
    motivo,
    resolucion,
    atendidoPor,
    importe,
    prendaDefectuosa = false,
  }) => {
    const prod = productos.find((p) => p.id === productoId);
    const prodNombre = prod ? prod.nombre : 'Prenda General';
    const codigo = `DEV-2026-${String(devoluciones.length + 1).padStart(2, '0')}`;
    const valorImporte =
      importe !== undefined && importe !== null && importe !== ''
        ? parseFloat(Number(importe).toFixed(2))
        : (prod ? parseFloat(Number(prod.precioVenta || 0).toFixed(2)) : 0);

    const devData = {
      codigo,
      ticketOrigen,
      fecha: new Date().toISOString().split('T')[0],
      clienteNombre,
      tipo,
      producto: prodNombre,
      tallaDevuelta: tallaDevuelta || 'M',
      nuevaTalla: nuevaTalla || '---',
      motivo: motivo || (prendaDefectuosa ? 'Tara / Prenda rota o inservible' : 'Devolución de prenda'),
      resolucion:
        resolucion ||
        (tipo === 'Devolución con Vale'
          ? `Emitido Vale #${codigo} por ${valorImporte.toFixed(2)}€${prendaDefectuosa ? ' (Baja por tara)' : ''}`
          : `Sustitución en mostrador${prendaDefectuosa ? ' (Baja por tara/rotura)' : ''}`),
      atendidoPor: atendidoPor || 'Cajero',
      importe: tipo === 'Devolución con Vale' ? valorImporte : 0,
      estado: tipo === 'Devolución con Vale' ? 'Pendiente' : 'Completado',
      prendaDefectuosa: Boolean(prendaDefectuosa),
      ticketCanje: null,
      fechaCanje: null,
    };

    const savedDev = await createRecord('devoluciones', devData);
    setDevoluciones((prev) => [savedDev, ...prev]);

    // Gestión de existencias según estado de la prenda
    if (prod) {
      let nuevoStock = prod.stock;
      if (tipo === 'Devolución con Vale') {
        // En devolución normal se reintegra al stock (+1). Si está rota, NO se suma (+0).
        if (!prendaDefectuosa) {
          nuevoStock = prod.stock + 1;
        }
      } else if (tipo === 'Cambio de Talla') {
        // Si el cliente pide cambio de talla pero la devuelta estaba rota/deteriorada,
        // la tienda entrega una prenda nueva (-1) y desecha la rota, perdiendo 1 unidad.
        if (prendaDefectuosa) {
          nuevoStock = Math.max(0, prod.stock - 1);
        }
      }

      if (nuevoStock !== prod.stock) {
        await updateRecord('productos', prod.id, { stock: nuevoStock });
        setProductos((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, stock: nuevoStock } : p))
        );
      }
    }

    return savedDev;
  };

  const canjearVale = async (codigoVale, ticketNumero) => {
    if (!codigoVale) return null;
    const cleanCodigo = codigoVale.trim().toUpperCase();
    const vale = devoluciones.find(
      (d) => (d.codigo || '').trim().toUpperCase() === cleanCodigo
    );
    if (!vale) {
      console.warn(`[Vale] No se encontró vale con código: ${codigoVale}`);
      return null;
    }
    const updatedFields = {
      estado: 'Canjeado',
      ticketCanje: ticketNumero,
      fechaCanje: new Date().toISOString().split('T')[0],
    };
    try {
      await updateRecord('devoluciones', vale.id, updatedFields);
    } catch (err) {
      console.error('[Vale] Error actualizando vale en PocketBase:', err);
    }
    setDevoluciones((prev) =>
      prev.map((d) => (d.id === vale.id ? { ...d, ...updatedFields } : d))
    );
    return { ...vale, ...updatedFields };
  };

  const refreshData = async () => {
    setLoading(true);
    const [c, p, prov, comp, v, f, d] = await Promise.all([
      fetchCollection('clientes', initialClientes),
      fetchCollection('productos', initialProductos),
      fetchCollection('proveedores', initialProveedores),
      fetchCollection('compras', initialCompras),
      fetchCollection('ventas', initialVentas),
      fetchCollection('facturas', initialFacturas),
      fetchCollection('devoluciones', initialDevoluciones),
    ]);
    const normalizeTicket = (t) => {
      if (t === 'TCK-2026-03-01') return 'TCK-2026-003';
      if (t === 'TCK-2026-03-02') return 'TCK-2026-004';
      return t;
    };

    const sanitizedDevs = d.map((dev) => {
      let importeVal = dev.importe;
      let estadoVal = dev.estado;
      if (dev.tipo === 'Devolución con Vale') {
        if (importeVal === undefined || importeVal === null || Number(importeVal) === 0) {
          const matchingInit = initialDevoluciones.find((init) => init.codigo === dev.codigo);
          importeVal = matchingInit ? matchingInit.importe : 14.50;
        }
        if (!estadoVal) {
          estadoVal = 'Pendiente';
        }
      }
      return {
        ...dev,
        ticketOrigen: normalizeTicket(dev.ticketOrigen),
        importe: importeVal !== undefined ? parseFloat(Number(importeVal).toFixed(2)) : 0,
        estado: estadoVal || (dev.tipo === 'Devolución con Vale' ? 'Pendiente' : 'Completado'),
      };
    });

    setClientes(c);
    setProductos(p);
    setProveedores(prov);
    setCompras(comp);
    setVentas(v.map((venta) => ({ ...venta, numeroTicket: normalizeTicket(venta.numeroTicket) })));
    setFacturas(f.map((fac) => ({ ...fac, ticketOrigen: normalizeTicket(fac.ticketOrigen) })));
    setDevoluciones(sanitizedDevs);
    setLoading(false);
  };

  const resetearDemo = async () => {
    setLoading(true);
    try {
      const isOnline = await checkPocketBaseStatus();
      if (isOnline) {
        // 1. Vaciar en orden inverso (hijos primero, padres después)
        const collectionsToDelete = [
          'facturas',
          'devoluciones',
          'ventas',
          'compras',
          'productos',
          'clientes',
          'proveedores',
        ];

        for (const colName of collectionsToDelete) {
          try {
            const existing = await pb.collection(colName).getFullList({ requestKey: null });
            for (const r of existing) {
              await pb.collection(colName).delete(r.id, { requestKey: null });
            }
          } catch (err) {
            console.warn(`[Reset] Error al vaciar ${colName} en PocketBase:`, err.message);
          }
        }

        // 2. Repoblar colecciones maestras primero y transaccionales después
        const collectionsToCreate = [
          { name: 'proveedores', initial: initialProveedores },
          { name: 'clientes', initial: initialClientes },
          { name: 'productos', initial: initialProductos },
          { name: 'compras', initial: initialCompras },
          { name: 'ventas', initial: initialVentas },
          { name: 'devoluciones', initial: initialDevoluciones },
          { name: 'facturas', initial: initialFacturas },
        ];

        for (const col of collectionsToCreate) {
          try {
            for (const row of col.initial) {
              const { id, ...cleanRow } = row;
              await pb.collection(col.name).create(cleanRow, { requestKey: null });
            }
          } catch (err) {
            console.warn(`[Reset] Error al repoblar ${col.name} en PocketBase:`, err.message);
          }
        }
      } else {
        // Si PocketBase está desconectado, restaurar estado local en memoria
        setProveedores(initialProveedores);
        setClientes(initialClientes);
        setProductos(initialProductos);
        setCompras(initialCompras);
        setVentas(initialVentas);
        setDevoluciones(initialDevoluciones);
        setFacturas(initialFacturas);
      }

      // Limpiar copias locales en LocalStorage
      const storageKeys = [
        'modaurban_clientes',
        'modaurban_productos',
        'modaurban_proveedores',
        'modaurban_compras',
        'modaurban_ventas',
        'modaurban_facturas',
        'modaurban_devoluciones',
      ];
      storageKeys.forEach((key) => localStorage.removeItem(key));

      // Recargar datos limpios
      await refreshData();
    } catch (err) {
      console.error('Error al restaurar base de datos:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErpContext.Provider
      value={{
        clientes,
        productos,
        proveedores,
        compras,
        ventas,
        facturas,
        devoluciones,
        loading,
        addCliente,
        updateCliente,
        deleteCliente,
        addProducto,
        updateProducto,
        deleteProducto,
        registrarVenta,
        generarFacturaDeVenta,
        crearFacturaDirecta,
        actualizarFactura,
        addProveedor,
        updateProveedor,
        deleteProveedor,
        registrarCompra,
        registrarDevolucion,
        canjearVale,
        refreshData,
        resetearDemo,
      }}
    >
      {children}
    </ErpContext.Provider>
  );
}

export function useErp() {
  const context = useContext(ErpContext);
  if (!context) {
    throw new Error('useErp debe ser usado dentro de un ErpProvider');
  }
  return context;
}
