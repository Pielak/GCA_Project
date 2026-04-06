"""Tests for password reset flow"""
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_reset_password_request():
    """Test password reset request (forgot password)"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/reset-password",
            json={"email": "test@example.com"}
        )

        # Should return 200 even if email doesn't exist (security)
        assert response.status_code == 200
        assert "message" in response.json()


@pytest.mark.asyncio
async def test_reset_password_verify_invalid_token():
    """Test verifying an invalid/expired reset token"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/verify-reset-token",
            json={"token": "invalid-token-12345"}
        )

        assert response.status_code == 400
        assert not response.json()["valid"]


@pytest.mark.asyncio
async def test_first_access_password_change():
    """Test changing password on first access"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # This would require a valid access token and user in first access state
        # For now, we're just testing the endpoint structure
        response = await client.post(
            "/api/v1/auth/change-first-password",
            json={
                "temporary_password": "TempPass123!@#",
                "new_password": "NewSecurePass123!@#"
            },
            headers={"Authorization": "Bearer invalid-token"}
        )

        # Should fail with invalid token
        assert response.status_code in [401, 400]


@pytest.mark.asyncio
async def test_project_team_invite():
    """Test inviting team member to project"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/projects/proj-123/invite",
            json={
                "email": "developer@example.com",
                "role": "dev_pleno"
            },
            headers={"Authorization": "Bearer invalid-token"}
        )

        # Should fail without valid token
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_accept_project_invite():
    """Test accepting project invitation"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/projects/proj-123/accept-invite",
            json={"token": "invalid-invite-token"}
        )

        # Should fail with invalid token
        assert response.status_code == 400
        assert "detail" in response.json()


@pytest.mark.asyncio
async def test_submit_questionnaire():
    """Test submitting technical questionnaire"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/questionnaires",
            json={
                "project_id": "proj-123",
                "gp_email": "gp@example.com",
                "responses": {
                    "project_name": "Test Project",
                    "frontend_stack": ["React"],
                    "backend_stack": ["FastAPI"],
                    "ai_automation": ["Anthropic"]
                }
            }
        )

        # Should return 200 even without auth for webhook
        assert response.status_code == 200
        assert "questionnaire_id" in response.json()


@pytest.mark.asyncio
async def test_questionnaire_webhook_analysis():
    """Test n8n webhook analysis"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/webhooks/questionnaire",
            json={
                "projectId": "proj-123",
                "gp_email": "gp@example.com",
                "responses": {
                    "frontend_stack": ["React"],
                    "backend_stack": ["FastAPI"],
                    "database_stack": ["PostgreSQL"],
                    "ai_automation": ["Anthropic"],
                    "security_controls": ["Autenticação", "Autorização / RBAC"],
                    "test_types": ["Unitários", "Integração"],
                    "deliverables": ["Aplicação web", "API"]
                }
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "questionnaireStatus" in data
        assert "adherenceScore" in data
        assert "approved" in data


@pytest.mark.asyncio
async def test_questionnaire_conflict_detection():
    """Test n8n conflict detection (React + Flutter)"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/webhooks/questionnaire",
            json={
                "projectId": "proj-123",
                "gp_email": "gp@example.com",
                "responses": {
                    "frontend_stack": ["React", "Flutter"],  # Conflict!
                    "backend_stack": ["FastAPI"],
                    "ai_automation": ["Anthropic"],
                    "security_controls": ["Autenticação"]
                }
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["adherenceScore"] < 85  # Should not be approved
        assert "frontend_stack" in data["highlightedFields"]
