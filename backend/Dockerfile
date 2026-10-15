FROM alpine:3.20

ARG PB_VERSION=0.40.5

RUN apk add --no-cache \
    unzip \
    ca-certificates \
    wget

# Descargar la versión oficial de PocketBase para la arquitectura detectada
RUN ARCH="$(uname -m)" && \
    case "$ARCH" in \
      x86_64) PB_ARCH="amd64" ;; \
      aarch64|arm64) PB_ARCH="arm64" ;; \
      *) echo "Arquitectura no soportada: $ARCH" && exit 1 ;; \
    esac && \
    echo ">> Descargando PocketBase v${PB_VERSION} para Linux (${PB_ARCH})..." && \
    wget --no-verbose "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip" -O /tmp/pb.zip && \
    mkdir -p /pb && \
    unzip /tmp/pb.zip -d /pb/ && \
    chmod +x /pb/pocketbase && \
    rm /tmp/pb.zip

WORKDIR /pb

# Copiar script de arranque con seed de datos
COPY entrypoint.sh /pb/entrypoint.sh
RUN tr -d '\r' < /pb/entrypoint.sh > /pb/entrypoint.sh.tmp && \
    mv /pb/entrypoint.sh.tmp /pb/entrypoint.sh && \
    chmod +x /pb/entrypoint.sh

# Copiar migraciones de PocketBase
COPY pb_migrations /pb/pb_migrations

# Copiar datos preconfigurados (seed) para inicialización del volumen persistente
COPY pb_data /pb/pb_data_seed

EXPOSE 8090

VOLUME ["/pb/pb_data"]

ENTRYPOINT ["/pb/entrypoint.sh"]
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--migrationsDir=/pb/pb_migrations"]
