import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.models.legal_case import LegalCase, CaseType, CaseStatus
from app.models.verdict import Verdict
from app.schemas.legal_case import (
    LegalCaseCreate,
    LegalCaseUpdate,
    LegalCaseRead,
    VerdictCaseLinkRequest,
)

router = APIRouter(prefix="/cases", tags=["Legal Cases"])


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.post("/", response_model=LegalCaseRead, status_code=201)
async def create_case(
    payload: LegalCaseCreate,
    db: AsyncSession = Depends(get_db),
):
    case = LegalCase(**payload.model_dump())
    db.add(case)
    await db.commit()
    await db.refresh(case)
    return case


@router.get("/", response_model=List[LegalCaseRead])
async def list_cases(
    skip: int = 0,
    limit: int = 50,
    figure_id: uuid.UUID = Query(None),
    case_type: CaseType = Query(None),
    status: CaseStatus = Query(None),
    q: str = Query(None, min_length=2, description="Search title, charge, or case number"),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(LegalCase)
        .options(selectinload(LegalCase.subject))
        .offset(skip)
        .limit(limit)
        .order_by(LegalCase.created_at.desc())
    )
    if figure_id:
        stmt = stmt.where(LegalCase.figure_id == figure_id)
    if case_type:
        stmt = stmt.where(LegalCase.case_type == case_type)
    if status:
        stmt = stmt.where(LegalCase.status == status)
    if q:
        stmt = stmt.where(
            LegalCase.title.ilike(f"%{q}%")
            | LegalCase.charge.ilike(f"%{q}%")
            | LegalCase.case_number.ilike(f"%{q}%")
        )

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{case_id}", response_model=LegalCaseRead)
async def get_case(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LegalCase)
        .options(selectinload(LegalCase.subject))
        .where(LegalCase.id == case_id)
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.patch("/{case_id}", response_model=LegalCaseRead)
async def update_case(
    case_id: uuid.UUID,
    payload: LegalCaseUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LegalCase).where(LegalCase.id == case_id)
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(case, key, value)

    await db.commit()
    await db.refresh(case)
    return case


@router.delete("/{case_id}", status_code=204)
async def delete_case(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LegalCase).where(LegalCase.id == case_id)
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    await db.delete(case)
    await db.commit()


# ── Verdict ↔ Case linking ────────────────────────────────────────────────────

@router.post("/link", status_code=200)
async def link_case_to_verdict(
    payload: VerdictCaseLinkRequest,
    db: AsyncSession = Depends(get_db),
):
    """Attach a legal case as cited evidence for a verdict."""
    verdict = await db.get(Verdict, payload.verdict_id)
    if not verdict:
        raise HTTPException(status_code=404, detail="Verdict not found")

    case = await db.get(LegalCase, payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Avoid duplicates
    await db.refresh(verdict, ["cited_cases"])
    if case not in verdict.cited_cases:
        verdict.cited_cases.append(case)
        await db.commit()

    return {"verdict_id": str(payload.verdict_id), "case_id": str(payload.case_id), "linked": True}


@router.delete("/link", status_code=200)
async def unlink_case_from_verdict(
    payload: VerdictCaseLinkRequest,
    db: AsyncSession = Depends(get_db),
):
    """Detach a legal case from a verdict."""
    verdict = await db.get(Verdict, payload.verdict_id)
    if not verdict:
        raise HTTPException(status_code=404, detail="Verdict not found")

    case = await db.get(LegalCase, payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    await db.refresh(verdict, ["cited_cases"])
    if case in verdict.cited_cases:
        verdict.cited_cases.remove(case)
        await db.commit()

    return {"verdict_id": str(payload.verdict_id), "case_id": str(payload.case_id), "linked": False}
