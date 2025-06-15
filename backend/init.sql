-- Arquivo de inicialização do PostgreSQL para Whatize
-- Este arquivo é executado automaticamente quando o container é criado pela primeira vez

-- Garantir que o banco whatize existe
SELECT 'CREATE DATABASE whatize'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'whatize')\gexec

-- Conectar ao banco whatize
\c whatize;

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- Mensagem de sucesso
SELECT 'Banco de dados Whatize inicializado com sucesso!' as status; 