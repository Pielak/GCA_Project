# GCA - Gestão de Codificação Assistida

Plataforma de orquestração, governança e visibilidade de projetos de software com isolamento por tenant, ciclo documental completo e rastreabilidade total.

## 📋 Estrutura

- **backend/** - FastAPI server
- **frontend/** - React + Vite + Electron
- **gui-components/** - Design system (shadcn/ui)
- **infra/** - Docker Compose e configurações
- **docs/** - Documentação
- **scripts/** - Scripts utilitários

## 🚀 Quick Start

### Docker (Recomendado)
```bash
docker-compose up -d
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/api/v1/docs
```

### Backend Manual
```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

### Frontend Manual
```bash
cd frontend
npm install
npm run dev
```

## 📚 Documentação

- [Architecture](docs/ARCHITECTURE.md)
- [Setup Guide](docs/SETUP.md)
- [API Reference](docs/API.md)

## 🔗 Repositórios Originais
- Backend/Frontend: https://github.com/Pielak/GCA
- Design System: https://github.com/Pielak/Gcagui

## 📄 Licença

MIT
