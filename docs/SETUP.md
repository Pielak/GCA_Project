# 🚀 GCA_Project Setup Guide

## Pré-requisitos

- **Docker** 20.10+ e **Docker Compose** 2.0+
- **Python** 3.11+ (se rodar sem Docker)
- **Node.js** 20+ (se rodar sem Docker)
- **Git** 2.30+

## Opção 1: Docker Compose (Recomendado)

### Setup Rápido

```bash
# Clonar repositório
git clone https://github.com/Pielak/GCA_Project.git
cd GCA_Project

# Criar arquivo .env (copiar do exemplo)
cp .env.example .env

# Iniciar todos os serviços
docker-compose up -d

# Aguardar inicialização (~30 segundos)
sleep 30

# Verificar logs
docker-compose logs -f
```

### Acessar Serviços

| Serviço | URL | Credenciais |
|---------|-----|------------|
| Frontend | http://localhost:5173 | Consultar QUICKSTART_DEV.md |
| Backend API | http://localhost:8000 | Sem autenticação (dev) |
| API Docs | http://localhost:8000/api/v1/docs | Swagger UI |
| PostgreSQL | localhost:5432 | user: gca / pass: gca_secret |
| Redis | localhost:6379 | Nenhuma |

### Parar Serviços

```bash
docker-compose down

# Com limpeza de volumes
docker-compose down -v
```

---

## Opção 2: Setup Manual (Desenvolvimento)

### Backend

```bash
cd backend

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install poetry
poetry install

# Configurar banco de dados
# (Assumindo PostgreSQL rodando em localhost:5432)
createdb gca
psql gca < ../BD_SCHEMA.sql

# Rodar servidor
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Rodar dev server
npm run dev

# Build para produção
npm run build
```

---

## Variáveis de Ambiente

Editar `.env` para ajustar:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://gca:gca_secret@postgres:5432/gca

# Backend
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
DEBUG=True

# Frontend
VITE_API_URL=http://localhost:8000
VITE_APP_URL=http://localhost:5173

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

---

## Problemas Comuns

### Porta já em uso

```bash
# Mudar porta no docker-compose.yml ou usar
lsof -i :5173  # Verificar processo
kill -9 <PID>  # Matar processo
```

### Database connection error

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Verificar logs
docker-compose logs postgres
```

### Node modules issue

```bash
# Limpar cache
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Desenvolvimento

### Frontend

```bash
# Dev com hot reload
npm run dev

# Build
npm run build

# Preview de produção
npm run preview

# Linting
npm run lint

# Type checking
npm run type-check
```

### Backend

```bash
# Rodar com reload
poetry run uvicorn app.main:app --reload

# Testes
poetry run pytest tests/ --cov=app

# Migrações (Alembic)
alembic revision --autogenerate -m "message"
alembic upgrade head
```

---

## Próximos Passos

- [ ] Configurar variáveis de ambiente de produção
- [ ] Setup CI/CD (GitHub Actions)
- [ ] Deploy em staging
- [ ] Deploy em produção

