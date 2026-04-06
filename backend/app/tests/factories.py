"""
Test data factories for GCA Admin Dashboard tests
"""
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.base import (
    User, AccessAttempt, SupportTicket, TicketResponse,
    IntegrationWebhook, SystemAlert
)
from app.models.onboarding import ProjectRequest, ProjectRequestStatus


# ============================================================================
# User Factory
# ============================================================================

async def create_test_user(
    db_session: AsyncSession,
    email: str = None,
    full_name: str = None,
    is_admin: bool = False,
    is_active: bool = True,
    password: str = "testpassword123"
) -> User:
    """Create a test user in the database."""
    if email is None:
        email = f"user-{uuid4().hex[:8]}@example.com"
    if full_name is None:
        full_name = f"Test User {uuid4().hex[:4]}"

    user = User(
        id=uuid4(),
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        is_active=is_active,
        is_admin=is_admin,
        created_at=datetime.utcnow(),
    )
    db_session.add(user)
    await db_session.flush()
    return user


# ============================================================================
# ProjectRequest Factory
# ============================================================================

async def create_test_project(
    db_session: AsyncSession,
    gp_id: str = None,
    project_name: str = None,
    project_slug: str = None,
    status: ProjectRequestStatus = ProjectRequestStatus.ACTIVE
) -> ProjectRequest:
    """Create a test project request in the database."""
    if gp_id is None:
        gp_user = await create_test_user(db_session)
        gp_id = gp_user.id

    if project_name is None:
        project_name = f"Project {uuid4().hex[:4]}"
    if project_slug is None:
        project_slug = f"project-{uuid4().hex[:4]}"

    if isinstance(status, str):
        status_map = {v.value: v for v in ProjectRequestStatus}
        status = status_map.get(status, ProjectRequestStatus.ACTIVE)

    project_request = ProjectRequest(
        id=uuid4(),
        gp_id=gp_id,
        project_name=project_name,
        project_slug=project_slug,
        description="Test project",
        status=status,
        requested_at=datetime.utcnow(),
        created_at=datetime.utcnow(),
    )
    db_session.add(project_request)
    await db_session.flush()
    return project_request


# ============================================================================
# Access Attempt Factory
# ============================================================================

async def create_access_attempt(
    db_session: AsyncSession,
    user_id: str = None,
    project_id: str = None,
    attempt_number: int = 1,
    blocked: bool = False,
    blocked_at: datetime = None,
    created_at: datetime = None
) -> AccessAttempt:
    """Create an access attempt record."""
    if user_id is None:
        user = await create_test_user(db_session)
        user_id = user.id

    if project_id is None:
        project = await create_test_project(db_session)
        project_id = project.id

    attempt = AccessAttempt(
        id=uuid4(),
        user_id=user_id,
        project_id=project_id,
        attempt_number=attempt_number,
        blocked=blocked,
        blocked_at=blocked_at or (datetime.utcnow() if blocked else None),
        created_at=created_at or datetime.utcnow(),
    )
    db_session.add(attempt)
    await db_session.flush()
    return attempt


# ============================================================================
# Support Ticket Factory
# ============================================================================

async def create_support_ticket(
    db_session: AsyncSession,
    user_id: str = None,
    project_id: str = None,
    title: str = None,
    description: str = None,
    error_message: str = None,
    severity: str = "MÉDIO",
    status: str = "ABERTO",
    created_at: datetime = None,
) -> SupportTicket:
    """Create a support ticket."""
    if user_id is None:
        user = await create_test_user(db_session)
        user_id = user.id

    if project_id is None:
        project = await create_test_project(db_session)
        project_id = project.id

    if title is None:
        title = f"Test Ticket {uuid4().hex[:4]}"
    if description is None:
        description = "This is a test ticket description"

    ticket = SupportTicket(
        id=uuid4(),
        user_id=user_id,
        project_id=project_id,
        title=title,
        description=description,
        error_message=error_message,
        erratic_behavior=None,
        severity=severity,
        status=status,
        created_at=created_at or datetime.utcnow(),
    )
    db_session.add(ticket)
    await db_session.flush()
    return ticket


