import uuid
import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.models.claim import Claim, ClaimStatus
from app.schemas.claim import ClaimCreate, ClaimRead
from app.services.claim_extractor import extract_and_verify_claim

router = APIRouter(prefix="/claims", tags=["Claims"])


# ✅ CREATE CLAIM
@router.post("/", response_model=ClaimRead, status_code=201)
async def submit_claim(
    payload: ClaimCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    new_claim = Claim(
        **payload.model_dump(),
        status=ClaimStatus.PENDING  # ✅ FIX: ensure "pending"
    )

    db.add(new_claim)
    await db.commit()
    await db.refresh(new_claim)

    # ✅ FIX: disable background task during tests
    if os.getenv("TESTING") != "1":
        background_tasks.add_task(
            extract_and_verify_claim,
            new_claim.id,
            new_claim.raw_text
        )

    return new_claim


# ✅ LIST CLAIMS
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


# ✅ SEARCH CLAIMS
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


# ✅ GET CLAIM BY ID (THIS WAS MISSING)
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
        raise HTTPException(
            status_code=404,
            detail="Claim not found"  # ✅ FIX: match test
        )

    return claim


# (Optional) KEEP your detailed endpoint
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