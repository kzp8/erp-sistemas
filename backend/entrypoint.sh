#!/bin/sh
set -e

# Si la base de datos no existe en el volumen persistente, copiar los datos preconfigurados del repositorio
if [ ! -f "/pb/pb_data/data.db" ] && [ -d "/pb/pb_data_seed" ]; then
    echo ">> [PocketBase] Primera ejecución detectada en Coolify."
    echo ">> [PocketBase] Inicializando volumen persistente con datos integrados (productos, clientes, usuarios, ventas)..."
    mkdir -p /pb/pb_data
    cp -r /pb/pb_data_seed/* /pb/pb_data/
    echo ">> [PocketBase] Base de datos SQLite restaurada con éxito en /pb/pb_data/data.db"
fi

# Asegurar permisos correctos
chmod -R 777 /pb/pb_data 2>/dev/null || true

echo ">> [PocketBase] Iniciando servidor PocketBase v0.40.5 en 0.0.0.0:8090..."
exec "$@"
