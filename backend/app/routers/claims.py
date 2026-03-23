from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.core.database import get_db
from app.models.claim import Claim
from app.schemas.claim import ClaimCreate, ClaimRead
from app.services.claim_extractor import extract_claims

router = APIRouter(prefix="/claims", tags=["Claims"])

@router.post("/", response_model=ClaimRead, status_code=201)
async def submit_claim(payload: ClaimCreate, db: AsyncSession = Depends(get_db)):
    """Submit raw text for claim extraction and fact-checking."""
    # The payload now has source as an enum value (ClaimSource) after validation
    claim = Claim(**payload.model_dump())
    db.add(claim)
    await db.commit()
    await db.refresh(claim)
    # Trigger async extraction (stub for now)
    await extract_claims(claim.id, claim.raw_text)
    return claim

@router.get("/{claim_id}", response_model=ClaimRead)
async def get_claim(claim_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific claim by ID."""
    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim

@router.get("/", response_model=list[ClaimRead])
async def list_claims(skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)):
    """List all claims with pagination."""
    result = await db.execute(select(Claim).offset(skip).limit(limit))
    return result.scalars().all()