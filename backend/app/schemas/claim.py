from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.claim import ClaimStatus, ClaimSource

class ClaimCreate(BaseModel):
    raw_text: str
    source: str  # Changed from ClaimSource to str
    source_url: Optional[str] = None
    language: Optional[str] = "tl"
    
    @field_validator('source')
    @classmethod
    def normalize_source(cls, v):
        """Convert source string to lowercase and validate against enum."""
        if isinstance(v, str):
            # Convert to lowercase
            v_lower = v.lower()
            # Check if it's a valid source
            valid_sources = [s.value for s in ClaimSource]
            if v_lower not in valid_sources:
                raise ValueError(f"Invalid source. Must be one of: {valid_sources}")
            # Return the enum value directly
            return ClaimSource(v_lower)
        return v
    
    @field_validator('language')
    @classmethod
    def validate_language(cls, v):
        """Ensure language is valid."""
        if v and v not in ['tl', 'en']:
            raise ValueError("Language must be 'tl' or 'en'")
        return v

class ClaimRead(BaseModel):
    id: UUID
    raw_text: str
    source: ClaimSource
    source_url: Optional[str] = None
    language: str
    status: ClaimStatus
    created_at: datetime

    model_config = {"from_attributes": True}