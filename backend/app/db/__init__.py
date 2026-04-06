"""Database module"""
from app.db.database import engine, AsyncSessionLocal, Base, get_db, init_db

# Import all models to register them with Base
from app.models.base import User, Organization, OrganizationMember, Project, ProjectMember, GlobalAuditLog
from app.models.pillar import PillarTemplate, CompanyPolicy
from app.models.tenant import (
    PillarConfiguration, OGCVersion, ArtifactEvaluation, Artifact, AuditLog
)
from app.models.onboarding import (
    ProjectRequest, OnboardingProgress, TeamInvite,
    StackCache, PiloterQuery, PiloterQuotaHistory
)

__all__ = [
    "engine", "AsyncSessionLocal", "Base", "get_db", "init_db",
    # Global models
    "User", "Organization", "OrganizationMember", "Project", "ProjectMember", "GlobalAuditLog",
    # Pillar models
    "PillarTemplate", "CompanyPolicy",
    # Tenant models
    "PillarConfiguration", "OGCVersion", "ArtifactEvaluation", "Artifact", "AuditLog",
    # Onboarding models
    "ProjectRequest", "OnboardingProgress", "TeamInvite",
    "StackCache", "PiloterQuery", "PiloterQuotaHistory"
]
