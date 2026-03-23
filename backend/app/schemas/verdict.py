from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.verdict import VerdictTag

class VerdictCreate(BaseModel):
    claim_id: UUID
    tag: VerdictTag
    confidence: float = Field(..., ge=0.0, le=1.0)
    explanation: Optional[str] = None
    sources: Optional[List[str]] = None

class VerdictRead(BaseModel):
    id: UUID
    claim_id: UUID
    tag: VerdictTag
    confidence: float
    explanation: Optional[str]
    sources: Optional[str]
    reviewed_by: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
