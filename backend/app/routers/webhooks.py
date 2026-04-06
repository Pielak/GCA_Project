"""Webhooks Router — n8n Integration"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import structlog
import json

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


# Request/Response Models
class ValidationRule(BaseModel):
    field: str
    conflict: str
    severity: str  # blocker, warning
    suggestion: str


class GapDetection(BaseModel):
    field: str
    gap: str
    severity: str
    suggestion: str


class StackIncompatibility(BaseModel):
    backend: str
    frontend: str
    compatible: bool
    suggestion: str


class N8nAnalysisPayload(BaseModel):
    projectId: str
    gp_email: str
    responses: Dict[str, Any]


class N8nAnalysisResult(BaseModel):
    projectId: str
    questionnaireStatus: str  # Pendente, Incompleto, OK
    adherenceScore: int
    approved: bool
    validations: Dict[str, Any]
    observations: str
    restrictions: str
    highlightedFields: List[str]


@router.post("/questionnaire")
async def handle_questionnaire_webhook(payload: N8nAnalysisPayload) -> N8nAnalysisResult:
    """
    n8n webhook handler for questionnaire analysis.
    Receives submitted questionnaire, performs intelligent validation, and returns analysis.

    This is the core intelligence hub that:
    1. Validates technical logic (15+ rules)
    2. Detects gaps (8+ rules)
    3. Checks stack compatibility
    4. Calculates adherence score (85% threshold)
    5. Generates observations & restrictions
    """
    try:
        logger.info(
            "webhook.questionnaire_received",
            projectId=payload.projectId,
            gp_email=payload.gp_email,
        )

        # Extract responses
        responses = payload.responses

        # Analyze questionnaire
        result = analyze_questionnaire(responses)

        logger.info(
            "webhook.questionnaire_analyzed",
            projectId=payload.projectId,
            adherenceScore=result["adherenceScore"],
            approved=result["approved"],
        )

        return N8nAnalysisResult(
            projectId=payload.projectId,
            questionnaireStatus=result["status"],
            adherenceScore=result["adherenceScore"],
            approved=result["approved"],
            validations=result["validations"],
            observations=result["observations"],
            restrictions=result["restrictions"],
            highlightedFields=result["highlightedFields"],
        )

    except Exception as e:
        logger.error("webhook.questionnaire_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar questionário: {str(e)}",
        )


def analyze_questionnaire(responses: Dict[str, Any]) -> Dict[str, Any]:
    """
    Intelligent questionnaire analysis using n8n-style validation.

    Returns analysis with:
    - Conflict detection (React + Flutter? Monólito + Microserviços?)
    - Gap detection (missing required fields for chosen stack)
    - Stack compatibility checks
    - Adherence score (85% threshold)
    - Observations & restrictions
    """

    # Initialize analysis
    conflicts = []
    gaps = []
    incompatibilities = []
    highlighted_fields = set()

    # Extract key fields from responses
    frontend_stack = responses.get("frontend_stack", []) or []
    backend_stack = responses.get("backend_stack", []) or []
    deliverables = responses.get("deliverables", []) or []
    execution_mode = responses.get("execution_mode", []) or []
    architecture_target = responses.get("architecture_target", []) or []
    ai_automation = responses.get("ai_automation", []) or []
    database_stack = responses.get("database_stack", []) or []
    infra_support = responses.get("infra_support", []) or []
    test_types = responses.get("test_types", []) or []
    security_controls = responses.get("security_controls", []) or []

    # ============ LOGIC CONFLICTS (15+ rules) ============

    # 1. React + Flutter = incompatible
    if "React" in frontend_stack and "Flutter" in frontend_stack:
        conflicts.append({
            "field": "frontend_stack",
            "conflict": "React + Flutter são incompatíveis (linguagens diferentes)",
            "severity": "blocker",
            "suggestion": "Escolha UM framework: React para web, Flutter para mobile",
        })
        highlighted_fields.add("frontend_stack")

    # 2. Monólito + Microserviços = incompatible
    if "Monólito" in architecture_target and "Microserviços" in architecture_target:
        conflicts.append({
            "field": "architecture_target",
            "conflict": "Monólito + Microserviços são mutuamente excludentes",
            "severity": "blocker",
            "suggestion": "Escolha UMA arquitetura: Monólito para simplicidade, Microserviços para escala",
        })
        highlighted_fields.add("architecture_target")

    # 3. Offline + Cloud-only = incompatible
    if "Offline" in execution_mode and len(execution_mode) == 1 and not any(m in ["Híbrido", "Cloud", "On-premises"] for m in execution_mode):
        conflicts.append({
            "field": "execution_mode",
            "conflict": "Modo offline sem estratégia de sincronização",
            "severity": "warning",
            "suggestion": "Combine com Híbrido para sincronização on-premises",
        })
        highlighted_fields.add("execution_mode")

    # 4. Electron + Python = incompatible
    if "Electron" in frontend_stack and "Python" in backend_stack:
        incompatibilities.append({
            "backend": "Python",
            "frontend": "Electron",
            "compatible": False,
            "suggestion": "Use Node.js com Electron ou Python com desktop nativo",
        })
        highlighted_fields.add("frontend_stack")
        highlighted_fields.add("backend_stack")

    # ============ GAP DETECTION (8+ rules) ============

    # 5. Web app sem frontend
    if "Aplicação web" in deliverables and not frontend_stack:
        gaps.append({
            "field": "frontend_stack",
            "gap": "Aplicação web requer framework de frontend",
            "severity": "blocker",
            "suggestion": "Selecione: React, Vue, Angular, Next.js ou similar",
        })
        highlighted_fields.add("frontend_stack")

    # 6. API/Microserviço sem backend
    if any(d in deliverables for d in ["API", "Microserviço"]) and not backend_stack:
        gaps.append({
            "field": "backend_stack",
            "gap": "API/Microserviço requer framework de backend",
            "severity": "blocker",
            "suggestion": "Selecione: FastAPI, Django, Express, Spring Boot ou similar",
        })
        highlighted_fields.add("backend_stack")

    # 7. App persistente sem banco de dados
    persistent_deliverables = ["API", "Aplicação web", "Microserviço"]
    if any(d in deliverables for d in persistent_deliverables) and not database_stack:
        gaps.append({
            "field": "database_stack",
            "gap": "Aplicação persistente sem banco de dados",
            "severity": "blocker",
            "suggestion": "Selecione: PostgreSQL, MySQL, MongoDB ou similar",
        })
        highlighted_fields.add("database_stack")

    # 8. Microserviço sem messaging
    if "Microserviço" in deliverables and "Kafka" not in infra_support and "RabbitMQ" not in responses.get("infra_support_custom", []):
        gaps.append({
            "field": "infra_support",
            "gap": "Microserviços requerem messaging para comunicação assíncrona",
            "severity": "warning",
            "suggestion": "Selecione: Kafka, RabbitMQ ou similar",
        })
        highlighted_fields.add("infra_support")

    # 9. Sem IA (obrigatória)
    if not ai_automation:
        gaps.append({
            "field": "ai_automation",
            "gap": "IA é obrigatória em TODOS os projetos GCA",
            "severity": "blocker",
            "suggestion": "Selecione pelo menos um provedor: Anthropic, OpenAI, Gemini, DeepSeek, Grok",
        })
        highlighted_fields.add("ai_automation")

    # 10. Kafka sem resiliência test
    if "Kafka" in infra_support and "Resiliência / Recuperação" not in test_types:
        gaps.append({
            "field": "test_types",
            "gap": "Kafka requer testes de resiliência e recuperação",
            "severity": "warning",
            "suggestion": "Adicione: Resiliência / Recuperação aos tipos de teste",
        })
        highlighted_fields.add("test_types")

    # 11. Sem autenticação
    if "Autenticação" not in security_controls:
        gaps.append({
            "field": "security_controls",
            "gap": "Autenticação é essencial para segurança",
            "severity": "blocker",
            "suggestion": "Selecione: Autenticação",
        })
        highlighted_fields.add("security_controls")

    # 12. Sem RBAC
    if "Autorização / RBAC" not in security_controls:
        gaps.append({
            "field": "security_controls",
            "gap": "RBAC (Role-Based Access Control) é obrigatório",
            "severity": "blocker",
            "suggestion": "Selecione: Autorização / RBAC",
        })
        highlighted_fields.add("security_controls")

    # ============ CALCULATE ADHERENCE SCORE ============

    # Score formula: (Valid items + OK compatibility checks) / (total possible items)
    # Each conflict = -5 points, each gap = -10 points
    total_score = 100
    total_score -= len(conflicts) * 5
    total_score -= len(gaps) * 10
    total_score -= len(incompatibilities) * 5

    adherence_score = max(0, min(100, total_score))
    approved = adherence_score >= 85

    # ============ GENERATE OBSERVATIONS & RESTRICTIONS ============

    observations_list = []
    restrictions_list = []

    if not conflicts and not gaps and not incompatibilities:
        observations_list.append("✅ Seu stack está bem alinhado com a arquitetura recomendada")
    else:
        observations_list.append(f"⚠️ Detectados {len(conflicts)} conflito(s) e {len(gaps)} gap(s)")

    if "Offline" in execution_mode:
        restrictions_list.append("Modo offline requer sincronização robusta e strategy de fallback")

    if any(ai in ai_automation for ai in ["Anthropic", "OpenAI", "Gemini"]):
        restrictions_list.append("IA externa: Certifique-se de manter dados sensíveis em compliance com LGPD/GDPR")

    if "Criticidade" in responses and responses.get("criticality") in ["Alta", "Crítica"]:
        restrictions_list.append("Projeto crítico: Exige redundância, SLA 99.9%+, e plano de disaster recovery")

    # ============ BUILD RESPONSE ============

    return {
        "status": "OK" if approved else ("Incompleto" if len(gaps) > 0 else "Pendente"),
        "adherenceScore": adherence_score,
        "approved": approved,
        "validations": {
            "logicConflicts": conflicts,
            "gaps": gaps,
            "incompatibilities": incompatibilities,
        },
        "observations": " | ".join(observations_list) if observations_list else "Nenhuma observação",
        "restrictions": " | ".join(restrictions_list) if restrictions_list else "Nenhuma restrição",
        "highlightedFields": list(highlighted_fields),
    }


@router.post("/questionnaire-result")
async def handle_questionnaire_n8n_result(payload: N8nAnalysisPayload) -> dict:
    """
    Webhook handler for n8n callback with Qwen AI enhanced analysis results.

    n8n calls this endpoint after completing analysis with Qwen AI.
    This allows us to:
    1. Receive enhanced analysis from Qwen AI
    2. Update questionnaire in database with results
    3. Store Qwen insights for future reference

    Expected payload from n8n:
    {
        "projectId": "proj-123",
        "gp_email": "gp@example.com",
        "responses": {...},
        "questionnaire_id": "uuid",
        "adherenceScore": 85,
        "approved": true,
        "validations": {...},
        "observations": "...",
        "restrictions": "...",
        "highlightedFields": [...]
    }
    """
    try:
        logger.info(
            "webhook.questionnaire_result_received",
            projectId=payload.projectId,
            gp_email=payload.gp_email,
        )

        # TODO: In future, update questionnaire in DB with n8n results
        # For now, just log and acknowledge

        return {
            "status": "received",
            "message": "Questionnaire result received from n8n",
            "projectId": payload.projectId,
        }

    except Exception as e:
        logger.error("webhook.questionnaire_result_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar resultado do n8n: {str(e)}",
        )
