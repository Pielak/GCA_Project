"""
GCA Global ORM Models
Global schema tables: users, organizations, projects, etc
"""
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index, CheckConstraint, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class User(Base):
    """User model - global"""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True, index=True)
    is_admin = Column(Boolean, default=False)
    first_access_completed = Column(Boolean, default=False, index=True)  # Tracks if first password change done
    password_changed_at = Column(DateTime(timezone=True), nullable=True)  # Last password change timestamp
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    organizations_owned = relationship("Organization", back_populates="owner", foreign_keys="Organization.owner_id")
    organization_memberships = relationship("OrganizationMember", back_populates="user")
    project_memberships = relationship("ProjectMember", back_populates="user", foreign_keys="ProjectMember.user_id")
    projects_invited_by = relationship("ProjectMember", foreign_keys="ProjectMember.invited_by", viewonly=True)

    __table_args__ = (
        CheckConstraint(
            "email ~ '^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Z|a-z]{2,}$'",
            name="email_format"
        ),
    )

    def __repr__(self):
        return f"<User {self.email}>"


class Organization(Base):
    """Organization model - global"""
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    owner = relationship("User", back_populates="organizations_owned", foreign_keys=[owner_id])
    members = relationship("OrganizationMember", back_populates="organization")
    projects = relationship("Project", back_populates="organization")

    __table_args__ = (
        Index("idx_organizations_owner_id", owner_id),
    )

    def __repr__(self):
        return f"<Organization {self.slug}>"


class OrganizationMember(Base):
    """Organization membership"""
    __tablename__ = "organization_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False)  # admin, member, viewer
    joined_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization", back_populates="members")
    user = relationship("User", back_populates="organization_memberships")

    __table_args__ = (
        Index("idx_org_members_org_id", organization_id),
        Index("idx_org_members_user_id", user_id),
    )

    def __repr__(self):
        return f"<OrganizationMember {self.user_id} -> {self.organization_id}>"


class Project(Base):
    """Project model - global metadata"""
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False)  # Used to create proj_{slug}_* schemas
    description = Column(String, nullable=True)

    # Project status
    status = Column(String(50), default="initializing", index=True)  # initializing, wizard_step_1-4, active, archived
    wizard_completed_at = Column(DateTime(timezone=True), nullable=True)

    # Provisioning
    provisioning_status = Column(String(50), default="pending")  # pending, in_progress, completed, failed
    provisioning_error = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization", back_populates="projects")
    members = relationship("ProjectMember", back_populates="project")

    __table_args__ = (
        Index("idx_projects_org_id", organization_id),
        Index("idx_projects_slug", slug),
        Index("idx_projects_status", status),
        CheckConstraint("slug ~ '^[a-z0-9_-]+$'", name="slug_format"),
    )

    def __repr__(self):
        return f"<Project {self.slug}>"


class ProjectMember(Base):
    """Project membership with roles"""
    __tablename__ = "project_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False)  # gp, tech_lead, dev, qa, compliance, viewer
    invited_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    invite_token = Column(String(255), unique=True, nullable=True)
    invite_expires_at = Column(DateTime(timezone=True), nullable=True)
    invited_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    joined_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="project_memberships", foreign_keys=[user_id])
    invited_by_user = relationship("User", foreign_keys=[invited_by], viewonly=True)

    __table_args__ = (
        Index("idx_project_members_project_id", project_id),
        Index("idx_project_members_user_id", user_id),
    )

    def __repr__(self):
        return f"<ProjectMember {self.user_id} -> {self.project_id}>"


class AccessAttempt(Base):
    """Track unauthorized access attempts to projects"""
    __tablename__ = "access_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_number = Column(Integer, default=1)  # 1st, 2nd, 3rd, 4th, 5th
    blocked = Column(Boolean, default=False, index=True)  # True if account locked after 5 attempts
    blocked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    unblocked_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    project = relationship("Project", foreign_keys=[project_id])

    __table_args__ = (
        Index("idx_access_attempts_user_project", user_id, project_id),
        Index("idx_access_attempts_blocked", blocked),
        Index("idx_access_attempts_created_at", created_at),
    )

    def __repr__(self):
        return f"<AccessAttempt user={self.user_id} project={self.project_id} attempt={self.attempt_number}>"


class SupportTicket(Base):
    """Support/Help tickets (SAC) opened by users"""
    __tablename__ = "support_tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)

    # Ticket content
    title = Column(String(255), nullable=False)
    description = Column(String, nullable=False)  # 20-5000 characters
    error_message = Column(String, nullable=True)  # Error stack if applicable
    erratic_behavior = Column(String, nullable=True)  # Describe weird behavior

    # Severity levels: BAIXO, MÉDIO, ALTO, CRÍTICO
    severity = Column(String(20), nullable=False, index=True)  # Default: MÉDIO

    # Status: ABERTO, EM_ANÁLISE, AGUARDANDO_FEEDBACK, RESOLVIDO
    status = Column(String(20), default="ABERTO", nullable=False, index=True)

    # SLA tracking
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    first_response_at = Column(DateTime(timezone=True), nullable=True)  # When admin first responded
    resolved_at = Column(DateTime(timezone=True), nullable=True)  # When marked as resolved
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    project = relationship("Project", foreign_keys=[project_id])
    responses = relationship("TicketResponse", back_populates="ticket", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_tickets_user_id", user_id),
        Index("idx_tickets_project_id", project_id),
        Index("idx_tickets_status", status),
        Index("idx_tickets_severity", severity),
        Index("idx_tickets_created_at", created_at),
    )

    def __repr__(self):
        return f"<SupportTicket {self.id} severity={self.severity} status={self.status}>"


