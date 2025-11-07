from __future__ import annotations

import uuid
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from dependencies import admin_with_rate_limit
from db import get_db
from schemas import Pagination, UserListResponse, UserSummary, UserUpdateRequest

router = APIRouter(tags=["users"])


async def _fetch_user(session: AsyncSession, user_id: UUID) -> Dict[str, Any] | None:
    query = text(
        """
        SELECT id, email, full_name, is_active, is_verified, created_at
        FROM users
        WHERE id = :user_id
        """
    )
    result = await session.execute(query, {"user_id": str(user_id)})
    row = result.mappings().first()
    return dict(row) if row else None


@router.get("/api/users", response_model=UserListResponse)
async def list_users(
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    status_filter: str | None = None,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> UserListResponse:
    if page < 1 or page_size < 1 or page_size > 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid pagination parameters")

    conditions = ["1 = 1"]
    params: Dict[str, Any] = {}

    if search:
        conditions.append("(LOWER(email) LIKE :search OR LOWER(full_name) LIKE :search)")
        params["search"] = f"%{search.lower()}%"

    if status_filter == "active":
        conditions.append("is_active = true")
    elif status_filter == "inactive":
        conditions.append("is_active = false")

    where_clause = " AND ".join(conditions)

    count_query = text(f"SELECT COUNT(*) FROM users WHERE {where_clause}")
    total_result = await session.execute(count_query, params)
    total = total_result.scalar_one()

    list_query = text(
        f"""
        SELECT id, email, full_name, is_active, is_verified, created_at
        FROM users
        WHERE {where_clause}
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
        """
    )
    params.update({"limit": page_size, "offset": (page - 1) * page_size})
    result = await session.execute(list_query, params)
    rows = result.mappings().all()

    items = [
        UserSummary(
            id=UUID(row["id"]),
            email=row.get("email"),
            full_name=row.get("full_name"),
            created_at=row["created_at"],
            is_active=row.get("is_active"),
            is_verified=row.get("is_verified"),
        )
        for row in rows
    ]

    return UserListResponse(items=items, pagination=Pagination(total=total, page=page, page_size=page_size))


@router.get("/api/users/{user_id}", response_model=UserSummary)
async def get_user(
    user_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> UserSummary:
    row = await _fetch_user(session, user_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserSummary(
        id=UUID(row["id"]),
        email=row.get("email"),
        full_name=row.get("full_name"),
        created_at=row["created_at"],
        is_active=row.get("is_active"),
        is_verified=row.get("is_verified"),
    )


@router.put("/api/users/{user_id}", response_model=UserSummary)
async def update_user(
    user_id: UUID,
    payload: UserUpdateRequest,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> UserSummary:
    if await _fetch_user(session, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    data = payload.model_dump(exclude_unset=True)
    if not data:
        return await get_user(user_id=user_id, session=session, _=_)

    set_clauses = []
    params: Dict[str, Any] = {"user_id": str(user_id)}
    if "full_name" in data:
        set_clauses.append("full_name = :full_name")
        params["full_name"] = data["full_name"]
    if "is_active" in data:
        set_clauses.append("is_active = :is_active")
        params["is_active"] = data["is_active"]
    if "is_verified" in data:
        set_clauses.append("is_verified = :is_verified")
        params["is_verified"] = data["is_verified"]

    update_query = text(
        f"""
        UPDATE users
        SET {', '.join(set_clauses)}, updated_at = NOW()
        WHERE id = :user_id
        """
    )
    await session.execute(update_query, params)
    await session.commit()
    return await get_user(user_id=user_id, session=session, _=_)
