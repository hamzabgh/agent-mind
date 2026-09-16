from fastapi import APIRouter

router = APIRouter(prefix="/api/projects", tags=["projects"])

# Stand-in for a real `projects` table / CMS. Feeds the WORK nav view.
PROJECTS = [
    {
        "id": "docuai",
        "name": "DocuAI",
        "summary": "OCR + NER + RAG pipeline turning documents into cited, queryable knowledge.",
        "tech": ["Python", "FastAPI", "pgvector", "OCR", "NER"],
    },
    {
        "id": "ai-agents",
        "name": "AI Agent Harness",
        "summary": "Tool-use loops, sandboxed execution, and guardrails for autonomous agents.",
        "tech": ["Python", "LangGraph", "Sandboxing"],
    },
]


@router.get("")
async def list_projects() -> list[dict]:
    return PROJECTS