class TicketResponse(Base):
    """Responses/replies to support tickets from admin or GP"""
    __tablename__ = "ticket_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    responder_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Response content
    message = Column(String, nullable=False)  # Admin's response/diagnosis

    # Track if this resolved the issue
    is_resolution = Column(Boolean, default=False)  # True if this message resolved the ticket

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    ticket = relationship("SupportTicket", back_populates="responses", foreign_keys=[ticket_id])
    responder = relationship("User", foreign_keys=[responder_id])

    __table_args__ = (
        Index("idx_responses_ticket_id", ticket_id),
        Index("idx_responses_responder_id", responder_id),
        Index("idx_responses_created_at", created_at),
    )

    def __repr__(self):
        return f"<TicketResponse ticket={self.ticket_id} responder={self.responder_id}>"


class IntegrationWebhook(Base):
    """Webhook configurations for Teams, Slack, Discord integrations"""
    __tablename__ = "integration_webhooks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    # Integration type: teams, slack, discord
    integration_type = Column(String(50), nullable=False, index=True)

    # Webhook URL (encrypted in real DB)
    webhook_url = Column(String(500), nullable=False)

    # Status
    is_active = Column(Boolean, default=True, index=True)
    last_tested_at = Column(DateTime(timezone=True), nullable=True)
    last_test_status = Column(String(20), nullable=True)  # success, failed
    last_error = Column(String, nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_webhooks_type", integration_type),
        Index("idx_webhooks_active", is_active),
    )

    def __repr__(self):
        return f"<IntegrationWebhook {self.integration_type}>"


class SystemAlert(Base):
    """System alerts and notifications sent to admins"""
    __tablename__ = "system_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    # Alert type: token_expiring, low_credits, service_down, degradation, suspicious_access
    alert_type = Column(String(50), nullable=False, index=True)

    # Severity: info, warning, critical
    severity = Column(String(20), nullable=False, index=True)

    # Alert content
    title = Column(String(255), nullable=False)
    message = Column(String, nullable=False)
    details = Column(String, nullable=True)  # JSON details

    # Delivery tracking
    sent_to_teams = Column(Boolean, default=False)
    sent_to_slack = Column(Boolean, default=False)
    sent_via_email = Column(Boolean, default=False)

    # Status: pending, sent, failed, acknowledged
    status = Column(String(20), default="pending", nullable=False, index=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    acknowledged_by_user = relationship("User", foreign_keys=[acknowledged_by])

    __table_args__ = (
        Index("idx_alerts_type", alert_type),
        Index("idx_alerts_severity", severity),
        Index("idx_alerts_status", status),
        Index("idx_alerts_created_at", created_at),
    )

    def __repr__(self):
        return f"<SystemAlert {self.alert_type} severity={self.severity}>"


class ResetToken(Base):
    """Password reset tokens with TTL and single-use enforcement"""
    __tablename__ = "reset_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    used = Column(Boolean, default=False, index=True)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        Index("idx_reset_tokens_user_id", user_id),
        Index("idx_reset_tokens_expires", expires_at),
    )

    def __repr__(self):
        return f"<ResetToken user={self.user_id} used={self.used}>"


class GlobalAuditLog(Base):
    """Global audit log with chain integrity"""
    __tablename__ = "audit_log_global"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    event_type = Column(String(100), nullable=False, index=True)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_email = Column(String(255), nullable=True)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    details = Column(String, nullable=True)  # JSON field in real DB
    previous_hash = Column(String(64), nullable=True)  # For chain integrity
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    __table_args__ = (
        Index("idx_audit_log_event_type", event_type),
        Index("idx_audit_log_created_at", created_at),
    )

    def __repr__(self):
        return f"<GlobalAuditLog {self.event_type} {self.resource_type}>"


class Questionnaire(Base):
    """Questionnaire model - technical stack analysis submissions"""
    __tablename__ = "questionnaires"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    gp_email = Column(String(255), nullable=False, index=True)

    # Submitted responses
    responses = Column(String, nullable=False)  # JSON field in PostgreSQL

    # Analysis results
    adherence_score = Column(Integer, nullable=True, index=True)
    status = Column(String(50), default="pending", nullable=False, index=True)  # pending, incomplete, ok
    approved = Column(Boolean, default=False, nullable=False, index=True)

    # Validation results (JSON)
    validations = Column(String, nullable=True)  # JSON: logicConflicts, gaps, incompatibilities
    observations = Column(String, nullable=True)
    restrictions = Column(String, nullable=True)
    highlighted_fields = Column(String, nullable=True)  # JSON array

    # Metadata
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    analyzed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    project = relationship("Project", foreign_keys=[project_id])

    __table_args__ = (
        Index("idx_questionnaires_project_id", project_id),
        Index("idx_questionnaires_gp_email", gp_email),
        Index("idx_questionnaires_status", status),
        Index("idx_questionnaires_approved", approved),
        Index("idx_questionnaires_submitted_at", submitted_at),
    )

    def __repr__(self):
        return f"<Questionnaire project={self.project_id} status={self.status} score={self.adherence_score}>"
