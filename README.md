# 🛍️ ModaDAW ERP · Sistema de Gestión para Tienda de Ropa

Sistema ERP a medida diseñado para la gestión integral de un comercio minorista de ropa y confección textil, desarrollado conforme a los requisitos, rúbrica y competencias del ciclo **DAW (Desarrollo de Aplicaciones Web)**.

El sistema cuenta con una **estética visual clásica, burocrática y funcional** (estilo *Factusol / SAP GUI / intranet corporativa tradicional* en escala de grises y pizarra neutra), priorizando la densidad informativa, la agilidad en mostrador y prescindiendo de estéticas artificiales de IA o SaaS modernos.

---

## ⚡ 1. Puesta en Marcha (Cómo Ejecutarlo)

### Requisitos Previos
* **Node.js** (versión 18 o superior recomendada)
* **npm** (incluido con Node.js)
* Sistema operativo Windows (el binario de PocketBase para Windows ya está incluido en `backend/`)

---

### Paso a Paso para Arrancar el Proyecto

Abre **dos terminales** en la carpeta raíz del proyecto (`c:\Users\5996921\Desktop\repos-master\git\erp-sistemas`):

#### Terminal 1 — Arrancar la Base de Datos (PocketBase SQLite)
```bash
npm run pb
```
> *También puedes arrancarlo ejecutando directamente:* `.\backend\pocketbase.exe serve`
> 
> * Servidor API REST: **http://127.0.0.1:8090/api/**
> * Panel de control de la base de datos: **http://127.0.0.1:8090/_/**

#### Terminal 2 — Arrancar el Frontend Web (React + Vite)
```bash
# Si es la primera vez que se clona:
npm install

# Iniciar servidor de desarrollo:
npm run dev
```
> * Aplicación web lista en: **http://localhost:5173/**

---

### 🔑 Credenciales de Acceso al Sistema

Al abrir la aplicación web (`http://localhost:5173` en local o el puerto asignado en despliegue), la pantalla de autenticación dispone de **botones de acceso directo de 1 clic**, o puedes introducir manualmente:

| Perfil / Rol | Usuario | Contraseña | Permisos y Alcance |
| :--- | :--- | :--- | :--- |
| **Administrador** (Laura Gómez) | `admin` *(o `admin@modaurban.es`)* | `admin` | Acceso irrestricto a todos los módulos (incluyendo Proveedores, Compras mayoristas, Finanzas e Informes) |
| **Dependiente** (Carlos Ruiz) | `empleado` *(o `empleado@modaurban.es`)* | `empleado` | Acceso de mostrador: Terminal de Ventas (TPV/POS), Consulta de Stock, Directorio de Clientes y Devoluciones |

#### Acceso al Panel de Control de la Base de Datos PocketBase (`http://127.0.0.1:8090/_/`):
* **Email:** `admin@admin.com`
* **Contraseña:** `admin@admin.com`

---

### 🌐 Configuración SaaS / Multi-Tenant (`.env`)
El sistema está diseñado con arquitectura **SaaS / Marca Blanca**. Todo lo que dependa del cliente (nombre comercial, datos fiscales de la tienda, entidad bancaria, número de caja y paleta de colores corporativos) se configura directamente desde el archivo `.env` sin modificar el código fuente:

