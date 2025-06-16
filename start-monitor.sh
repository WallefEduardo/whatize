#!/bin/bash

# Script de inicialização do Whatize Monitor
# Executa o monitor principal da pasta correta

echo "🚀 Iniciando Whatize Monitor..."
echo ""

# Verificar se a pasta monitoring existe
if [ ! -d "monitoring" ]; then
    echo "❌ Pasta 'monitoring' não encontrada!"
    echo "Execute este script da raiz do projeto Whatize."
    exit 1
fi

# Entrar na pasta de scripts e executar o monitor
cd monitoring/scripts
./whatize-monitor.sh 