# ============================================================================
# Ticket Response Factory
# ============================================================================

async def create_ticket_response(
    db_session: AsyncSession,
    ticket_id: str = None,
    responder_id: str = None,
    message: str = None,
    is_resolution: bool = False,
    created_at: datetime = None,
) -> TicketResponse:
    """Create a ticket response."""
    if ticket_id is None:
        ticket = await create_support_ticket(db_session)
        ticket_id = ticket.id

    if responder_id is None:
        responder = await create_test_user(db_session, is_admin=True)
        responder_id = responder.id

    if message is None:
        message = "Test response message"

    response = TicketResponse(
        id=uuid4(),
        ticket_id=ticket_id,
        responder_id=responder_id,
        message=message,
        is_resolution=is_resolution,
        created_at=created_at or datetime.utcnow(),
    )
    db_session.add(response)
    await db_session.flush()
    return response


# ============================================================================
# Integration Webhook Factory
# ============================================================================

async def create_webhook(
    db_session: AsyncSession,
    integration_type: str = "teams",
    webhook_url: str = None,
    is_active: bool = True,
) -> IntegrationWebhook:
    """Create an integration webhook."""
    if webhook_url is None:
        webhook_url = f"https://hooks.example.com/{uuid4().hex[:8]}"

    webhook = IntegrationWebhook(
        id=uuid4(),
        integration_type=integration_type,
        webhook_url=webhook_url,
        is_active=is_active,
        last_tested_at=None,
        last_test_status=None,
        last_error=None,
        created_at=datetime.utcnow(),
    )
    db_session.add(webhook)
    await db_session.flush()
    return webhook


# ============================================================================
# System Alert Factory
# ============================================================================

async def create_alert(
    db_session: AsyncSession,
    alert_type: str = "info",
    severity: str = "warning",
    title: str = None,
    message: str = None,
    status: str = "pending",
    acknowledged_at: datetime = None,
    created_at: datetime = None,
) -> SystemAlert:
    """Create a system alert."""
    if title is None:
        title = f"Test Alert {uuid4().hex[:4]}"
    if message is None:
        message = "This is a test alert message"

    alert = SystemAlert(
        id=uuid4(),
        alert_type=alert_type,
        severity=severity,
        title=title,
        message=message,
        details=None,
        sent_to_teams=False,
        sent_to_slack=False,
        sent_via_email=False,
        status=status,
        acknowledged_at=acknowledged_at,
        acknowledged_by=None,
        created_at=created_at or datetime.utcnow(),
    )
    db_session.add(alert)
    await db_session.flush()
    return alert


# ============================================================================
# Bulk Creation Helpers
# ============================================================================

async def create_multiple_users(
    db_session: AsyncSession,
    count: int = 10,
    is_admin: bool = False,
) -> list[User]:
    """Create multiple test users."""
    users = []
    for i in range(count):
        user = await create_test_user(
            db_session,
            email=f"user{i}@example.com",
            full_name=f"Test User {i}",
            is_admin=is_admin,
        )
        users.append(user)
    return users


async def create_multiple_tickets(
    db_session: AsyncSession,
    user_id: str,
    project_id: str = None,
    count: int = 5,
    severity: str = "MÉDIO",
    status: str = "ABERTO",
) -> list[SupportTicket]:
    """Create multiple support tickets."""
    if project_id is None:
        project = await create_test_project(db_session)
        project_id = project.id

    tickets = []
    for i in range(count):
        ticket = await create_support_ticket(
            db_session,
            user_id=user_id,
            project_id=project_id,
            title=f"Ticket {i}",
            severity=severity,
            status=status,
        )
        tickets.append(ticket)
    return tickets


async def create_multiple_alerts(
    db_session: AsyncSession,
    count: int = 10,
    severity: str = "warning",
    status: str = "pending",
) -> list[SystemAlert]:
    """Create multiple system alerts."""
    alerts = []
    for i in range(count):
        alert = await create_alert(
            db_session,
            title=f"Alert {i}",
            severity=severity,
            status=status,
        )
        alerts.append(alert)
    return alerts
