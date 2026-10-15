# 🚀 Guía de Despliegue en Homelab (Proxmox + Ubuntu + Coolify)

Esta guía detalla los pasos para desplegar automáticamente **ModaUrban ERP** (Frontend React + Backend PocketBase con datos integrados) en tu homelab utilizando **Coolify** sobre una máquina virtual Ubuntu en **Proxmox VE**.

---

## 🏗️ Arquitectura de Producción

El despliegue está orquestado mediante `docker-compose.yml` e incluye:

1. **`frontend` (React + Nginx)**:
   - Compilado multi-stage ultra ligero sobre Alpine Linux.
   - Nginx actúa como servidor web de producción y **Reverse Proxy interno**.
   - Redirige de forma transparente las llamadas `/api/*` y la consola de administración `/_/*` hacia el contenedor de PocketBase.
   - **Ventaja**: Despliegue en un único puerto o dominio sin problemas de CORS ni certificados SSL cruzados.

2. **`pocketbase` (Backend SQLite en Alpine)**:
   - Binario oficial PocketBase v0.40.5 compilado para Linux.
   - Volumen persistente Docker (`erp_pb_data`) mapeado en `/pb/pb_data`.
   - **Auto-Seed Integrado**: En el primer arranque, `entrypoint.sh` detecta si el volumen está vacío y copia automáticamente la base de datos preconfigurada (`backend/pb_data/data.db`) con todos los productos, clientes, compras, facturas, devoluciones y usuarios.

---

## 📋 Requisitos Previos

- VM Ubuntu en Proxmox con Docker y Coolify operativos.
- Acceso al panel web de Coolify (usualmente en el puerto `8000` de la VM: `http://<IP_UBUNTU>:8000`).
- Rama `production` del repositorio GitHub: `https://github.com/kzp8/erp-sistemas.git`.

---

## 🛠️ Pasos de Despliegue en Coolify

### 1. Crear nuevo recurso en Coolify
1. Accede a tu panel de **Coolify**.
2. Entra en tu **Project** y selecciona el **Environment** (por ejemplo, `production` o `default`).
3. Haz clic en **+ New Resource**.
4. Selecciona **Public Repository** (o *Private Repository (GitHub App)* si tu repositorio es privado).

### 2. Configurar el Repositorio
1. **Repository URL**: `https://github.com/kzp8/erp-sistemas.git`
2. **Branch**: `production`  *(⚠️ Asegúrate de cambiar `main` por `production`)*.
3. **Build Pack**: Selecciona **Docker Compose** (Coolify lo detectará automáticamente gracias a `docker-compose.yml`).

### 3. Configuración de Red y Dominios
En la pantalla de configuración del servicio en Coolify:
- **Frontend**:
  - En el campo **Domains / FQDN** de la aplicación `frontend`, puedes asignar tu dominio local o tu IP con puerto:
    - Con dominio local/DNS: `http://erp.homelab.local` o `https://erp.tu-dominio.com`
    - Sin dominio (acceso directo por puerto): déjalo vacío o usa `http://<IP_DE_UBUNTU>:3000`.
- **PocketBase (Opcional)**:
  - No requiere dominio público obligatorio porque Nginx ya expone `/api/` y `/_/`.
  - Si deseas acceder directamente al puerto nativo de PocketBase desde tu red local LAN, estará disponible en el puerto `8090` (`http://<IP_DE_UBUNTU>:8090`).

### 4. Variables de Entorno (Opcional)
Por defecto **no se requiere ninguna variable obligatoria**, ya que el frontend se conecta automáticamente al mismo origen mediante Nginx.

Si deseas personalizar el branding del ERP o la paleta de colores para tu despliegue, puedes añadir en la sección **Environment Variables** de Coolify:
```env
VITE_APP_NAME=ModaUrban ERP
VITE_APP_DESCRIPTION=Sistema de Gestión Integral
VITE_THEME_COLOR=emerald
VITE_POCKETBASE_URL=
```
*(Si dejas `VITE_POCKETBASE_URL` vacío, utilizará el proxy inverso de Nginx de forma automática).*

### 5. Desplegar
1. Haz clic en el botón superior **Deploy**.
2. Coolify descargará el código de la rama `production`, construirá ambas imágenes (`erp-frontend` y `erp-pocketbase`), inicializará el volumen con los datos integrados y levantará los contenedores.
3. En menos de 2 minutos verás ambos contenedores con estado **Running / Healthy**.

---

## 🔑 Credenciales de Acceso al Sistema

### 1. Acceso a la Interfaz Web del ERP (`http://<IP_UBUNTU>:3000`)
La pantalla de inicio de sesión (`Login.jsx`) cuenta con **botones de acceso rápido de un solo clic**, o puedes introducir manualmente las credenciales:

| Rol | Usuario / Identificador | Contraseña | Permisos y Alcance |
| :--- | :--- | :--- | :--- |
| **Administrador** (Laura Gómez) | `admin` *(o `admin@modaurban.es`)* | `admin` | Acceso total a todos los módulos (incluyendo Proveedores, Compras mayoristas, Finanzas e Informes) |
| **Dependiente** (Carlos Ruiz) | `empleado` *(o `empleado@modaurban.es`)* | `empleado` | Acceso a TPV / Ventas en caja, Consulta de Stock, Directorio de Clientes y Devoluciones |

> 💡 **Acceso en un clic:** La propia pantalla de bienvenida del ERP incluye dos botones de acceso rápido etiquetados **`[ADMINISTRADOR]`** y **`[DEPENDIENTE]`** para ingresar de inmediato sin tener que escribir usuario ni contraseña.

### 2. Acceso al Panel de Control de PocketBase
Disponible a través del proxy en `http://<IP_UBUNTU>:3000/_/` (o directamente en `http://<IP_UBUNTU>:8090/_/`):
- **Superuser Email:** `admin@admin.com`
- **Contraseña:** `admin@admin.com`

---

## 💾 Persistencia y Backups en Proxmox

- La base de datos SQLite y los ficheros subidos se guardan de forma persistente en el volumen Docker con nombre `erp_pb_data` en tu VM de Ubuntu.
- Los reinicios de los contenedores o nuevas actualizaciones de código **no borran** los datos que crees.
- Puedes incluir la VM de Ubuntu en las tareas de **Proxmox Backup Server (PBS)** o snapshots periódicos de Proxmox para tener copias de seguridad completas de todo el sistema.

---

## 🔄 Despliegue Continuo (CI/CD Automático)
Si deseas que cada vez que subas cambios a la rama `production` se despliegue automáticamente en tu homelab:
1. En Coolify, ve a la pestaña **Webhooks** de tu aplicación.
2. Copia la URL del **Deploy Webhook**.
3. En GitHub, ve a **Settings** -> **Webhooks** -> **Add webhook**, pega la URL y selecciona eventos de `push` a la rama `production`.
