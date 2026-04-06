"""
Admin Router
Rotas de admin para gerenciar projetos e tenants
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID, uuid4
from pydantic import BaseModel, EmailStr
import structlog
import secrets
import string

from app.db.database import get_db
from app.services.admin_service import AdminService
from app.services.email_service import EmailService
from app.middleware.auth import get_current_user_from_token
from app.models.base import User
from app.core.security import hash_password

logger = structlog.get_logger(__name__)

router = APIRouter(tags=["admin"])


# ========== REQUEST MODELS ==========

class CreateProjectRequest(BaseModel):
    """Request to create new project"""
    project_name: str
    project_slug: str
    description: str = None


class RejectProjectRequest(BaseModel):
    """Request to reject a project"""
    reason: str


class TicketResponseRequest(BaseModel):
    """Request to respond to a support ticket"""
    message: str
    resolve: bool = False


class WebhookTestRequest(BaseModel):
    """Request to test a webhook integration"""
    integration_type: str  # teams, slack, discord
    webhook_url: str


class InviteAdminRequest(BaseModel):
    """Request to invite a new admin user"""
    email: EmailStr
    full_name: str


class InviteAdminResponse(BaseModel):
    """Response from admin invitation"""
    success: bool
    message: str
    user_id: str = None


# ========== PROJECT MANAGEMENT ==========

@router.post("/projects")
async def create_project(
    req: CreateProjectRequest,
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin creates new project request
    Transitions from pending → approved → active
    """
    try:
        service = AdminService(db)

        # Cria solicitação
        project = await service.create_project_request(
            gp_id=current_user_id,
            project_name=req.project_name,
            project_slug=req.project_slug,
            description=req.description
        )

        return {
            "status": "pending",
            "project_id": str(project.id),
            "project_name": project.project_name,
            "project_slug": project.project_slug,
            "schema_name": project.schema_name,
            "message": "Project request created. Waiting for admin approval.",
            "next_step": "admin_approval"
        }

    except ValueError as e:
        logger.warning("admin.create_project_validation_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("admin.create_project_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating project"
        )


