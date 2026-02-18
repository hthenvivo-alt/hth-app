#!/bin/bash

# Navegar a la carpeta del proyecto
cd "$(dirname "$0")"
echo "--- Iniciando HTH Productora Management App ---"

# Función para verificar dependencias
check_dep() {
    if ! command -v $1 &> /dev/null; then
        echo "ERROR: $1 no está instalado. Por favor instalalo antes de continuar."
        exit 1
    fi
}

check_dep "docker"
check_dep "node"
check_dep "npm"

# 1. Levantar Docker
echo "--- Levantando Base de Datos ---"
if ! docker info &> /dev/null; then
    echo "ERROR: Docker no parece estar corriendo. Por favor abrí Docker Desktop primero."
    read -p "Presioná Enter para salir..."
    exit 1
fi

docker compose up -d || docker-compose up -d

# 2. Configurar Backend
echo "--- Iniciando Backend ---"
osascript -e 'tell application "Terminal" to do script "cd \"'"$PWD"'/server\" && npm install && npm run prisma:generate && npm run dev"'

# 3. Configurar Frontend
echo "--- Iniciando Frontend ---"
osascript -e 'tell application "Terminal" to do script "cd \"'"$PWD"'/client\" && npm install && npm run dev"'

echo "--- Verificando servicios ---"
echo "Esperando a que el backend (puerto 3000) esté listo..."
COUNT=0
while ! lsof -i :3000 &> /dev/null; do
    sleep 2
    let COUNT=COUNT+1
    if [ $COUNT -gt 30 ]; then
        echo "ADVERTENCIA: El backend está tardando mucho en iniciar. Por favor revisá la terminal del server."
        break
    fi
done

echo "--- ¡Listo! ---"
echo "Servidor API: http://localhost:3000"
echo "Frontend:     http://localhost:5173"
echo ""
echo "Usuario predeterminado: admin@hth.com"
echo "Contraseña:             password123"
echo "--------------------------------------------"
