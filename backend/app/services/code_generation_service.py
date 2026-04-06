"""
Code Generation Service
Orquestra geração de código usando LLM providers e contexto do projeto (OGC)
"""
import structlog
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.tenant import Artifact, ArtifactType, ArtifactStatus
from app.models.onboarding import ProjectRequest
from app.services.llm_service import LLMServiceFactory, LLMProvider
from app.services.piloter_service import PiloterService

logger = structlog.get_logger(__name__)


class CodeGenerationPromptBuilder:
    """Build dynamic prompts for code generation based on project context"""

    @staticmethod
    def build_project_context_prompt(
        project: ProjectRequest,
        artifacts: List[Artifact],
        stack_recommendations: Dict[str, Any]
    ) -> str:
        """
        Build comprehensive prompt with project context

        Includes:
        - Project requirements
        - Architecture blueprint
        - Technology stack
        - Best practices
        - Evaluation constraints
        """

        prompt = f"""# Code Generation Request

## Project Context
- Name: {project.project_name}
- Slug: {project.project_slug}
- Description: {project.description}

## Artifacts Summary
"""

        for artifact in artifacts:
            prompt += f"\n### {artifact.name} ({artifact.type})"
            if artifact.content:
                prompt += f"\n{artifact.content[:500]}..."

        # Add stack information
        if stack_recommendations:
            stack = stack_recommendations.get("stack", {})
            prompt += f"\n\n## Technology Stack\n"
            for key, value in stack.items():
                prompt += f"- {key.title()}: {value}\n"

            recommendations = stack_recommendations.get("recommendations", [])
            if recommendations:
                prompt += f"\n## Best Practices\n"
                for rec in recommendations:
                    prompt += f"- {rec}\n"

        prompt += f"\n## Instructions\n"
        prompt += f"Generate production-ready code following the specifications above.\n"
        prompt += f"Include:\n"
        prompt += f"- Clear code structure\n"
        prompt += f"- Error handling\n"
        prompt += f"- Type hints (if applicable)\n"
        prompt += f"- Documentation comments\n"

        return prompt

    @staticmethod
    def build_module_generation_prompt(
        module_name: str,
        module_type: str,
        context: Dict[str, Any]
    ) -> str:
        """Build prompt for specific module generation"""

        prompt = f"""# Generate {module_type.title()} Module: {module_name}

## Context
{context.get('description', 'No description provided')}

## Requirements
{context.get('requirements', 'See project artifacts')}

## Technology Stack
Language: {context.get('language', 'TBD')}
Framework: {context.get('framework', 'TBD')}
Database: {context.get('database', 'TBD')}

## Output Format
Generate complete, working code ready for integration.
Include tests if applicable.
"""
        return prompt


