"""
GCA - Gerenciador Central de Arquiteturas
API Principal
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog
from app.core.config import settings
from app.db.database import init_db
from app.routers import auth, users, organizations, projects, ocg, onboarding, admin, evaluation, code_generation, dashboard, validation, github, questionnaires, webhooks

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle management for the application
    """
    # Startup
    logger.info("gca.startup", version=settings.APP_VERSION)

    # Initialize database
    try:
        await init_db()
        logger.info("gca.database_ready")
    except Exception as e:
        logger.error("gca.database_initialization_failed", error=str(e))
        raise

    yield

    # Shutdown
    logger.info("gca.shutdown")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Routes
app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_PREFIX}/users", tags=["users"])
app.include_router(organizations.router, prefix=f"{settings.API_PREFIX}/organizations", tags=["organizations"])
app.include_router(projects.router, prefix=f"{settings.API_PREFIX}/projects", tags=["projects"])
app.include_router(ocg.router, prefix=f"{settings.API_PREFIX}/ocg", tags=["ocg"])
app.include_router(admin.router, prefix=f"{settings.API_PREFIX}/admin", tags=["admin"])
app.include_router(onboarding.router, prefix=f"{settings.API_PREFIX}/onboarding", tags=["onboarding"])
app.include_router(evaluation.router, prefix=f"{settings.API_PREFIX}", tags=["evaluation"])
app.include_router(code_generation.router)
app.include_router(dashboard.router)
app.include_router(validation.router)
app.include_router(github.router)
app.include_router(questionnaires.router, prefix=f"{settings.API_PREFIX}/questionnaires", tags=["questionnaires"])
app.include_router(webhooks.router, prefix=f"{settings.API_PREFIX}", tags=["webhooks"])


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": f"{settings.API_PREFIX}/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
