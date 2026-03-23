from sqlalchemy import Column, String, Float, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy import DateTime
import uuid
import enum
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

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False)
    tag = Column(SAEnum(VerdictTag), nullable=False)
    confidence = Column(Float, nullable=False)  # 0.0 - 1.0
    explanation = Column(Text, nullable=True)
    sources = Column(Text, nullable=True)       # JSON string of source URLs
    reviewed_by = Column(String, nullable=True) # editor username if human-reviewed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