```env
# 1. CONEXIÓN A BASE DE DATOS POCKETBASE
VITE_POCKETBASE_URL=http://127.0.0.1:8090

# 2. IDENTIDAD DE MARCA Y NOMBRE DE LA TIENDA (CLIENTE SAAS)
VITE_STORE_NAME=ModaDaw
VITE_STORE_TAGLINE=Sistema de Gestión Comercial y TPV

# 3. DATOS FISCALES Y DE CONTACTO (TICKETS Y FACTURAS OFICIALES)
VITE_COMPANY_LEGAL_NAME=MODA URBAN S.L.
VITE_COMPANY_ACTIVITY=Comercio Minorista de Confección Textil y Ropa
VITE_COMPANY_CIF=B-99887766
VITE_COMPANY_ADDRESS=Calle Gran Vía 10 · 28013 Madrid (España)
VITE_COMPANY_PHONE=(+34) 91 555 44 33
VITE_COMPANY_EMAIL=facturas@modaurban.es
VITE_COMPANY_BANK=CaixaBank / Operativa Comercial
VITE_COMPANY_IBAN=ES91 2100 0418 4502 0005 1324
VITE_COMPANY_REG_DATA=Inscrita en el Registro Mercantil de Madrid, Tomo 34.201, Folio 88, Sección 8, Hoja M-615243
VITE_COMPANY_WEBSITE=www.modadaw.es

# 4. CONFIGURACIÓN DE VENTA Y FACTURACIÓN (DIVISA E IMPUESTOS)
VITE_CURRENCY_SYMBOL=€
VITE_DEFAULT_TAX_RATE=21

# 5. PERSONALIZACIÓN DE COLORES Y BRANDING CORPORATIVO (MULTI-TENANT)
# Paleta por defecto: Pizarra Clásico / ModaDaw
VITE_THEME_PRIMARY_COLOR=#334155
VITE_THEME_PRIMARY_HOVER=#1e293b
VITE_THEME_NAVBAR_BG=#1e293b
VITE_THEME_ACCENT_COLOR=#0284c7
VITE_THEME_BG_LIGHT=#eaedf1
VITE_THEME_BG_DARK=#0b1120

# Paleta 2 (ej. Boutique Rose / Rosa Glamour):
# VITE_STORE_NAME=Boutique Rose
# VITE_THEME_PRIMARY_COLOR=#be185d
# VITE_THEME_NAVBAR_BG=#831843
# VITE_THEME_ACCENT_COLOR=#ec4899
# VITE_THEME_BG_LIGHT=#fdf2f8
# VITE_THEME_BG_DARK=#1a0510

# Paleta 3 (ej. Eco Fashion / Verde Esmeralda):
# VITE_STORE_NAME=Eco Fashion
# VITE_THEME_PRIMARY_COLOR=#047857
# VITE_THEME_NAVBAR_BG=#064e3b
# VITE_THEME_ACCENT_COLOR=#10b981
# VITE_THEME_BG_LIGHT=#f0fdf4
# VITE_THEME_BG_DARK=#021a13
```

* **Despliegue Multi-cliente:** Permite desplegar la misma base de código para diferentes comercios textiles simplemente ajustando el archivo `.env`.
* **Theming Dinámico y Coherencia Cromática:** Las variables de entorno y el selector de branding gobiernan toda la aplicación sin estilos azules o grises hardcodeados. Al alternar entre Modo Claro y Modo Oscuro, las cabeceras, superficies, tablas, gráficos estadísticos y botones primarios preservan armónicamente la identidad corporativa de la marca.

---

## 🔑 2. Credenciales de Acceso y Herramientas

El sistema dispone de roles diferenciados con credenciales simplificadas para facilitar la defensa y evaluación académica:

### 👤 Usuarios del ERP (Pantalla de Login del Sistema)

| Rol | Usuario | Contraseña | Permisos y Alcance |
|---|---|---|---|
| **Administrador** | `admin` *(o admin@modaurban.es)* | `admin` | **Control total:** Gestión de costes de compra, márgenes, eliminación de artículos/clientes, acceso a Proveedores y Balances Financieros. |
| **Empleado / Cajero** | `empleado` *(o empleado@modaurban.es)* | `empleado` | **Perfil de mostrador:** Terminal Punto de Venta (TPV/Caja), Catálogo de ropa, Libro de clientes, Facturación y Cambios de talla. |

