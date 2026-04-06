# Arquitetura GCA_Project

## Stack Tecnológico

### Backend
- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Authentication**: JWT
- **Language**: Python 3.11+

### Frontend
- **Framework**: React 18.3.1
- **Build**: Vite 6.0.3
- **Language**: TypeScript 5.6.3
- **Styling**: Tailwind CSS 3.4.16
- **Components**: shadcn/ui + Radix UI

## Estrutura

```
GCA_Project/
├── backend/           # FastAPI
├── frontend/          # React
├── gui-components/    # Design System
├── infra/             # Docker
├── docs/              # Docs
└── scripts/           # Utilities
```

## Deployment

- Docker Compose (local + production)
- Cloudflare (proxy/CDN)
- GitHub Actions (CI/CD)

