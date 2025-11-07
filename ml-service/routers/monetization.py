from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from dependencies import admin_with_rate_limit
from db import get_db
from models import SubscriptionPlan, UserSubscription
from schemas import (
    SubscriptionPlanCreate,
    SubscriptionPlanResponse,
    UserSubscriptionRequest,
    UserSubscriptionResponse,
)

router = APIRouter(tags=["monetization"])


@router.post("/api/subscription-plans", response_model=SubscriptionPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription_plan(
    payload: SubscriptionPlanCreate,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> SubscriptionPlanResponse:
    existing = await session.execute(select(SubscriptionPlan).where(SubscriptionPlan.name == payload.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Subscription plan already exists")

    plan = SubscriptionPlan(**payload.model_dump())
    session.add(plan)
    await session.commit()
    await session.refresh(plan)
    return SubscriptionPlanResponse.model_validate(plan)


@router.get("/api/subscription-plans", response_model=list[SubscriptionPlanResponse])
async def list_subscription_plans(
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> list[SubscriptionPlanResponse]:
    result = await session.execute(select(SubscriptionPlan).order_by(SubscriptionPlan.created_at.desc()))
    plans = result.scalars().all()
    return [SubscriptionPlanResponse.model_validate(plan) for plan in plans]


@router.post("/api/users/{user_id}/subscription", response_model=UserSubscriptionResponse)
async def upsert_user_subscription(
    user_id: UUID,
    payload: UserSubscriptionRequest,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> UserSubscriptionResponse:
    if payload.plan_id:
        plan_result = await session.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == payload.plan_id))
        if not plan_result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription plan not found")

    result = await session.execute(select(UserSubscription).where(UserSubscription.user_id == user_id))
    subscription = result.scalar_one_or_none()

    if subscription is None:
        subscription = UserSubscription(user_id=user_id, **payload.model_dump())
        session.add(subscription)
    else:
        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(subscription, key, value)

    await session.commit()
    await session.refresh(subscription)
    return UserSubscriptionResponse.model_validate(subscription)
