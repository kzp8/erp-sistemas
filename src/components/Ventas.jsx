import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  Shirt,
  Search,
  User,
  X,
  FileText,
  Ticket,
} from 'lucide-react';
import { tenantConfig } from '../config/tenantConfig';
import { imprimirTicketTermico } from '../utils/invoicePrinter';

export default function Ventas({ setActiveTab }) {
  const { productos, clientes, devoluciones, registrarVenta, generarFacturaDeVenta } = useErp();
  const { user } = useAuth();

  const [cart, setCart] = useState([]);
  const [selectedClienteId, setSelectedClienteId] = useState('cli-5');
  const [metodoPago, setMetodoPago] = useState('Tarjeta');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');

  const [valeCodigoInput, setValeCodigoInput] = useState('');
  const [valeAplicado, setValeAplicado] = useState(null);
  const [valeError, setValeError] = useState('');

  const [itemConfigModal, setItemConfigModal] = useState(null);
  const [selectedTalla, setSelectedTalla] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const [ticketEmitido, setTicketEmitido] = useState(null);

  const prendasDisponibles = productos.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat =
      categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro;
    return matchesSearch && matchesCat;
  });

  const handleSelectProduct = (producto) => {
    if (producto.stock <= 0) {
      alert('Esta prenda no tiene existencias disponibles en almacén.');
      return;
    }

    const tallas = Array.isArray(producto.tallas)
      ? producto.tallas
      : producto.tallas ? producto.tallas.split(',') : ['Única'];
    const colores = Array.isArray(producto.colores)
      ? producto.colores
      : producto.colores ? producto.colores.split(',') : ['Estándar'];

    setItemConfigModal(producto);
    setSelectedTalla(tallas[0]?.trim() || 'M');
    setSelectedColor(colores[0]?.trim() || 'Negro');
  };

  const addToCartConfirmed = () => {
    if (!itemConfigModal) return;

    const producto = itemConfigModal;
    const existingIndex = cart.findIndex(
      (item) =>
        item.productoId === producto.id &&
        item.talla === selectedTalla &&
        item.color === selectedColor
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      if (newCart[existingIndex].cantidad + 1 > producto.stock) {
        alert('Límite de stock alcanzado para esta prenda.');
        return;
      }
      newCart[existingIndex].cantidad += 1;
      newCart[existingIndex].subtotal = parseFloat(
        (newCart[existingIndex].cantidad * newCart[existingIndex].precioUnitario).toFixed(2)
      );
      setCart(newCart);
    } else {
      const newItem = {
        productoId: producto.id,
        nombre: producto.nombre,
        sku: producto.sku,
        talla: selectedTalla,
        color: selectedColor,
        precioUnitario: parseFloat(producto.precioVenta),
        cantidad: 1,
        subtotal: parseFloat(producto.precioVenta),
      };
      setCart([...cart, newItem]);
    }

    setItemConfigModal(null);
  };

  const updateQuantity = (index, delta) => {
    const newCart = [...cart];
    const item = newCart[index];
    const prod = productos.find((p) => p.id === item.productoId);
    const newQty = item.cantidad + delta;

    if (newQty <= 0) {
      newCart.splice(index, 1);
    } else {
      if (prod && newQty > prod.stock) {
        alert(`Stock insuficiente en almacén (${prod.stock} disponibles).`);
        return;
      }
      item.cantidad = newQty;
      item.subtotal = parseFloat((newQty * item.precioUnitario).toFixed(2));
    }
    setCart(newCart);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const valesDisponibles = (devoluciones || []).filter(
    (d) =>
      d.tipo === 'Devolución con Vale' &&
      d.estado !== 'Canjeado' &&
      Number(d.importe || 0) > 0
  );

  const handleAplicarVale = (codigoParam) => {
    const cod = (codigoParam || valeCodigoInput).trim().toUpperCase();
    if (!cod) {
      setValeError('Introduzca el código del vale.');
      return;
    }
    const vale = (devoluciones || []).find(
      (d) => (d.codigo || '').trim().toUpperCase() === cod
    );
    if (!vale) {
      setValeError(`No se encontró ningún vale con código "${cod}".`);
      return;
    }
    if (vale.estado === 'Canjeado') {
      setValeError(`El vale ${cod} ya figura como canjeado (${vale.ticketCanje || 'caja'}).`);
      return;
    }
    const importeNum = parseFloat(vale.importe || 0);
    if (importeNum <= 0) {
      setValeError(`El vale ${cod} no dispone de saldo aplicable.`);
      return;
    }

    setValeAplicado(vale);
    setValeError('');
    setValeCodigoInput('');
  };

  const handleQuitarVale = () => {
    setValeAplicado(null);
    setValeError('');
  };

  const subtotalBruto = cart.reduce((sum, it) => sum + it.subtotal, 0);
  const descuentoVale = valeAplicado
    ? Math.min(subtotalBruto, parseFloat(valeAplicado.importe || 0))
    : 0;
  const totalPagar = parseFloat(Math.max(0, subtotalBruto - descuentoVale).toFixed(2));
  const baseImponible = parseFloat((totalPagar / 1.21).toFixed(2));
  const ivaCuota = parseFloat((totalPagar - baseImponible).toFixed(2));

  const handleCobrar = async () => {
    if (cart.length === 0) {
      alert('El ticket de caja está vacío.');
      return;
    }

    const metodoFinal = totalPagar === 0 ? 'Vale de Tienda' : metodoPago;

    try {
      const nuevaVenta = await registrarVenta({
        clienteId: selectedClienteId,
        items: cart,
        metodoPago: metodoFinal,
        vendedor: user?.name || 'Dependiente Caja',
        descuentoVale,
        valeCodigo: valeAplicado ? valeAplicado.codigo : null,
        total: totalPagar,
      });

      if (nuevaVenta) {
        setTicketEmitido(nuevaVenta);
        setCart([]);
        setValeAplicado(null);
        setValeCodigoInput('');
        setValeError('');
      }
    } catch (err) {
      console.error('Error al registrar venta:', err);
      alert('Error al emitir ticket: ' + (err.message || 'Error desconocido'));
    }
  };

  return (
    <div className="space-y-3">
      {/* Cabecera TPV */}
      <div className="erp-window p-3 border-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wide">
              MÓDULO 02 · TERMINAL PUNTO DE VENTA (TPV / CAJA MOSTRADOR)
            </h2>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
            Expedición de tickets, selección de variantes (talla/color) y liquidación de caja
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Catálogo de Selección Rápida (Columna 7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          {/* Barra de Filtros */}
          <div className="bg-white border border-slate-400 p-2 flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-1.5 flex-1 border border-slate-400 bg-slate-50 px-2 py-1">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar prenda por nombre o código SKU..."
                className="w-full text-xs text-slate-800 bg-transparent focus:outline-none font-mono"
              />
            </div>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="text-xs bg-white border border-slate-400 px-2 py-1 text-slate-800 focus:outline-none font-mono"
            >
              <option value="Todas">TODAS LAS FAMILIAS</option>
              <option value="Camisetas">CAMISETAS</option>
              <option value="Pantalones">PANTALONES</option>
              <option value="Vestidos">VESTIDOS</option>
              <option value="Chaquetas">CHAQUETAS</option>
              <option value="Sudaderas">SUDADERAS</option>
              <option value="Calzado">CALZADO</option>
              <option value="Accesorios">ACCESORIOS</option>
            </select>
          </div>

          {/* Grilla de Artículos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {prendasDisponibles.map((prod) => {
              const agotado = prod.stock <= 0;
              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleSelectProduct(prod)}
                  disabled={agotado}
                  className={`p-2.5 border text-left transition flex flex-col justify-between h-32 ${
                    agotado
                      ? 'bg-slate-200 border-slate-300 opacity-60 cursor-not-allowed'
                      : 'bg-white border-slate-400 hover:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-700">
                        {prod.sku}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1 border ${
                          agotado
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : prod.stock <= 5
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {agotado ? 'AGOTADO' : `${prod.stock} UDS`}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-2 mt-1">
                      {prod.nombre}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {parseFloat(prod.precioVenta).toFixed(2)} €
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-700 uppercase">
                      + AÑADIR
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de Cobro / Ticket en Caja (Columna 5 cols) */}
        <div className="lg:col-span-5 erp-window border-slate-400 p-3 flex flex-col justify-between min-h-[480px]">
          <div>
            <div className="erp-header-bar px-2.5 py-1 flex items-center justify-between font-mono text-xs font-bold uppercase mb-2">
              <span className="flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-slate-300" />
                <span>TICKET EN CURSO</span>
              </span>
              <span>{cart.length} LÍNEAS</span>
            </div>

            {/* Selector de Cliente */}
            <div className="mb-2 bg-slate-50 border border-slate-300 p-1.5">
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                Cliente Receptor:
              </label>
              <select
                value={selectedClienteId}
                onChange={(e) => setSelectedClienteId(e.target.value)}
                className="w-full text-xs bg-white border border-slate-400 p-1 text-slate-800 focus:outline-none font-mono"
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.dni})
                  </option>
                ))}
              </select>
            </div>

            {/* Listado de Líneas del Carrito */}
            <div className="border border-slate-300 bg-white max-h-56 overflow-y-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Art. / Talla / Col.</th>
                    <th className="text-center">Cant.</th>
                    <th className="text-right">Total</th>
                    <th className="text-center w-8">X</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400 font-mono text-xs">
                        [TICKET VACÍO - SELECCIONE ARTÍCULOS]
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="font-bold text-slate-900 text-xs">
                            {item.nombre}
                          </div>
                          <div className="text-[10px] font-mono text-slate-600">
                            Talla: <strong>{item.talla}</strong> | Color: {item.color} | {item.precioUnitario.toFixed(2)}€
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(idx, -1)}
                              className="px-1 border border-slate-400 bg-slate-100 text-xs font-mono font-bold"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-xs px-1">
                              {item.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(idx, 1)}
                              className="px-1 border border-slate-400 bg-slate-100 text-xs font-mono font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="text-right font-mono font-bold text-slate-900 text-xs">
                          {item.subtotal.toFixed(2)} €
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => removeFromCart(idx)}
                            className="text-red-700 hover:text-red-900 font-bold"
                            title="Quitar línea"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bloque de Liquidación y Totales */}
          <div className="pt-2 border-t border-slate-300 space-y-2 mt-2">
            {/* Canje de Vale de Tienda */}
            {valeAplicado ? (
              <div className="bg-emerald-50 border border-emerald-500 p-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5 text-emerald-700" />
                    <span>VALE {valeAplicado.codigo}: -{descuentoVale.toFixed(2)} €</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleQuitarVale}
                    className="text-red-700 hover:text-red-900 font-bold px-1.5 py-0.5 border border-red-300 bg-white cursor-pointer text-[10px]"
                  >
                    ✕ Quitar
                  </button>
                </div>
                <div className="text-[10px] text-emerald-700 mt-0.5">
                  Titular: {valeAplicado.clienteNombre || 'Cliente'} | Valor: {Number(valeAplicado.importe || 0).toFixed(2)} €
                  {Number(valeAplicado.importe || 0) > subtotalBruto && (
                    <span className="ml-1 text-slate-600 font-bold">(Cubre el 100% de la compra)</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-300 p-2 space-y-1">
                <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase">
                  Canjear Vale de Devolución:
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={valeCodigoInput}
                    onChange={(e) => {
                      setValeCodigoInput(e.target.value);
                      if (valeError) setValeError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAplicarVale();
                      }
                    }}
                    placeholder="Ej: DEV-2026-02"
                    className="flex-1 px-2 py-1 border border-slate-400 bg-white text-xs font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => handleAplicarVale()}
                    className="erp-btn px-2 py-1 text-xs font-mono font-bold uppercase bg-slate-200 hover:bg-slate-300 border-slate-400 cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
                {valeError && (
                  <p className="text-[10px] font-mono text-red-700 font-bold">{valeError}</p>
                )}
                {valesDisponibles.length > 0 && (
                  <div className="pt-1 flex flex-wrap items-center gap-1 text-[10px] font-mono">
                    <span className="text-slate-500">Vales en cartera:</span>
                    {valesDisponibles.slice(0, 3).map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleAplicarVale(v.codigo)}
                        className="px-1.5 py-0.5 border border-dashed border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold cursor-pointer"
                        title={`Titular: ${v.clienteNombre} (${v.producto})`}
                      >
                        {v.codigo} ({Number(v.importe || 0).toFixed(2)}€)
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cuadro de impuestos */}
            <div className="bg-slate-100 border border-slate-300 p-2 text-xs font-mono space-y-0.5">
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>SUBTOTAL BRUTO:</span>
                <span>{subtotalBruto.toFixed(2)} €</span>
              </div>
              {descuentoVale > 0 && (
                <div className="flex justify-between text-emerald-800 font-bold text-[11px]">
                  <span>VALE DE CAJA ({valeAplicado?.codigo}):</span>
                  <span>-{descuentoVale.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>BASE IMPONIBLE:</span>
                <span>{baseImponible.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>I.V.A. (21%):</span>
                <span>{ivaCuota.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-base pt-1 border-t border-slate-300">
                <span>TOTAL A COBRAR:</span>
                <span>{totalPagar.toFixed(2)} €</span>
              </div>
            </div>

            {/* Medio de pago */}
            {totalPagar === 0 ? (
              <div className="p-1.5 border border-emerald-600 bg-emerald-50 text-emerald-800 text-xs font-mono font-bold text-center">
                PAGO LIQUIDADO MEDIANTE VALE DE TIENDA
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {['Tarjeta', 'Efectivo', 'Bizum'].map((metodo) => {
                  const isSelected = metodoPago === metodo;
                  return (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => setMetodoPago(metodo)}
                      style={
                        isSelected
                          ? { backgroundColor: 'var(--erp-primary)', borderColor: 'var(--erp-primary-hover)', color: '#ffffff' }
                          : {}
                      }
                      className={`flex-1 py-1 px-1 border text-xs font-mono font-bold uppercase transition cursor-pointer ${
                        isSelected
                          ? 'shadow-xs'
                          : 'bg-white border-slate-400 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {metodo}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Botón de cobro */}
            <button
              type="button"
              onClick={handleCobrar}
              disabled={cart.length === 0}
              style={
                cart.length > 0
                  ? { backgroundColor: 'var(--erp-primary)', borderColor: 'var(--erp-primary-hover)' }
                  : {}
              }
              className={`w-full py-2.5 border font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition ${
                cart.length > 0
                  ? 'text-white cursor-pointer shadow-xs hover:opacity-95'
                  : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>COBRAR ({totalPagar.toFixed(2)} €) · EMITIR TICKET</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Selector de Talla y Color */}
      {itemConfigModal && (
        <div
          onClick={() => setItemConfigModal(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md border-2 border-slate-600 bg-white shadow-xl my-6"
          >
            <div className="erp-header-bar px-3 py-1.5 flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wide">
              <span>CONFIGURACIÓN DE LÍNEA DE VENTA</span>
              <button
                type="button"
                onClick={() => setItemConfigModal(null)}
                className="text-slate-300 hover:text-white px-1.5 py-0.2 bg-slate-800 border border-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 bg-slate-50">
              <div className="border-b border-slate-300 pb-2">
                <h4 className="font-bold text-sm text-slate-900">{itemConfigModal.nombre}</h4>
                <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                  REF: {itemConfigModal.sku} | STOCK DISPONIBLE: {itemConfigModal.stock} UDS
                </p>
              </div>

              {/* Talla */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase mb-1">
                  1. SELECCIONAR TALLA:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(itemConfigModal.tallas)
                    ? itemConfigModal.tallas
                    : itemConfigModal.tallas.split(',')
                  ).map((t, idx) => {
                    const tallaClean = t.trim();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedTalla(tallaClean)}
                        className={`px-3 py-1.5 text-xs font-mono font-bold border transition ${
                          selectedTalla === tallaClean
                            ? 'bg-slate-800 text-white border-slate-900'
                            : 'bg-white border-slate-400 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        {tallaClean}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase mb-1">
                  2. SELECCIONAR COLOR:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(itemConfigModal.colores)
                    ? itemConfigModal.colores
                    : itemConfigModal.colores.split(',')
                  ).map((c, idx) => {
                    const colorClean = c.trim();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedColor(colorClean)}
                        className={`px-3 py-1.5 text-xs font-mono font-bold border transition ${
                          selectedColor === colorClean
                            ? 'bg-slate-800 text-white border-slate-900'
                            : 'bg-white border-slate-400 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        {colorClean}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-300 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">PVP Unitario:</span>
                  <span className="text-lg font-bold font-mono text-slate-900">
                    {parseFloat(itemConfigModal.precioVenta).toFixed(2)} €
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addToCartConfirmed}
                  className="erp-btn-primary font-mono text-xs uppercase font-bold px-4 py-2 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir a Caja</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ticket Fiscal Emitido */}
      {ticketEmitido && (
        <div
          onClick={() => setTicketEmitido(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md border-2 border-slate-600 bg-white p-5 font-mono text-xs shadow-xl my-6"
          >
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-400">
              <h3 className="text-sm font-bold text-slate-900 uppercase">{tenantConfig.company.legalName}</h3>
              <p className="text-[10px] text-slate-600">CIF: {tenantConfig.company.cif} · {tenantConfig.company.activity}</p>
              <p className="text-[10px] text-slate-500">{tenantConfig.company.address}</p>
              <div className="mt-1.5 font-bold text-slate-800">TICKET: {ticketEmitido.numeroTicket}</div>
              <div className="text-[10px] text-slate-500">FECHA: {ticketEmitido.fecha}</div>
            </div>

            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">CLIENTE:</span>
                <span className="font-bold text-slate-800">{ticketEmitido.clienteNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CAJERO:</span>
                <span className="text-slate-700">{ticketEmitido.vendedor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">FORMA PAGO:</span>
                <span className="text-slate-700 uppercase">{ticketEmitido.metodoPago}</span>
              </div>
            </div>

            <div className="py-2 border-b-2 border-dashed border-slate-400 space-y-1">
              {(ticketEmitido.items || []).map((it, idx) => (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <div>
                    <div className="font-bold text-slate-900">{it.nombre}</div>
                    <div className="text-[10px] text-slate-500">
                      T.{it.talla} · {it.color} (x{it.cantidad})
                    </div>
                  </div>
                  <div className="font-bold font-mono text-slate-900">
                    {Number(it.subtotal || 0).toFixed(2)} {tenantConfig.pos.currencySymbol}
                  </div>
                </div>
              ))}
            </div>

            <div className="py-2 space-y-0.5 text-[11px]">
              {ticketEmitido.descuentoVale > 0 && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>SUBTOTAL BRUTO:</span>
                    <span>{Number(ticketEmitido.subtotalBruto || 0).toFixed(2)} {tenantConfig.pos.currencySymbol}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>DESCUENTO VALE ({ticketEmitido.valeCodigo}):</span>
                    <span>-{Number(ticketEmitido.descuentoVale).toFixed(2)} {tenantConfig.pos.currencySymbol}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-slate-600">
                <span>BASE IMPONIBLE:</span>
                <span>{Number(ticketEmitido.baseImponible || 0).toFixed(2)} {tenantConfig.pos.currencySymbol}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>I.V.A. ({tenantConfig.pos.defaultTaxRate}%):</span>
                <span>{Number(ticketEmitido.iva || 0).toFixed(2)} {tenantConfig.pos.currencySymbol}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-300">
                <span>TOTAL FACTURADO:</span>
                <span>{Number(ticketEmitido.total || 0).toFixed(2)} {tenantConfig.pos.currencySymbol}</span>
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-400">
              DOCUMENTO VÁLIDO COMO FACTURA SIMPLIFICADA (RD 1619/2012).
              PLAZO DE CAMBIO O DEVOLUCIÓN: 30 DÍAS NATURALES.
            </p>

            <div className="mt-3 pt-2 border-t border-slate-300 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => imprimirTicketTermico(ticketEmitido, tenantConfig)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold font-mono uppercase flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await generarFacturaDeVenta(ticketEmitido.id);
                    setTicketEmitido(null);
                    setActiveTab('facturacion');
                  }}
                  className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-400 text-xs font-bold font-mono uppercase flex items-center justify-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Pasar a Factura</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setTicketEmitido(null)}
                className="py-1 text-center text-[11px] text-slate-500 hover:text-slate-800 underline font-mono"
              >
                [Cerrar ventana de ticket]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
