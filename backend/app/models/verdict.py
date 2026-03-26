import uuid
import enum
from sqlalchemy import Column, String, Float, Text, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class VerdictTag(str, enum.Enum):
    TRUE = "true"
    MOSTLY_TRUE = "mostly_true"
    MISLEADING = "misleading"
    FALSE = "false"
    UNVERIFIABLE = "unverifiable"
    CREDIT_GRAB = "credit_grab"

class Verdict(Base):
    __tablename__ = "verdicts"

    # 1. Primary Identifiers
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # 2. AI Analysis Fields (The "Elite" Refinements)
    tag = Column(SAEnum(VerdictTag), nullable=False)
    confidence = Column(Float, nullable=False, default=0.0)  # 0.0 - 1.0
    bias_note = Column(String, nullable=True)               # AI's assessment of source credibility
    
    # 3. Content Fields
    explanation = Column(Text, nullable=True)
    sources = Column(Text, nullable=True)                   # Store as string or JSON text
    
    # 4. Audit & Metadata
    reviewed_by = Column(String, nullable=True)             # Editor username if human-reviewed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 5. Relationships
    claim = relationship("Claim", back_populates="verdict")