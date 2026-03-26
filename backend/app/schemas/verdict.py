from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.verdict import VerdictTag
import json

class VerdictCreate(BaseModel):
    claim_id: UUID
    tag: VerdictTag
    confidence: float = Field(..., ge=0.0, le=1.0)
    explanation: Optional[str] = None
    sources: Optional[List[str]] = None
    bias_note: Optional[str] = None  # 👈 Added for AI-to-DB sync

class VerdictRead(BaseModel):
    id: UUID
    claim_id: UUID
    tag: VerdictTag
    confidence: float
    explanation: Optional[str]
    sources: Optional[List[str]]
    bias_note: Optional[str]        # 👈 Added for DB-to-Frontend display
    reviewed_by: Optional[str]
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def parse_sources(cls, data):
        # We check both dict (from AI) and object (from SQLAlchemy)
        src = getattr(data, "sources", None) or data.get("sources")
        
        if isinstance(src, str):
            try:
                # Use a dictionary update to avoid modifying original object if possible
                if isinstance(data, dict):
                    data["sources"] = json.loads(src)
                else:
                    # For SQLAlchemy objects, we handle the parsing
                    # so Pydantic can map it to List[str]
                    setattr(data, "sources", json.loads(src))
            except (json.JSONDecodeError, TypeError):
                if isinstance(data, dict):
                    data["sources"] = []
                else:
                    setattr(data, "sources", [])
        return data

    model_config = {"from_attributes": True}