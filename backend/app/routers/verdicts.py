from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.core.database import get_db
from app.models.verdict import Verdict
from app.schemas.verdict import VerdictCreate, VerdictRead
import json

router = APIRouter(prefix="/verdicts", tags=["Verdicts"])

@router.post("/", response_model=VerdictRead, status_code=201)
async def create_verdict(payload: VerdictCreate, db: AsyncSession = Depends(get_db)):
    """Manually create or override a verdict (editor use)."""
    data = payload.model_dump()
    data["sources"] = json.dumps(data["sources"]) if data.get("sources") else None
    verdict = Verdict(**data)
    db.add(verdict)
    await db.commit()
    await db.refresh(verdict)
    return verdict

@router.get("/claim/{claim_id}", response_model=list[VerdictRead])
async def get_verdicts_for_claim(claim_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Verdict).where(Verdict.claim_id == claim_id))
    return result.scalars().all()
