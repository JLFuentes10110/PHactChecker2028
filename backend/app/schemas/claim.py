from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Literal
from app.models.claim import ClaimSource, ClaimStatus
from app.models.verdict import VerdictTag

# --- VERDICT SCHEMAS ---
class VerdictRead(BaseModel):
    id: UUID
    claim_id: UUID
    tag: VerdictTag
    confidence: float = Field(..., ge=0.0, le=1.0)
    explanation: Optional[str]
    sources: Optional[str]
    bias_note: Optional[str] = None

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- CLAIM SCHEMAS ---
class ClaimCreate(BaseModel):
    raw_text: str
    source: ClaimSource
    source_url: Optional[str] = None
    language: Literal["en", "tl", "ceb", "ilo"] = "tl"  # ✅ FIX: added ceb + ilo, default tl

class ClaimRead(BaseModel):
    id: UUID
    raw_text: str
    source: ClaimSource
    source_url: Optional[str]
    language: str
    status: ClaimStatus
    created_at: datetime
    updated_at: Optional[datetime]
    verdict: Optional[VerdictRead] = None

    model_config = ConfigDict(from_attributes=True)