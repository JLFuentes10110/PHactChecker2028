import uuid
import enum
from sqlalchemy import Column, String, Text, Enum as SAEnum, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class FigurePosition(str, enum.Enum):
    PRESIDENT = "president"
    VICE_PRESIDENT = "vice_president"
    SENATOR = "senator"
    REPRESENTATIVE = "representative"
    GOVERNOR = "governor"
    MAYOR = "mayor"
    VICE_GOVERNOR = "vice_governor"
    VICE_MAYOR = "vice_mayor"
    BOARD_MEMBER = "board_member"
    COUNCILOR = "councilor"
    CABINET_SECRETARY = "cabinet_secretary"
    UNDERSECRETARTY = "undersecretary"
    BUREAU_DIRECTOR = "bureau_director"
    APPOINTEE = "appointee"
    OTHER = "other"


class PublicFigure(Base):
    __tablename__ = "public_figures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Identity
    full_name = Column(String(255), nullable=False)
    alias = Column(String(255), nullable=True)          # "Bongbong", "Kiko", etc.
    position = Column(SAEnum(FigurePosition), nullable=False, default=FigurePosition.OTHER)
    party = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)          # "Cebu", "NCR", etc.
    province = Column(String(100), nullable=True)
    photo_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    cases = relationship("LegalCase", back_populates="subject", lazy="selectin",
                         cascade="all, delete-orphan")
