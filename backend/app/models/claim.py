from sqlalchemy import Column, String, DateTime, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base
from sqlalchemy.orm import relationship

class ClaimStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"

class ClaimSource(str, enum.Enum):
    TWITTER = "twitter"
    FACEBOOK = "facebook"
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    NEWS = "news"
    MANUAL = "manual"

class Claim(Base):
    __tablename__ = "claims"


    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    raw_text = Column(Text, nullable=False)
    source = Column(SAEnum(ClaimSource), default=ClaimSource.MANUAL)
    source_url = Column(String, nullable=True)
    language = Column(String(10), default="tl")
    status = Column(SAEnum(ClaimStatus), default=ClaimStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    verdict = relationship("Verdict", back_populates="claim", uselist=False, lazy="selectin")