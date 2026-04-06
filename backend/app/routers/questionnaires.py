"""Questionnaires Router"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from pydantic import BaseModel
from typing import Dict, Any, Optional
import structlog

from app.db.database import get_db
from app.services.questionnaire_service import QuestionnaireService
from app.middleware.auth import get_current_user_from_token

logger = structlog.get_logger(__name__)

router = APIRouter()


# Request/Response Models
class SubmitQuestionnaireRequest(BaseModel):
    """Request: Submit technical questionnaire"""
    project_id: UUID
    gp_email: str
    responses: Dict[str, Any]


class SubmitQuestionnaireResponse(BaseModel):
    """Response: Questionnaire submitted"""
    questionnaire_id: str
    project_id: str
    status: str = "pending"
    submission_date: str
    message: str = "Questionário submetido para análise. Você receberá um email com o resultado"


class QuestionnaireStatusResponse(BaseModel):
    """Response: Questionnaire status with n8n analysis"""
    questionnaire_id: str
    status: str  # Pendente, Incompleto, OK
    submission_date: str
    observations: Optional[str] = None
    restrictions: Optional[str] = None
    highlighted_fields: list = []
    internal: Optional[Dict[str, Any]] = None  # Only for admin


@router.post("/", response_model=SubmitQuestionnaireResponse)
async def submit_questionnaire(
    req: SubmitQuestionnaireRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Submit technical questionnaire for n8n analysis.
    Triggers n8n webhook for intelligent validation.
    """
    success, questionnaire_id, error = await QuestionnaireService.submit_questionnaire(
        db=db,
        project_id=req.project_id,
        gp_email=req.gp_email,
        responses=req.responses,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error,
        )

    from datetime import datetime, timezone
    return SubmitQuestionnaireResponse(
        questionnaire_id=questionnaire_id,
        project_id=str(req.project_id),
        status="pending",
        submission_date=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/{questionnaire_id}/status", response_model=QuestionnaireStatusResponse)
async def get_questionnaire_status(
    questionnaire_id: str,
    current_user_id: Optional[UUID] = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Get questionnaire status with n8n analysis results.
    Admin sees: adherence_score + gaps
    GP sees: only status + observations + restrictions
    """
    # Determine if user is admin (for now, simplified)
    is_admin = False  # Would check user.is_admin in real implementation

    status = await QuestionnaireService.get_questionnaire_status(
        db=db,
        questionnaire_id=questionnaire_id,
        is_admin=is_admin,
    )

    return QuestionnaireStatusResponse(**status)
