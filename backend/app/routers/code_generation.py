"""
Code Generation Router
REST endpoints for code generation workflows
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID

from app.db.database import get_db
from app.services.code_generation_service import CodeGenerationService
from app.services.llm_service import LLMProvider

router = APIRouter(prefix="/api/v1/code-generation", tags=["code-generation"])


# ============================================================================
# Pydantic Models
# ============================================================================

class GenerateProjectCodeRequest(BaseModel):
    """Request to generate complete project code"""
    project_id: UUID = Field(..., description="Project to generate code for")
    gp_id: UUID = Field(..., description="Gestão de Projeto user ID")
    language: str = Field(default="python", description="Programming language")
    architecture: str = Field(default="microservices", description="Architecture pattern")
    llm_provider: str = Field(default="anthropic", description="LLM provider to use")
    api_key: Optional[str] = Field(None, description="API key for LLM provider")


class GenerateModuleCodeRequest(BaseModel):
    """Request to generate specific module code"""
    project_id: UUID
    module_name: str = Field(..., description="Name of module to generate")
    module_type: str = Field(..., description="Type: backend, frontend, database, api, etc")
    language: str = Field(default="python")
    requirements: Dict[str, Any] = Field(default_factory=dict)
    llm_provider: str = Field(default="anthropic")
    api_key: Optional[str] = None


class CodeGenerationResponse(BaseModel):
    """Response from code generation"""
    success: bool
    project_id: str
    provider: str
    code_artifact_id: Optional[str] = None
    generated_code: str
    full_code_length: int
    stack_recommendations: Optional[Dict[str, Any]] = None


class ModuleCodeResponse(BaseModel):
    """Response from module generation"""
    success: bool
    module_name: str
    module_type: str
    provider: str
    generated_code: str


class ProviderValidationResponse(BaseModel):
    """Response from provider validation"""
    provider: str
    valid: bool
    message: str


class GenerationHistoryItem(BaseModel):
    """Item in generation history"""
    artifact_id: str
    name: str
    generated_at: str
    size_bytes: int


# ============================================================================
# Endpoints
# ============================================================================

@router.post(
    "/project",
    response_model=CodeGenerationResponse,
    summary="Generate complete project code",
    description="Generate full project codebase using evaluated artifacts and stack recommendations"
)
async def generate_project_code(
    request: GenerateProjectCodeRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate complete project code

    - **project_id**: Project to generate code for
    - **gp_id**: Gestão de Projeto user ID
    - **language**: Programming language (default: python)
    - **architecture**: Architecture pattern (default: microservices)
    - **llm_provider**: LLM provider (anthropic, openai, grok, deepseek)
    - **api_key**: Optional API key (uses env variable if not provided)
    """

    try:
        provider = LLMProvider(request.llm_provider.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid LLM provider: {request.llm_provider}"
        )

    try:
        service = CodeGenerationService(db, llm_provider=provider)
        result = await service.generate_project_code(
            project_id=request.project_id,
            gp_id=request.gp_id,
            language=request.language,
            architecture=request.architecture,
            api_key=request.api_key
        )

        return CodeGenerationResponse(**result)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code generation failed: {str(e)}"
        )


@router.post(
    "/module",
    response_model=ModuleCodeResponse,
    summary="Generate specific module code",
    description="Generate code for a specific module or component"
)
async def generate_module_code(
    request: GenerateModuleCodeRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate code for a specific module

    - **project_id**: Project context
    - **module_name**: Name of module to generate
    - **module_type**: Type of module (backend, frontend, database, api)
    - **language**: Programming language
    - **requirements**: Module-specific requirements
    - **llm_provider**: LLM provider to use
    """

    try:
        provider = LLMProvider(request.llm_provider.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid LLM provider: {request.llm_provider}"
        )

    try:
        service = CodeGenerationService(db, llm_provider=provider)
        result = await service.generate_module_code(
            project_id=request.project_id,
            module_name=request.module_name,
            module_type=request.module_type,
            requirements=request.requirements,
            api_key=request.api_key
        )

        return ModuleCodeResponse(**result)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Module generation failed: {str(e)}"
        )


@router.post(
    "/validate-provider",
    response_model=ProviderValidationResponse,
    summary="Validate LLM provider credentials",
    description="Test connection and validate API credentials for specified LLM provider"
)
async def validate_provider(
    provider: str,
    api_key: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Validate LLM provider credentials

    - **provider**: LLM provider name (anthropic, openai, grok, deepseek)
    - **api_key**: API key to validate (uses env variable if not provided)
    """

    try:
        provider_enum = LLMProvider(provider.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid LLM provider: {provider}"
        )

    try:
        service = CodeGenerationService(db, llm_provider=provider_enum)
        valid = await service.validate_llm_provider(api_key=api_key)

        return ProviderValidationResponse(
            provider=provider,
            valid=valid,
            message="Provider credentials validated successfully" if valid else "Provider validation failed"
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Provider validation failed: {str(e)}"
        )


@router.get(
    "/history/{project_id}",
    response_model=list[GenerationHistoryItem],
    summary="Get code generation history",
    description="Get list of previous code generations for a project"
)
async def get_generation_history(
    project_id: UUID,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """
    Get code generation history for a project

    - **project_id**: Project ID to get history for
    - **limit**: Maximum number of results (default: 10)
    """

    try:
        service = CodeGenerationService(db)
        history = await service.get_generation_history(
            project_id=project_id,
            limit=limit
        )

        return [GenerationHistoryItem(**item) for item in history]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve history: {str(e)}"
        )


@router.get(
    "/providers",
    summary="List available LLM providers",
    description="Get list of available LLM providers"
)
async def list_providers():
    """Get list of available LLM providers"""

    return {
        "providers": [
            {
                "name": "anthropic",
                "model": "claude-opus-4-1",
                "description": "Anthropic Claude - Recommended for code generation"
            },
            {
                "name": "openai",
                "model": "gpt-4-turbo-preview",
                "description": "OpenAI GPT-4 - Advanced reasoning"
            },
            {
                "name": "grok",
                "model": "grok-1",
                "description": "xAI Grok - Real-time knowledge"
            },
            {
                "name": "deepseek",
                "model": "deepseek-coder",
                "description": "DeepSeek - Specialized for coding"
            }
        ]
    }
