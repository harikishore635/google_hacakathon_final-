"""
NexSeva Backend — FastAPI Server
Run:  uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime
import uuid
import os
import json
import re

from dotenv import load_dotenv
load_dotenv()

# ── Groq AI (Google Gemma 2) ──────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
groq_client = None

if GROQ_API_KEY:
    try:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("Groq AI (Gemma 2) initialized successfully")
    except Exception as e:
        print(f"Groq init failed: {e}")

# ── App instance ──────────────────────────────────────
app = FastAPI(
    title="NexSeva API",
    description="Intelligence Meets Compassion — Crisis Relief Backend",
    version="2.0.0",
)

# ── CORS ──────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3003",
    FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory store ────────────────────────────────────
crisis_reports: list = []
volunteers: list = []

# ── Models ────────────────────────────────────────────
class FieldMindTextInput(BaseModel):
    reporter_name: str = Field(..., min_length=1)
    ward: str = Field(..., min_length=1)
    families_affected: int = Field(default=0, ge=0)
    crisis_type: str = Field(..., min_length=1)
    needs: List[str] = Field(default_factory=list)
    notes: str = ""
    severity_estimate: str = "moderate"
    location: str = ""

class FieldMindResponse(BaseModel):
    status: str
    report_id: str
    reporter: str
    ward: str
    crisis_type: str
    affected_families: int
    needs: List[str]
    severity: str
    timestamp: str
    message: str

class VolunteerDeployInput(BaseModel):
    name: str = Field(..., min_length=1)
    ward: str = Field(..., min_length=1)
    skill: str = "general"

# ── Gemini helpers ────────────────────────────────────
def extract_json_from_text(text: str) -> dict:
    try:
        return json.loads(text)
    except Exception:
        pass
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except Exception:
            pass
    return {}

GEMINI_PROMPT = """You are NeedPulse, an AI crisis analyst for NexSeva disaster relief platform.
Analyze this field crisis report and return ONLY a JSON object (no markdown, no explanation):

Crisis Type: {crisis_type}
Location / Ward: {ward}
Families Affected: {families_affected}
Severity Estimate: {severity}
Immediate Needs: {needs}
Field Notes: {notes}

Return this exact JSON structure:
{{
  "urgency_score": <integer 0-100>,
  "priority_level": "<critical|high|moderate|low>",
  "key_risks": ["<risk1>", "<risk2>", "<risk3>"],
  "recommended_actions": ["<action1>", "<action2>", "<action3>"],
  "ai_reasoning": "<one sentence explaining the priority>"
}}"""

# ── Routes: Health ────────────────────────────────────
@app.get("/health")
@app.get("/ping")
async def health_check():
    return {
        "status": "healthy",
        "service": "nexseva-api",
        "version": "2.0.0",
        "gemma_ready": groq_client is not None,
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/")
async def root():
    return {
        "message": "NexSeva API — Intelligence Meets Compassion",
        "docs": "/docs",
        "health": "/health",
        "gemma_ready": groq_client is not None,
    }

# ── Routes: FieldMind ─────────────────────────────────
@app.post("/api/fieldmind/text", response_model=FieldMindResponse)
async def submit_field_report(data: FieldMindTextInput):
    try:
        report_id = f"sev-{uuid.uuid4().hex[:12]}"
        report = {
            "id": report_id,
            "reporter": data.reporter_name,
            "ward": data.ward,
            "affected_families": data.families_affected,
            "crisis_type": data.crisis_type,
            "needs": data.needs,
            "notes": data.notes,
            "severity": data.severity_estimate,
            "location": data.location,
            "timestamp": datetime.utcnow().isoformat(),
        }
        crisis_reports.append(report)
        return FieldMindResponse(
            status="success",
            report_id=report_id,
            reporter=data.reporter_name,
            ward=data.ward,
            crisis_type=data.crisis_type,
            affected_families=data.families_affected,
            needs=data.needs,
            severity=data.severity_estimate,
            timestamp=report["timestamp"],
            message=f"Report received. Gemini AI analysis in progress. {len(crisis_reports)} total reports.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/fieldmind/reports")
async def get_reports():
    return {"count": len(crisis_reports), "reports": crisis_reports}

# ── Routes: NeedPulse AI ──────────────────────────────
@app.post("/api/needpulse/analyze")
async def analyze_with_gemini(data: FieldMindTextInput):
    """Use Gemini AI to analyze a crisis report and return urgency scoring."""
    if not groq_client:
        raise HTTPException(status_code=503, detail="Groq AI not configured. Set GROQ_API_KEY.")

    prompt = GEMINI_PROMPT.format(
        crisis_type=data.crisis_type,
        ward=data.ward,
        families_affected=data.families_affected,
        severity=data.severity_estimate,
        needs=", ".join(data.needs) if data.needs else "unspecified",
        notes=data.notes or "No additional notes",
    )

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=512,
        )
        raw_text = response.choices[0].message.content.strip()
        result = extract_json_from_text(raw_text)

        if not result.get("urgency_score"):
            raise ValueError("Invalid Gemini response structure")

        return {
            "status": "success",
            "source": "llama-3.3-70b (Groq)",
            "urgency_score": int(result.get("urgency_score", 50)),
            "priority_level": result.get("priority_level", "moderate"),
            "key_risks": result.get("key_risks", []),
            "recommended_actions": result.get("recommended_actions", []),
            "ai_reasoning": result.get("ai_reasoning", ""),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq AI analysis failed: {str(e)}")

# ── Routes: Volunteers ────────────────────────────────
@app.post("/api/volunteers/deploy")
async def deploy_volunteer(data: VolunteerDeployInput):
    try:
        vol = {
            "id": f"vol-{uuid.uuid4().hex[:8]}",
            "name": data.name,
            "ward": data.ward,
            "skill": data.skill,
            "status": "active",
            "deployed_at": datetime.utcnow().isoformat(),
        }
        volunteers.append(vol)
        return {"status": "success", "volunteer": vol}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/volunteers")
async def get_volunteers():
    return {"count": len(volunteers), "volunteers": volunteers}

# ── Routes: Dashboard Stats ───────────────────────────
@app.get("/api/dashboard/stats")
async def dashboard_stats():
    return {
        "total_reports": len(crisis_reports),
        "active_volunteers": len([v for v in volunteers if v["status"] == "active"]),
        "critical_reports": len([r for r in crisis_reports if r["severity"] == "critical"]),
        "total_affected": sum(r["affected_families"] for r in crisis_reports),
    }

# ── Error handlers ────────────────────────────────────
@app.exception_handler(404)
async def not_found_handler(_request, _exc):
    return JSONResponse(status_code=404, content={"error": "Not Found"})

@app.exception_handler(500)
async def internal_error_handler(_request, _exc):
    return JSONResponse(status_code=500, content={"error": "Internal Server Error"})

# ── Run ───────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    print(f"\n🚀 NexSeva API v2.0 starting on http://localhost:{port}")
    print(f"🤖 Gemini AI: {'✅ Ready' if groq_client else '❌ Not configured'}")
    print(f"📄 Docs: http://localhost:{port}/docs\n")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
