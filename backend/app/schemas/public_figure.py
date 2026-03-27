from pydantic import BaseModel, ConfigDict, HttpUrl
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from app.models.public_figure import FigurePosition


class PublicFigureCreate(BaseModel):
    full_name: str
    alias: Optional[str] = None
    position: FigurePosition = FigurePosition.OTHER
    party: Optional[str] = None
    region: Optional[str] = None
    province: Optional[str] = None
    photo_url: Optional[str] = None
    bio: Optional[str] = None


class PublicFigureUpdate(BaseModel):
    full_name: Optional[str] = None
    alias: Optional[str] = None
    position: Optional[FigurePosition] = None
    party: Optional[str] = None
    region: Optional[str] = None
    province: Optional[str] = None
    photo_url: Optional[str] = None
    bio: Optional[str] = None


class LegalCaseSummary(BaseModel):
    """Slim case shape embedded inside PublicFigureRead — avoids circular nesting."""
    id: UUID
    case_type: str
    court_body: str
    status: str
    title: str
    charge: Optional[str]
    date_filed: Optional[str]
    model_config = ConfigDict(from_attributes=True)


class PublicFigureRead(BaseModel):
    id: UUID
    full_name: str
    alias: Optional[str]
    position: FigurePosition
    party: Optional[str]
    region: Optional[str]
    province: Optional[str]
    photo_url: Optional[str]
    bio: Optional[str]
    cases: List[LegalCaseSummary] = []
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class PublicFigureListItem(BaseModel):
    """Lighter shape for list endpoints — no nested cases."""
    id: UUID
    full_name: str
    alias: Optional[str]
    position: FigurePosition
    party: Optional[str]
    region: Optional[str]
    case_count: int = 0

    model_config = ConfigDict(from_attributes=True)
