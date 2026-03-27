import uuid
import enum
from sqlalchemy import (
    Column, String, Text, Enum as SAEnum,
    DateTime, Date, ForeignKey, Table
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


# ── Enums ────────────────────────────────────────────────────────────────────

class CaseType(str, enum.Enum):
    CRIMINAL = "criminal"
    ADMINISTRATIVE = "administrative"
    SANDIGANBAYAN = "sandiganbayan"
    COMELEC_DISQUALIFICATION = "comelec_disqualification"
    OMBUDSMAN = "ombudsman"
    CIVIL = "civil"


class CaseStatus(str, enum.Enum):
    FILED = "filed"
    PENDING = "pending"
    ON_TRIAL = "on_trial"
    ON_APPEAL = "on_appeal"
    DISMISSED = "dismissed"
    ACQUITTED = "acquitted"
    CONVICTED = "convicted"
    DISQUALIFIED = "disqualified"
    REINSTATED = "reinstated"
    UNKNOWN = "unknown"


class CourtBody(str, enum.Enum):
    RTC = "regional_trial_court"
    MTC = "metropolitan_trial_court"
    SANDIGANBAYAN = "sandiganbayan"
    SUPREME_COURT = "supreme_court"
    COURT_OF_APPEALS = "court_of_appeals"
    COMELEC = "comelec"
    OMBUDSMAN = "ombudsman"
    DOJ = "department_of_justice"
    CSC = "civil_service_commission"
    OTHER = "other"


# ── Junction table: LegalCase ↔ Verdict ──────────────────────────────────────
# Allows a verdict to cite multiple cases as evidence, and a case to appear
# across multiple verdicts.

verdict_cases = Table(
    "verdict_cases",
    Base.metadata,
    Column(
        "verdict_id",
        UUID(as_uuid=True),
        ForeignKey("verdicts.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "case_id",
        UUID(as_uuid=True),
        ForeignKey("legal_cases.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


# ── Model ─────────────────────────────────────────────────────────────────────

class LegalCase(Base):
    __tablename__ = "legal_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Subject
    figure_id = Column(
        UUID(as_uuid=True),
        ForeignKey("public_figures.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Case identity
    case_number = Column(String(100), nullable=True)   # e.g. "SB-21-CRM-0456"
    case_type = Column(SAEnum(CaseType), nullable=False)
    court_body = Column(SAEnum(CourtBody), nullable=False, default=CourtBody.OTHER)
    status = Column(SAEnum(CaseStatus), nullable=False, default=CaseStatus.UNKNOWN)

    # Content
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    charge = Column(String(255), nullable=True)         # "Plunder", "Graft", etc.
    penalty = Column(String(255), nullable=True)        # If convicted/sentenced

    # Dates
    date_filed = Column(Date, nullable=True)
    date_resolved = Column(Date, nullable=True)

    # Sources
    source_url = Column(String, nullable=True)
    source_label = Column(String(255), nullable=True)   # "Sandiganbayan records", "COA report"

    # Audit
    added_by = Column(String(100), nullable=True)       # Editor username
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    subject = relationship("PublicFigure", back_populates="cases")
    verdicts = relationship(
        "Verdict",
        secondary=verdict_cases,
        back_populates="cited_cases",
        lazy="selectin",
    )