class CodeGenerationService:
    """Service for orchestrating code generation"""

    def __init__(self, db: AsyncSession, llm_provider: LLMProvider = LLMProvider.ANTHROPIC):
        self.db = db
        self.llm_provider = llm_provider
        self.piloter_service = PiloterService(db)

    async def generate_project_code(
        self,
        project_id: UUID,
        gp_id: UUID,
        language: str = "python",
        architecture: str = "microservices",
        api_key: str = None
    ) -> Dict[str, Any]:
        """
        Generate complete project code

        Process:
        1. Fetch project and evaluated artifacts
        2. Get stack recommendations
        3. Build comprehensive prompt
        4. Generate code with LLM
        5. Store as artifacts
        6. Return generation summary
        """

        try:
            # 1. Get project
            project = await self.db.get(ProjectRequest, project_id)
            if not project:
                raise ValueError("Project not found")

            # 2. Get approved artifacts
            result = await self.db.execute(
                select(Artifact)
                .where(Artifact.created_by == gp_id)
                .order_by(Artifact.created_at.desc())
            )
            artifacts = result.scalars().all()

            if not artifacts:
                raise ValueError("No artifacts found for project")

            # 3. Get stack recommendations
            stack_recommendations = await self.piloter_service.get_stack_recommendations(
                language=language,
                architecture=architecture
            )

            # 4. Build prompt
            prompt = CodeGenerationPromptBuilder.build_project_context_prompt(
                project=project,
                artifacts=artifacts,
                stack_recommendations=stack_recommendations
            )

            # 5. Generate code with selected LLM provider
            llm_client = LLMServiceFactory.create_client(
                provider=self.llm_provider,
                api_key=api_key or self._get_provider_api_key()
            )

            generated_code = await llm_client.generate(
                prompt=prompt,
                max_tokens=8000,
                temperature=0.3  # Lower temperature for code generation
            )

            # 6. Store generated code as artifact
            code_artifact = Artifact(
                id=None,  # Will be auto-generated
                name=f"{project.project_name} - Generated Code",
                type=ArtifactType.DOCUMENT,
                description=f"Generated code for {project.project_name}",
                content=generated_code,
                status=ArtifactStatus.APPROVED,
                created_by=gp_id
            )
            self.db.add(code_artifact)
            await self.db.commit()

            logger.info("code.generation_success",
                       project_id=str(project_id),
                       provider=self.llm_provider.value,
                       tokens_generated=len(generated_code.split()))

            return {
                "success": True,
                "project_id": str(project_id),
                "provider": self.llm_provider.value,
                "code_artifact_id": str(code_artifact.id),
                "generated_code": generated_code[:500] + "..." if len(generated_code) > 500 else generated_code,
                "full_code_length": len(generated_code),
                "stack_recommendations": stack_recommendations
            }

        except Exception as e:
            await self.db.rollback()
            logger.error("code.generation_failed",
                        project_id=str(project_id),
                        provider=self.llm_provider.value,
                        error=str(e))
            raise

    async def generate_module_code(
        self,
        project_id: UUID,
        module_name: str,
        module_type: str,
        requirements: Dict[str, Any],
        api_key: str = None
    ) -> Dict[str, Any]:
        """
        Generate specific module/component code

        module_type: "backend", "frontend", "database", "api", etc.
        """

        try:
            # Build module-specific prompt
            prompt = CodeGenerationPromptBuilder.build_module_generation_prompt(
                module_name=module_name,
                module_type=module_type,
                context=requirements
            )

            # Generate code
            llm_client = LLMServiceFactory.create_client(
                provider=self.llm_provider,
                api_key=api_key or self._get_provider_api_key()
            )

            generated_code = await llm_client.generate(
                prompt=prompt,
                max_tokens=4000,
                temperature=0.3
            )

            logger.info("code.module_generation_success",
                       project_id=str(project_id),
                       module=module_name,
                       provider=self.llm_provider.value)

            return {
                "success": True,
                "module_name": module_name,
                "module_type": module_type,
                "generated_code": generated_code,
                "provider": self.llm_provider.value
            }

        except Exception as e:
            logger.error("code.module_generation_failed",
                        project_id=str(project_id),
                        module=module_name,
                        error=str(e))
            raise

    async def validate_llm_provider(self, api_key: str = None) -> bool:
        """Validate LLM provider credentials"""

        try:
            llm_client = LLMServiceFactory.create_client(
                provider=self.llm_provider,
                api_key=api_key or self._get_provider_api_key()
            )
            return await llm_client.validate_credentials()

        except Exception as e:
            logger.warning("code.provider_validation_failed",
                          provider=self.llm_provider.value,
                          error=str(e))
            return False

    def _get_provider_api_key(self) -> str:
        """Get API key from environment"""
        import os

        key_mapping = {
            LLMProvider.ANTHROPIC: "ANTHROPIC_API_KEY",
            LLMProvider.OPENAI: "OPENAI_API_KEY",
            LLMProvider.GROK: "GROK_API_KEY",
            LLMProvider.DEEPSEEK: "DEEPSEEK_API_KEY"
        }

        env_key = key_mapping.get(self.llm_provider)
        if not env_key:
            raise ValueError(f"Unknown LLM provider: {self.llm_provider}")

        api_key = os.getenv(env_key)
        if not api_key:
            raise ValueError(f"API key not found for {self.llm_provider.value}: set {env_key}")

        return api_key

    async def get_generation_history(
        self,
        project_id: UUID,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get code generation history for project"""

        # Query artifacts of type DOCUMENT with "Generated Code" in name
        result = await self.db.execute(
            select(Artifact)
            .where(
                Artifact.name.like(f"% - Generated Code%")
            )
            .order_by(Artifact.created_at.desc())
            .limit(limit)
        )

        artifacts = result.scalars().all()

        return [
            {
                "artifact_id": str(a.id),
                "name": a.name,
                "generated_at": a.created_at.isoformat(),
                "size_bytes": len(a.content) if a.content else 0
            }
            for a in artifacts
        ]