> 💡 **Acceso rápido y panel de Depuración (`Debug`):**
> * En la pantalla de login existen botones directos (`[ADMINISTRADOR]` y `[DEPENDIENTE]`) para iniciar sesión con un solo clic.
> * Una vez dentro del sistema, en la **esquina inferior izquierda** se encuentra el botón flotante **`[🐛 Debug]`**, que abre una ventana con:
>   * **Branding SaaS en Vivo:** Selector instantáneo de paletas corporativas (`🏢 Pizarra`, `🌸 Boutique Rose`, `🌿 Eco Fashion`) con conmutación en 0ms durante la presentación.
>   * **Conmutación de Rol:** Cambio en caliente de *Administrador* a *Dependiente* sin tener que cerrar sesión.
>   * **Estado de Base de Datos:** Monitorización de conexión y latencia con PocketBase.
>   * **Reset Demo:** Restauración de los datos iniciales a valores de prueba de fábrica.
> * En la **esquina superior derecha** del menú principal se ubica el conmutador de **Modo Claro / Modo Oscuro** (`[☀️ / 🌙]`), completamente sincronizado con cualquier paleta activa.

---

### 🛠️ Superusuario de PocketBase (Gestor del Motor Backend)
Para acceder al panel interno de control de tablas y colecciones SQLite en **http://127.0.0.1:8090/_/**:
* **Email:** `admin@admin.com`
* **Contraseña:** `admin@admin.com`

---

## 📖 3. Manual de Usuario y Guía Funcional de Módulos

El sistema está organizado en **8 módulos operativos** accesibles mediante la barra de pestañas superior:

### 1. Inicio / Panel de Control (`Dashboard.jsx`)
* **Métricas contables en tiempo real:** Cómputo global de caja facturada, volumen total de existencias en almacén, censo de clientes fidelizados y facturas emitidas.
* **Avisos de rotura de stock:** Tabla de alerta inmediata con aquellas prendas cuyas existencias sean iguales o inferiores al umbral de seguridad (&le; 5 unidades).
* **Últimos comprobantes de caja:** Registro correlativo de las últimas transacciones cobradas en mostrador.

### 2. Terminal Punto de Venta / Caja (`Ventas.jsx`)
* **Catálogo táctil con buscador:** Filtro por familias textiles (Camisetas, Pantalones, Vestidos, Chaquetas, etc.) y búsqueda por código SKU o nombre.
* **Selector de variantes:** Al hacer clic en cualquier prenda, se abre una ventana modal para elegir la **Talla** (XS a XXL) y el **Color** concreto antes de agregarla al ticket.
* **Liquidación de caja y desglose fiscal:** Cálculo dinámico de Base Imponible, cuota de **IVA (21%)** y Total.
* **Múltiples formas de pago:** Tarjeta bancaria, Efectivo y Bizum.
* **Emisión de ticket:** Al pulsar *"Cobrar"*, descuenta automáticamente las unidades del inventario en PocketBase y genera un ticket fiscal térmico imprimible.

### 3. Catálogo de Ropa e Inventario (`Productos.jsx`)
* **Libro de referencias:** Cuadrícula de inventario con SKU, modelo, categoría, temporada, precio de adquisición (coste visible solo para Administrador), PVP y stock.
* **Control de existencias:** Distinción visual para roturas de stock.
* **Alta y modificación de prendas:** Ventana modal de alta con matriz de tallas comerciales y cartas de colores separadas por comas.

### 4. Directorio de Clientes (`Clientes.jsx`)
* **Fichero de terceros:** Altas, modificaciones, consultas y bajas de clientes (la eliminación de fichas está reservada al rol Administrador).
* **Búsqueda instantánea:** Filtro en vivo por Nombre, DNI/NIF, Teléfono o Correo.
* **Programa de fidelización:** Acumulación automática de puntos de fidelidad y registro del gasto histórico acumulado por cada comprador.

