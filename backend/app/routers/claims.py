import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.models.claim import Claim, ClaimStatus
from app.schemas.claim import ClaimCreate, ClaimRead
from app.services.claim_extractor import extract_and_verify_claim
from app.core.database import AsyncSessionLocal

router = APIRouter(prefix="/claims", tags=["Claims"])


@router.post("/", response_model=ClaimRead, status_code=201)
async def submit_claim(
    payload: ClaimCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    new_claim = Claim(**payload.model_dump(), status=ClaimStatus.PENDING)
    db.add(new_claim)
    await db.commit()
    await db.refresh(new_claim)

    background_tasks.add_task(
        extract_and_verify_claim,
        new_claim.id,
        new_claim.raw_text,
        request.app.state.tavily,  # ← was missing
        request.app.state.groq,
        AsyncSessionLocal    # ← was missing
    )

    return new_claim


@router.get("/", response_model=List[ClaimRead])
async def list_claims(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Claim)
        .options(selectinload(Claim.verdict))
        .offset(skip)
        .limit(limit)
        .order_by(Claim.created_at.desc())
    )
    return result.scalars().all()


@router.get("/search", response_model=List[ClaimRead])
async def search_claims(
    q: str = Query(..., min_length=3),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Claim)
        .options(selectinload(Claim.verdict))
        .where(Claim.raw_text.ilike(f"%{q}%"))
        .limit(20)
    )
    return result.scalars().all()


@router.get("/{claim_id}", response_model=ClaimRead)
async def get_claim_by_id(
    claim_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Claim)
        .options(selectinload(Claim.verdict))
        .where(Claim.id == claim_id)
    )
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim


@router.get("/{claim_id}/details", response_model=ClaimRead)
async def get_claim_details(
    claim_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Claim)
        .options(selectinload(Claim.verdict))
        .where(Claim.id == claim_id)
    )
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim
