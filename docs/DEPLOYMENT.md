# 🚀 GCA_Project Deployment Guide

## Ambientes Suportados

- **Development**: Local (docker-compose)
- **Staging**: VPS/Cloud (docker + Cloudflare)
- **Production**: VPS/Cloud (docker + Cloudflare + SSL)

---

## Deploy em Novo Servidor

### Pré-requisitos

- Ubuntu 20.04+ LTS
- Docker 20.10+
- Docker Compose 2.0+
- Git
- Domain com DNS configurado

### Passo 1: Conectar ao Servidor

```bash
# SSH
ssh user@your-server.com

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Passo 2: Clonar Repositório

```bash
cd /opt
sudo git clone https://github.com/Pielak/GCA_Project.git
cd GCA_Project

# Permissões
sudo chown -R $USER:$USER /opt/GCA_Project
```

### Passo 3: Configurar Variáveis de Produção

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com valores de produção
nano .env

# Valores críticos para produção:
DATABASE_URL=postgresql+asyncpg://gca:STRONG_PASSWORD@postgres:5432/gca
SECRET_KEY=GENERATE_WITH_openssl_rand_-hex_32
DEBUG=False
APP_ENV=production
VITE_API_URL=https://api.seu-dominio.com
VITE_APP_URL=https://seu-dominio.com
```

### Passo 4: Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Gerar certificado
sudo certbot certonly --standalone -d seu-dominio.com -d api.seu-dominio.com

# Renovação automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Passo 5: Nginx como Reverse Proxy

```bash
# Instalar Nginx
sudo apt install nginx -y

# Criar config
sudo nano /etc/nginx/sites-available/gca
```

**Conteúdo do arquivo:**

```nginx
upstream frontend {
    server localhost:5173;
}

upstream backend {
    server localhost:8000;
}

server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/private.key;

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/v1 {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Ativar config
sudo ln -s /etc/nginx/sites-available/gca /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Passo 6: Usar docker-compose.production.yml

```bash
cd /opt/GCA_Project

# Iniciar com arquivo de produção
docker-compose -f docker-compose.production.yml up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Passo 7: Backup e Monitoring

```bash
# Backup automático de PostgreSQL
sudo crontab -e

# Adicionar linha:
0 2 * * * docker-compose -f /opt/GCA_Project/docker-compose.production.yml exec -T postgres pg_dump -U gca gca > /backups/gca_$(date +\%Y\%m\%d).sql
```

---

## Cloudflare Configuration

1. Adicionar domínio no Cloudflare
2. Configurar nameservers no registrador
3. Em Cloudflare:
   - SSL/TLS → Full (strict)
   - Page Rules → Cache Everything
   - Firewall → Rate limiting

---

## CI/CD com GitHub Actions

Workflows já configurados:
- `.github/workflows/backend-tests.yml` — Roda testes
- `.github/workflows/frontend-build.yml` — Build frontend

Para deploy automático, criar novo workflow:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy via SSH
        run: |
          ssh -i ${{ secrets.DEPLOY_KEY }} user@server "cd /opt/GCA_Project && git pull && docker-compose -f docker-compose.production.yml up -d"
```

---

## Monitoramento

### Logs

```bash
# Backend
docker-compose logs -f backend --tail=50

# Frontend
docker-compose logs -f frontend --tail=50

# Database
docker-compose logs -f postgres --tail=50
```

### Health Checks

```bash
# Backend
curl http://localhost:8000/health

# Frontend
curl http://localhost:5173
```

### Métricas (Prometheus + Grafana - Opcional)

Adicionar ao docker-compose.yml para monitoramento avançado.

---

## Troubleshooting

### Porta já em uso

```bash
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :5173
sudo lsof -i :8000
```

### Erro de conexão com banco

```bash
# Verificar status
docker-compose ps postgres

# Reiniciar
docker-compose restart postgres
```

### Certificado SSL expirado

```bash
sudo certbot renew --dry-run
sudo certbot renew
```

---

## Checklist de Deploy

- [ ] Servidor preparado (Docker, Docker Compose)
- [ ] Repositório clonado
- [ ] .env configurado com valores de produção
- [ ] SSL/TLS configurado
- [ ] Nginx reverso proxy ativo
- [ ] docker-compose.production.yml rodando
- [ ] Backups agendados
- [ ] Logs sendo monitorados
- [ ] Health checks funcionando
- [ ] DNS apontando corretamente
- [ ] Cloudflare configurado

