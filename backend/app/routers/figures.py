import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.models.public_figure import PublicFigure
from app.models.legal_case import LegalCase
from app.schemas.public_figure import (
    PublicFigureCreate,
    PublicFigureUpdate,
    PublicFigureRead,
    PublicFigureListItem,
)

router = APIRouter(prefix="/figures", tags=["Public Figures"])


@router.post("/", response_model=PublicFigureRead, status_code=201)
async def create_figure(
    payload: PublicFigureCreate,
    db: AsyncSession = Depends(get_db),
):
    figure = PublicFigure(**payload.model_dump())
    db.add(figure)
    await db.commit()
    await db.refresh(figure)
    return figure


@router.get("/", response_model=List[PublicFigureListItem])
async def list_figures(
    skip: int = 0,
    limit: int = 50,
    q: str = Query(None, description="Search by name or alias"),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            PublicFigure,
            func.count(LegalCase.id).label("case_count"),
        )
        .outerjoin(LegalCase, LegalCase.figure_id == PublicFigure.id)
        .group_by(PublicFigure.id)
        .offset(skip)
        .limit(limit)
        .order_by(PublicFigure.full_name)
    )
    if q:
        stmt = stmt.where(
            PublicFigure.full_name.ilike(f"%{q}%")
            | PublicFigure.alias.ilike(f"%{q}%")
        )

    rows = (await db.execute(stmt)).all()

    result = []
    for figure, case_count in rows:
        item = PublicFigureListItem.model_validate(figure)
        item.case_count = case_count
        result.append(item)
    return result


@router.get("/{figure_id}", response_model=PublicFigureRead)
async def get_figure(
    figure_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PublicFigure)
        .options(selectinload(PublicFigure.cases))
        .where(PublicFigure.id == figure_id)
    )
    figure = result.scalar_one_or_none()
    if not figure:
        raise HTTPException(status_code=404, detail="Public figure not found")
    return figure


@router.patch("/{figure_id}", response_model=PublicFigureRead)
async def update_figure(
    figure_id: uuid.UUID,
    payload: PublicFigureUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PublicFigure).where(PublicFigure.id == figure_id)
    )
    figure = result.scalar_one_or_none()
    if not figure:
        raise HTTPException(status_code=404, detail="Public figure not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(figure, key, value)

    await db.commit()
    await db.refresh(figure)
    return figure


@router.delete("/{figure_id}", status_code=204)
async def delete_figure(
    figure_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PublicFigure).where(PublicFigure.id == figure_id)
    )
    figure = result.scalar_one_or_none()
    if not figure:
        raise HTTPException(status_code=404, detail="Public figure not found")
    await db.delete(figure)
    await db.commit()