### 5. Libro de Facturación Oficial (`Facturas.jsx`)
* **Cumplimiento legal del Real Decreto 1619/2012:** Generación de facturas formales con numeración correlativa (`FAC-2026-XXXX`).
* **Conversión de tickets:** Panel específico que lista los tickets de caja pendientes de emitir factura formal.
* **Emisión Directa B2B y Edición Fiscal:** Posibilidad de emitir nuevas facturas mercantiles directas y editar datos fiscales de clientes (NIF, Razón Social, Domicilio) sobre facturas ya emitidas.
* **Generador de Facturas A4 Tradicional:** Motor de impresión aislado (`invoicePrinter.js`) que genera un folio físico estándar A4 en blanco puro con alto contraste, completamente inmune a estilos web o modo oscuro, con membrete oficial, datos bancarios con IBAN, desglose tributario y pie legal con Registro Mercantil y RGPD (apto para entrega a gestoría o guardado directo en PDF).

### 6. Devoluciones y Cambios de Talla (`Devoluciones.jsx`)
* **Funcionalidad específica del sector textil:**
  1. **Cambio directo de talla:** Registra la permuta en caja (ejemplo: talla M por talla L) manteniendo la trazabilidad del ticket original.
  2. **Devolución con vale de tienda:** Genera un vale alfanumérico canjeable para el cliente y **reintegra automáticamente 1 unidad al stock** del producto en PocketBase.
* **Resguardo impreso:** Impresión de justificante oficial de la operación para el cliente.

### 7. Proveedores y Albaranes de Compra (`Proveedores.jsx`) — *Solo Administrador*
* **Directorio de fabricantes textiles:** Fichas de proveedores con CIF, persona de contacto, teléfono y catálogo suministrado.
* **Entradas de mercancía / Albaranes:** Formulario con múltiples líneas de artículos para registrar pedidos mayoristas que **suman automáticamente existencias reales** al inventario de la tienda.

### 8. Informes y Balances de Explotación (`Informes.jsx`) — *Solo Administrador*
Cumple con la exigencia de la práctica de disponer de al menos 3 informes de utilidad empresarial:
1. **Informe 1 (Ventas por Mes):** Gráfico comparativo de facturación mensual con desglose de tickets, base imponible e IVA repercutido.
2. **Informe 2 (Prenda Estrella):** Ranking de top ventas en confección con detalle de las tallas más demandadas.
3. **Informe 3 (Mejores Clientes):** Ranking de compradores por volumen de gasto y puntos de fidelidad.
4. **Informe 4 (Stock Crítico):** Informe de reposición urgente para emisión de pedidos a fábrica.
* Todos los informes cuentan con botón de impresión directa a documento oficial.

---

## 🏗️ 4. Arquitectura y Tecnologías Empleadas

* **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide React Icons](https://lucide.dev/).
* **Backend y Base de Datos:** [PocketBase v0.40.5](https://pocketbase.io/) (motor SQLite relacional autónomo y embebido en Go, sin necesidad de instalar servicios externos como MySQL o PostgreSQL).
* **Mecanismo de Resiliencia en Vivo:** La aplicación implementa un adaptador híbrido (`src/context/AuthContext.jsx` y `src/context/ErpContext.jsx`). Si durante la defensa en clase el servicio de PocketBase se detuviese accidentalmente, el ERP conmuta sin interrupciones a una réplica local sincronizada para asegurar que la exposición nunca falle.

---

## 🚀 5. Despliegue en Homelab (Coolify / Docker Compose)

Para desplegar el sistema en servidores o laboratorios domésticos (Proxmox, Ubuntu VM, VPS) mediante **Coolify**:
* Usa directamente la rama **`production`**.
* Incluye orquestación `docker-compose.yml` con auto-aprovisionamiento de PocketBase y Nginx reverse proxy.
* Toda la base de datos (artículos, clientes, tickets de prueba y credenciales de acceso) se encuentra precargada de fábrica.
* Consulta la guía paso a paso en [COOLIFY_DEPLOY.md](file:///c:/Users/5996921/Desktop/repos-master/git/erp-sistemas/COOLIFY_DEPLOY.md).

