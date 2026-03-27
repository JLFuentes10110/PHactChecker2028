from pydantic import BaseModel, ConfigDict, field_validator
from uuid import UUID
from datetime import datetime, date
from typing import Optional
from app.models.legal_case import CaseType, CaseStatus, CourtBody


class LegalCaseCreate(BaseModel):
    figure_id: UUID
    case_number: Optional[str] = None
    case_type: CaseType
    court_body: CourtBody = CourtBody.OTHER
    status: CaseStatus = CaseStatus.UNKNOWN
    title: str
    description: Optional[str] = None
    charge: Optional[str] = None
    penalty: Optional[str] = None
    date_filed: Optional[date] = None
    date_resolved: Optional[date] = None
    source_url: str                          # ← required; every case must cite an official source
    source_label: Optional[str] = None
    added_by: Optional[str] = None

    @field_validator("source_url")
    @classmethod
    def source_url_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError(
                "source_url is required — every case must trace to an official source."
            )
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError(
                "source_url must be a full URL starting with http:// or https://"
            )
        return v


class LegalCaseUpdate(BaseModel):
    case_number: Optional[str] = None
    case_type: Optional[CaseType] = None
    court_body: Optional[CourtBody] = None
    status: Optional[CaseStatus] = None
    title: Optional[str] = None
    description: Optional[str] = None
    charge: Optional[str] = None
    penalty: Optional[str] = None
    date_filed: Optional[date] = None
    date_resolved: Optional[date] = None
    source_url: Optional[str] = None        # optional on PATCH — only validate if provided
    source_label: Optional[str] = None

    @field_validator("source_url")
    @classmethod
    def source_url_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("source_url cannot be blank if provided.")
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError(
                "source_url must be a full URL starting with http:// or https://"
            )
        return v


class FigureStub(BaseModel):
    """Minimal figure shape embedded in case responses."""
    id: UUID
    full_name: str
    alias: Optional[str]
    position: str
    party: Optional[str]
    model_config = ConfigDict(from_attributes=True)


class LegalCaseRead(BaseModel):
    id: UUID
    figure_id: UUID
    case_number: Optional[str]
    case_type: CaseType
    court_body: CourtBody
    status: CaseStatus
    title: str
    description: Optional[str]
    charge: Optional[str]
    penalty: Optional[str]
    date_filed: Optional[date]
    date_resolved: Optional[date]
    source_url: str                          # always present in responses
    source_label: Optional[str]
    added_by: Optional[str]
    subject: Optional[FigureStub] = None
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class VerdictCaseLinkRequest(BaseModel):
    """Payload for attaching/detaching a case from a verdict."""
    verdict_id: UUID
    case_id: UUID
