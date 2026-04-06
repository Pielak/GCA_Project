# 📚 GCA API Reference

## Overview

Backend: FastAPI 0.104.1  
Base URL: `http://localhost:8000/api/v1`  
Documentation: `http://localhost:8000/api/v1/docs`

## Authentication

### JWT Token

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rafael@gca.dev",
    "password": "your-password"
  }'

# Resposta
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

### Usar Token

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:8000/api/v1/admin/users
```

---

## API Routers (14 Total)

### 1. Authentication (`/auth`)
- `POST /login` — Login
- `POST /refresh` — Refresh token
- `POST /reset-password` — Reset password
- `POST /bootstrap-admin` — Bootstrap admin

### 2. Admin (`/admin`)
- `GET /users` — List users
- `POST /users/{id}/reset-password` — Reset password
- `POST /users/{id}/lock` — Lock user
- `POST /users/{id}/unlock` — Unlock user
- `GET /suspicious-access` — List blocked attempts
- `POST /suspicious-access/{id}/unblock` — Unblock
- `GET /tickets` — List support tickets
- `GET /tickets/{id}` — Get ticket details
- `POST /tickets/{id}/respond` — Respond to ticket
- `POST /integrations/webhook-test` — Test webhook
- `GET /alerts/history` — Alert history
- `POST /alerts/{id}/acknowledge` — Acknowledge alert
- `GET /dashboard/metrics` — Executive metrics

### 3. Users (`/users`)
- `GET /` — Get current user
- `PUT /profile` — Update profile
- `POST /change-password` — Change password

### 4. Projects (`/projects`)
- `GET /` — List projects
- `POST /` — Create project
- `GET /{id}` — Get project details
- `PUT /{id}` — Update project
- `DELETE /{id}` — Delete project

### 5. GitHub (`/github`)
- `GET /repos` — List repos
- `POST /pulls/{owner}/{repo}` — Get PRs
- `POST /pulls/{owner}/{repo}/{pr_number}/comments` — Comment PR

### 6. Code Generation (`/code-generation`)
- `POST /generate` — Generate code

### 7. Evaluation (`/evaluation`)
- `POST /evaluate` — Evaluate project

### 8. Dashboard (`/dashboard`)
- `GET /metrics` — Get metrics

### 9-14. Outros Routers
- Webhooks, Validation, Questionnaires, Onboarding, Organizations, OCG

---

## Status Codes

| Código | Significado |
|--------|-----------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Exemplos

### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rafael@gca.dev",
    "password": "••••••••"
  }'
```

### List Users (Admin)

```bash
TOKEN="your-token-here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/admin/users
```

### Create Project

```bash
TOKEN="your-token-here"
curl -X POST http://localhost:8000/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "description": "Project description",
    "repository_url": "https://github.com/user/repo"
  }'
```

---

## Rate Limiting

- 1000 requisições por hora por IP
- 100 requisições por minuto por usuário

---

## Documentação Interativa

Acesse **Swagger UI**: http://localhost:8000/api/v1/docs

Ou **ReDoc**: http://localhost:8000/api/v1/redoc