@router.get("/projects/pending")
async def get_pending_projects(
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin views all pending project requests
    """
    try:
        service = AdminService(db)
        projects = await service.get_pending_projects()

        return {
            "pending_projects": [
                {
                    "id": str(p.id),
                    "gp_id": str(p.gp_id),
                    "project_name": p.project_name,
                    "project_slug": p.project_slug,
                    "requested_at": p.requested_at.isoformat()
                }
                for p in projects
            ],
            "count": len(projects)
        }

    except Exception as e:
        logger.error("admin.get_pending_projects_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching pending projects"
        )


@router.post("/projects/{project_id}/approve")
async def approve_project(
    project_id: UUID,
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin approves project and provisions tenant
    """
    try:
        service = AdminService(db)

        project = await service.approve_project_request(
            request_id=project_id,
            admin_id=current_user_id
        )

        return {
            "status": "approved",
            "project_id": str(project.id),
            "project_slug": project.project_slug,
            "schema_name": project.schema_name,
            "approved_at": project.approved_at.isoformat(),
            "message": "Project approved and tenant provisioned",
            "next_step": "gp_onboarding",
            "gp_onboarding_url": f"/projects/{project.project_slug}/onboarding"
        }

    except ValueError as e:
        logger.warning("admin.approve_project_validation_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("admin.approve_project_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error approving project"
        )


@router.post("/projects/{project_id}/reject")
async def reject_project(
    project_id: UUID,
    req: RejectProjectRequest,
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin rejects project request with reason
    """
    try:
        service = AdminService(db)

        project = await service.reject_project_request(
            request_id=project_id,
            admin_id=current_user_id,
            reason=req.reason
        )

        return {
            "status": "rejected",
            "project_id": str(project.id),
            "project_slug": project.project_slug,
            "rejection_reason": project.rejection_reason,
            "rejected_at": project.approved_at.isoformat(),
            "message": "Project request rejected"
        }

    except ValueError as e:
        logger.warning("admin.reject_project_validation_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("admin.reject_project_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error rejecting project"
        )


# ========== USER MANAGEMENT ==========

@router.get("/users")
async def list_users(
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin lists all users in the system
    """
    try:
        service = AdminService(db)
        users = await service.list_users()

        return {
            "users": [
                {
                    "id": str(u.id),
                    "email": u.email,
                    "full_name": u.full_name,
                    "is_active": u.is_active,
                    "is_admin": u.is_admin,
                    "created_at": u.created_at.isoformat(),
                    "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None
                }
                for u in users
            ],
            "count": len(users)
        }

    except Exception as e:
        logger.error("admin.list_users_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error listing users"
        )


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: UUID,
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin resets user password and generates temporary password
    Automatically sends email to user with temporary password
    """
    try:
        service = AdminService(db)
        result = await service.reset_user_password(user_id)

        # Send email with temporary password
        email_success, email_error = EmailService.send_admin_password_reset_email(
            to_email=result["email"],
            user_name=result.get("full_name", result["email"].split("@")[0]),
            temp_password=result["temp_password"]
        )

        return {
            "status": "password_reset",
            "user_id": result["user_id"],
            "email": result["email"],
            "temp_password": result["temp_password"],
            "reset_at": result["reset_at"],
            "email_sent": email_success,
            "email_error": email_error,
            "message": "Password reset successful. Email sent to user.",
            "instructions": "User must change password on first login"
        }

    except ValueError as e:
        logger.warning("admin.reset_password_validation_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("admin.reset_password_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error resetting password"
        )


@router.post("/users/{user_id}/lock")
async def lock_user(
    user_id: UUID,
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin locks (deactivates) a user account
    Locked users cannot login
    """
    try:
        service = AdminService(db)
        result = await service.lock_user(user_id)

        return {
            "status": "user_locked",
            "user_id": result["user_id"],
            "email": result["email"],
            "is_active": result["is_active"],
            "locked_at": result["locked_at"],
            "message": "User account has been locked. They cannot login until unlocked."
        }

    except ValueError as e:
        logger.warning("admin.lock_user_validation_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("admin.lock_user_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error locking user"
        )


@router.post("/users/{user_id}/unlock")
async def unlock_user(
    user_id: UUID,
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin unlocks (reactivates) a user account
    Unlocked users can login again
    """
    try:
        service = AdminService(db)
        result = await service.unlock_user(user_id)

        return {
            "status": "user_unlocked",
            "user_id": result["user_id"],
            "email": result["email"],
            "is_active": result["is_active"],
            "unlocked_at": result["unlocked_at"],
            "message": "User account has been unlocked. They can now login."
        }

    except ValueError as e:
        logger.warning("admin.unlock_user_validation_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("admin.unlock_user_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error unlocking user"
        )


# ========== SUSPICIOUS ACCESS MONITORING ==========

@router.get("/suspicious-access")
async def get_suspicious_access(
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin views all blocked users due to suspicious access attempts
    Shows: user, project, attempt count, when blocked
    """
    try:
        service = AdminService(db)
        attempts = await service.get_suspicious_access_attempts()

        return {
            "suspicious_accesses": [
                {
                    "access_attempt_id": str(a.id),
                    "user_id": str(a.user_id),
                    "user_email": a.user.email,
                    "user_name": a.user.full_name,
                    "project_id": str(a.project_id),
                    "project_name": a.project.name,
                    "attempt_number": a.attempt_number,
                    "blocked": a.blocked,
                    "blocked_at": a.blocked_at.isoformat() if a.blocked_at else None,
                    "created_at": a.created_at.isoformat()
                }
                for a in attempts
            ],
            "count": len(attempts),
            "message": "List of users blocked due to suspicious access attempts"
        }

    except Exception as e:
        logger.error("admin.get_suspicious_access_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching suspicious access attempts"
        )


@router.post("/suspicious-access/{access_attempt_id}/unblock")
async def unblock_suspicious_access(
    access_attempt_id: UUID,
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin unblocks a user who was locked due to suspicious access attempts
    User can login again after unblocking
    """
    try:
        service = AdminService(db)
        result = await service.unlock_suspicious_access(access_attempt_id)

        return {
            "status": "suspicious_access_unblocked",
            "access_attempt_id": result["access_attempt_id"],
            "user_id": result["user_id"],
            "project_id": result["project_id"],
            "blocked": result["blocked"],
            "unblocked_at": result["unblocked_at"],
            "message": "User has been unblocked and can now login again."
        }

    except ValueError as e:
        logger.warning("admin.unblock_suspicious_access_validation_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("admin.unblock_suspicious_access_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error unblocking suspicious access"
        )


# ========== SAC - SUPPORT TICKETS ==========

@router.get("/tickets")
async def list_tickets(
    status: str = Query(None, description="Filter by status: ABERTO, EM_ANÁLISE, AGUARDANDO_FEEDBACK, RESOLVIDO"),
    severity: str = Query(None, description="Filter by severity: BAIXO, MÉDIO, ALTO, CRÍTICO"),
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin lists all support tickets
    Can filter by status and severity
    """
    try:
        service = AdminService(db)
        tickets = await service.get_all_tickets(status=status, severity=severity)

        return {
            "tickets": [
                {
                    "id": str(t.id),
                    "user_id": str(t.user_id),
                    "user_email": t.user.email,
                    "user_name": t.user.full_name,
                    "project_id": str(t.project_id),
                    "project_name": t.project.name,
                    "title": t.title,
                    "description": t.description[:200] + "..." if len(t.description) > 200 else t.description,
                    "severity": t.severity,
                    "status": t.status,
                    "created_at": t.created_at.isoformat(),
                    "first_response_at": t.first_response_at.isoformat() if t.first_response_at else None,
                    "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
                    "response_count": len(t.responses)
                }
                for t in tickets
            ],
            "count": len(tickets),
            "filters": {
                "status": status,
                "severity": severity
            }
        }

    except Exception as e:
        logger.error("admin.list_tickets_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error listing tickets"
        )


@router.get("/tickets/{ticket_id}")
async def get_ticket_details(
    ticket_id: UUID,
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin gets full details of a support ticket
    Includes all responses/replies
    """
    try:
        service = AdminService(db)
        ticket = await service.get_ticket_details(ticket_id)

        return {
            "ticket": {
                "id": str(ticket.id),
                "user_id": str(ticket.user_id),
                "user_email": ticket.user.email,
                "user_name": ticket.user.full_name,
                "project_id": str(ticket.project_id),
                "project_name": ticket.project.name,
                "title": ticket.title,
                "description": ticket.description,
                "error_message": ticket.error_message,
                "erratic_behavior": ticket.erratic_behavior,
                "severity": ticket.severity,
                "status": ticket.status,
                "created_at": ticket.created_at.isoformat(),
                "first_response_at": ticket.first_response_at.isoformat() if ticket.first_response_at else None,
                "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
                "responses": [
                    {
                        "response_id": str(r.id),
                        "responder_id": str(r.responder_id) if r.responder_id else None,
                        "responder_email": r.responder.email if r.responder else None,
                        "message": r.message,
                        "is_resolution": r.is_resolution,
                        "created_at": r.created_at.isoformat()
                    }
                    for r in ticket.responses
                ]
            }
        }

    except ValueError as e:
        logger.warning("admin.get_ticket_details_validation_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error("admin.get_ticket_details_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching ticket details"
        )


@router.post("/tickets/{ticket_id}/respond")
async def respond_to_ticket(
    ticket_id: UUID,
    req: TicketResponseRequest,
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin/GP responds to a support ticket
    Can optionally mark as resolved (resolve=True)
    """
    try:
        service = AdminService(db)
        result = await service.respond_to_ticket(
            ticket_id=ticket_id,
            responder_id=current_user_id,
            message=req.message,
            resolve=req.resolve
        )

        return {
            "status": "response_added",
            "response_id": result["response_id"],
            "ticket_id": result["ticket_id"],
            "ticket_status": result["ticket_status"],
            "message": result["message"],
            "is_resolution": result["is_resolution"],
            "responded_at": result["responded_at"],
            "notification": "User will be notified of this response via email" if not req.resolve else "Ticket marked as resolved"
        }

    except ValueError as e:
        logger.warning("admin.respond_to_ticket_validation_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error("admin.respond_to_ticket_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error responding to ticket"
        )


# ========== DASHBOARD EXECUTIVO ==========

@router.get("/dashboard/metrics")
async def get_dashboard_metrics(
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Executive dashboard with system metrics
    Shows: project count, ticket metrics, security alerts, system health
    """
    try:
        service = AdminService(db)
        metrics = await service.get_dashboard_metrics()

        return {
            "status": "success",
            "data": metrics,
            "message": "Executive dashboard metrics retrieved successfully"
        }

    except Exception as e:
        logger.error("admin.dashboard_metrics_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching dashboard metrics"
        )


# ========== INTEGRATIONS & ALERTS ==========

@router.post("/integrations/webhook-test")
async def test_webhook(
    req: WebhookTestRequest,
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Test a webhook integration (Teams, Slack, Discord)
    Sends a test message to verify the webhook is working
    """
    try:
        service = AdminService(db)
        result = await service.test_webhook(req.integration_type, req.webhook_url)

        return {
            "status": "webhook_test_completed",
            "integration_type": req.integration_type,
            "success": result["success"],
            "status_code": result.get("status_code"),
            "message": result.get("message", result.get("error")),
            "tested_at": result["tested_at"]
        }

    except Exception as e:
        logger.error("admin.webhook_test_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error testing webhook"
        )


@router.get("/alerts/history")
async def get_alerts_history(
    alert_type: str = Query(None, description="Filter by alert type"),
    severity: str = Query(None, description="Filter by severity: info, warning, critical"),
    status: str = Query(None, description="Filter by status: pending, sent, failed, acknowledged"),
    limit: int = Query(50, description="Number of alerts to retrieve (max 100)"),
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin views system alerts history
    Can filter by type, severity, and status
    """
    try:
        # Limit max to 100
        if limit > 100:
            limit = 100

        service = AdminService(db)
        alerts = await service.get_alerts_history(
            alert_type=alert_type,
            severity=severity,
            status=status,
            limit=limit
        )

        return {
            "alerts": [
                {
                    "id": str(a.id),
                    "alert_type": a.alert_type,
                    "severity": a.severity,
                    "title": a.title,
                    "message": a.message,
                    "status": a.status,
                    "sent_to_teams": a.sent_to_teams,
                    "sent_to_slack": a.sent_to_slack,
                    "sent_via_email": a.sent_via_email,
                    "created_at": a.created_at.isoformat(),
                    "sent_at": a.sent_at.isoformat() if a.sent_at else None,
                    "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None
                }
                for a in alerts
            ],
            "count": len(alerts),
            "filters": {
                "alert_type": alert_type,
                "severity": severity,
                "status": status
            }
        }

    except Exception as e:
        logger.error("admin.alerts_history_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching alerts history"
        )


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: UUID,
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin acknowledges an alert as resolved/reviewed
    """
    try:
        service = AdminService(db)
        result = await service.acknowledge_alert(alert_id, current_user_id)

        return {
            "status": "alert_acknowledged",
            "alert_id": result["alert_id"],
            "alert_status": result["status"],
            "acknowledged_at": result["acknowledged_at"],
            "message": "Alert marked as acknowledged"
        }

    except ValueError as e:
        logger.warning("admin.acknowledge_alert_validation_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error("admin.acknowledge_alert_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error acknowledging alert"
        )


# ========== ADMIN USER MANAGEMENT ==========

def generate_temporary_password() -> str:
    """
    Generate a temporary password that meets requirements:
    - 10 characters minimum
    - At least 1 uppercase letter
    - At least 1 digit
    - At least 1 special character
    """
    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    digits = string.digits
    special = "!@#$%^&*"

    password = (
        secrets.choice(uppercase) +
        secrets.choice(digits) +
        secrets.choice(special) +
        ''.join(secrets.choice(uppercase + lowercase + digits + special) for _ in range(7))
    )

    # Shuffle to randomize position
    password_list = list(password)
    secrets.SystemRandom().shuffle(password_list)

    return ''.join(password_list)


@router.post("/invite-admin", response_model=InviteAdminResponse)
async def invite_admin_user(
    request: InviteAdminRequest,
    current_user_id: UUID = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
) -> InviteAdminResponse:
    """
    Invite a new admin user via email with temporary password.

    Only admin users can invite other admins.

    Args:
        request: InviteAdminRequest with email and full_name
        current_user_id: Current authenticated user ID (must be admin)
        db: Database session

    Returns:
        InviteAdminResponse with success status and user_id
    """
    try:
        # Fetch current user to verify admin status
        stmt = select(User).where(User.id == current_user_id)
        result = await db.execute(stmt)
        current_user = result.scalar_one_or_none()

        if not current_user or not current_user.is_admin:
            logger.warning(
                "admin.invite_admin_unauthorized",
                user_id=str(current_user_id)
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can invite new admin users"
            )

        # Check if user already exists
        stmt = select(User).where(User.email == request.email)
        result = await db.execute(stmt)
        existing_user = result.scalar_one_or_none()

        if existing_user:
            logger.warning(
                "admin.invite_admin_user_exists",
                email=request.email
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )

        # Generate temporary password
        temp_password = generate_temporary_password()

        # Create new admin user
        new_user = User(
            id=uuid4(),
            email=request.email,
            full_name=request.full_name,
            password_hash=hash_password(temp_password),
            is_admin=True,
            is_active=True,
            first_access_completed=False,  # Force password change on first login
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # Send invitation email
        activation_link = f"https://gca.code-auditor.com.br/login"
        invited_by_name = current_user.full_name or current_user.email or "Administrator"

        success, error = EmailService.send_admin_invitation_email(
            to_email=request.email,
            invited_by_name=invited_by_name,
            temporary_password=temp_password,
            activation_link=activation_link
        )

        if not success:
            logger.warning(
                "admin.invite_admin_email_failed",
                email=request.email,
                error=error
            )
            # User created but email failed - inform admin
            return InviteAdminResponse(
                success=True,
                message=f"User created but email failed: {error}",
                user_id=str(new_user.id)
            )

        logger.info(
            "admin.invite_admin_success",
            email=request.email,
            invited_by=invited_by_name,
            user_id=str(new_user.id)
        )

        return InviteAdminResponse(
            success=True,
            message=f"Admin invitation sent to {request.email}. Temporary password expires in 24 hours.",
            user_id=str(new_user.id)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "admin.invite_admin_error",
            error=str(e),
            email=request.email
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error inviting admin user"
        )
