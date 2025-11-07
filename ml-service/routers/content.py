from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, delete, func, insert, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from dependencies import admin_with_rate_limit
from db import get_db
from models import (
    Artist,
    Category,
    Subtitle,
    Video,
    video_artists,
    video_categories,
)
from schemas import (
    ArtistCreate,
    ArtistListResponse,
    ArtistResponse,
    ArtistUpdate,
    CategoryCreate,
    CategoryListResponse,
    CategoryResponse,
    CategoryUpdate,
    Pagination,
    SubtitleCreateRequest,
    SubtitleResponse,
    SubtitleUpdateRequest,
    VideoCreate,
    VideoListResponse,
    VideoResponse,
    VideoUpdate,
)

router = APIRouter(tags=["content"])


async def serialize_artist(session: AsyncSession, artist: Artist) -> ArtistResponse:
    return ArtistResponse.model_validate(artist)


async def serialize_category(session: AsyncSession, category: Category) -> CategoryResponse:
    return CategoryResponse.model_validate(category)


async def serialize_subtitles(session: AsyncSession, video_id: UUID) -> list[SubtitleResponse]:
    subtitles = await session.execute(select(Subtitle).where(Subtitle.video_id == video_id))
    return [SubtitleResponse.model_validate(obj) for obj in subtitles.scalars().all()]


async def serialize_video(session: AsyncSession, video: Video) -> VideoResponse:
    artist_rows = await session.execute(
        select(Artist).join(video_artists, video_artists.c.artist_id == Artist.id).where(video_artists.c.video_id == video.id)
    )
    category_rows = await session.execute(
        select(Category).join(video_categories, video_categories.c.category_id == Category.id).where(video_categories.c.video_id == video.id)
    )
    artist_responses = [ArtistResponse.model_validate(obj) for obj in artist_rows.scalars().all()]
    category_responses = [CategoryResponse.model_validate(obj) for obj in category_rows.scalars().all()]
    subtitle_responses = await serialize_subtitles(session, video.id)
    base = {
        "id": video.id,
        "title": video.title,
        "slug": video.slug,
        "description": video.description,
        "thumbnail_url": video.thumbnail_url,
        "video_url": video.video_url,
        "duration_seconds": video.duration_seconds,
        "status": video.status,
        "release_date": video.release_date,
        "is_featured": video.is_featured,
        "metadata": video.metadata or {},
        "created_at": video.created_at,
        "updated_at": video.updated_at,
    }
    return VideoResponse.model_validate(
        {
            **base,
            "artists": artist_responses,
            "categories": category_responses,
            "subtitles": subtitle_responses,
        }
    )


@router.post("/api/artists", response_model=ArtistResponse, status_code=status.HTTP_201_CREATED)
async def create_artist(
    payload: ArtistCreate,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> ArtistResponse:
    existing = await session.execute(select(Artist).where((Artist.slug == payload.slug) | (Artist.name == payload.name)))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Artist already exists")

    artist = Artist(**payload.model_dump())
    session.add(artist)
    await session.commit()
    await session.refresh(artist)
    return await serialize_artist(session, artist)


@router.get("/api/artists/{artist_id}", response_model=ArtistResponse)
async def get_artist(
    artist_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> ArtistResponse:
    result = await session.execute(select(Artist).where(Artist.id == artist_id))
    artist = result.scalar_one_or_none()
    if not artist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found")
    return await serialize_artist(session, artist)


@router.get("/api/artists", response_model=ArtistListResponse)
async def list_artists(
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    status_filter: str | None = None,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> ArtistListResponse:
    if page < 1 or page_size < 1 or page_size > 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid pagination parameters")

    filters = []
    if search:
        like = f"%{search}%"
        filters.append(or_(Artist.name.ilike(like), Artist.slug.ilike(like)))
    if status_filter == "active":
        filters.append(Artist.is_active.is_(True))
    elif status_filter == "inactive":
        filters.append(Artist.is_active.is_(False))

    query = select(Artist).where(*filters).order_by(Artist.created_at.desc())
    result = await session.execute(query.offset((page - 1) * page_size).limit(page_size))
    items = result.scalars().all()
    count_query = select(func.count()).select_from(select(Artist.id).where(*filters).subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()
    return ArtistListResponse(
        items=[await serialize_artist(session, artist) for artist in items],
        pagination=Pagination(total=total, page=page, page_size=page_size),
    )


@router.put("/api/artists/{artist_id}", response_model=ArtistResponse)
async def update_artist(
    artist_id: UUID,
    payload: ArtistUpdate,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> ArtistResponse:
    result = await session.execute(select(Artist).where(Artist.id == artist_id))
    artist = result.scalar_one_or_none()
    if not artist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(artist, key, value)
    await session.commit()
    await session.refresh(artist)
    return await serialize_artist(session, artist)


@router.delete("/api/artists/{artist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_artist(
    artist_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> None:
    result = await session.execute(select(Artist).where(Artist.id == artist_id))
    artist = result.scalar_one_or_none()
    if not artist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found")
    await session.delete(artist)
    await session.commit()


@router.post("/api/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> CategoryResponse:
    existing = await session.execute(select(Category).where((Category.slug == payload.slug) | (Category.name == payload.name)))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already exists")
    category = Category(**payload.model_dump())
    session.add(category)
    await session.commit()
    await session.refresh(category)
    return await serialize_category(session, category)


@router.get("/api/categories/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> CategoryResponse:
    result = await session.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return await serialize_category(session, category)


@router.get("/api/categories", response_model=CategoryListResponse)
async def list_categories(
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    status_filter: str | None = None,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> CategoryListResponse:
    if page < 1 or page_size < 1 or page_size > 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid pagination parameters")

    filters = []
    if search:
        like = f"%{search}%"
        filters.append(or_(Category.name.ilike(like), Category.slug.ilike(like)))
    if status_filter == "active":
        filters.append(Category.is_active.is_(True))
    elif status_filter == "inactive":
        filters.append(Category.is_active.is_(False))

    query = select(Category).where(*filters).order_by(Category.created_at.desc())
    result = await session.execute(query.offset((page - 1) * page_size).limit(page_size))
    items = result.scalars().all()
    count_query = select(func.count()).select_from(select(Category.id).where(*filters).subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()
    return CategoryListResponse(
        items=[await serialize_category(session, category) for category in items],
        pagination=Pagination(total=total, page=page, page_size=page_size),
    )


@router.put("/api/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    payload: CategoryUpdate,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> CategoryResponse:
    result = await session.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(category, key, value)
    await session.commit()
    await session.refresh(category)
    return await serialize_category(session, category)


@router.delete("/api/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> None:
    result = await session.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    await session.delete(category)
    await session.commit()


@router.post("/api/videos", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
async def create_video(
    payload: VideoCreate,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> VideoResponse:
    existing = await session.execute(select(Video).where(Video.slug == payload.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Video with slug already exists")

    video_data = payload.model_dump(exclude={"artist_ids", "category_ids", "subtitles"})
    video = Video(**video_data)
    session.add(video)
    await session.commit()
    await session.refresh(video)

    if payload.artist_ids:
        values = [
            {"video_id": video.id, "artist_id": artist_id}
            for artist_id in payload.artist_ids
        ]
        await session.execute(insert(video_artists), values)

    if payload.category_ids:
        values = [
            {"video_id": video.id, "category_id": category_id}
            for category_id in payload.category_ids
        ]
        await session.execute(insert(video_categories), values)

    if payload.subtitles:
        for subtitle in payload.subtitles:
            sub = Subtitle(video_id=video.id, **subtitle.model_dump())
            session.add(sub)

    await session.commit()
    return await serialize_video(session, video)


@router.get("/api/videos/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> VideoResponse:
    result = await session.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    return await serialize_video(session, video)


@router.get("/api/videos", response_model=VideoListResponse)
async def list_videos(
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    status_filter: str | None = None,
    artist_id: UUID | None = None,
    category_id: UUID | None = None,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> VideoListResponse:
    if page < 1 or page_size < 1 or page_size > 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid pagination parameters")

    filters = []
    if search:
        like = f"%{search}%"
        filters.append(Video.title.ilike(like))
    if status_filter:
        filters.append(Video.status == status_filter)

    query = select(Video).distinct()
    count_query = select(Video.id).distinct()

    if artist_id:
        query = query.join(video_artists, video_artists.c.video_id == Video.id)
        count_query = count_query.join(video_artists, video_artists.c.video_id == Video.id)
        filters.append(video_artists.c.artist_id == artist_id)
    if category_id:
        query = query.join(video_categories, video_categories.c.video_id == Video.id)
        count_query = count_query.join(video_categories, video_categories.c.video_id == Video.id)
        filters.append(video_categories.c.category_id == category_id)

    query = query.where(*filters).order_by(Video.created_at.desc())
    count_query = count_query.where(*filters)

    total_result = await session.execute(select(func.count()).select_from(count_query.subquery()))
    total = total_result.scalar_one()
    result = await session.execute(query.offset((page - 1) * page_size).limit(page_size))
    videos = result.scalars().all()
    items = [await serialize_video(session, video) for video in videos]
    return VideoListResponse(items=items, pagination=Pagination(total=total, page=page, page_size=page_size))


@router.put("/api/videos/{video_id}", response_model=VideoResponse)
async def update_video(
    video_id: UUID,
    payload: VideoUpdate,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> VideoResponse:
    result = await session.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    data = payload.model_dump(exclude_unset=True, exclude={"artist_ids", "category_ids", "subtitles"})
    for key, value in data.items():
        setattr(video, key, value)

    if payload.artist_ids is not None:
        await session.execute(delete(video_artists).where(video_artists.c.video_id == video.id))
        if payload.artist_ids:
            values = [{"video_id": video.id, "artist_id": artist_id} for artist_id in payload.artist_ids]
            await session.execute(insert(video_artists), values)

    if payload.category_ids is not None:
        await session.execute(delete(video_categories).where(video_categories.c.video_id == video.id))
        if payload.category_ids:
            values = [{"video_id": video.id, "category_id": category_id} for category_id in payload.category_ids]
            await session.execute(insert(video_categories), values)

    if payload.subtitles is not None:
        await session.execute(delete(Subtitle).where(Subtitle.video_id == video.id))
        for subtitle in payload.subtitles:
            session.add(Subtitle(video_id=video.id, **subtitle.model_dump()))

    await session.commit()
    await session.refresh(video)
    return await serialize_video(session, video)


@router.delete("/api/videos/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(
    video_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> None:
    result = await session.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    await session.delete(video)
    await session.commit()


@router.post("/api/subtitles", response_model=SubtitleResponse, status_code=status.HTTP_201_CREATED)
async def create_subtitle(
    payload: SubtitleCreateRequest,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> SubtitleResponse:
    video = await session.execute(select(Video).where(Video.id == payload.video_id))
    if not video.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    subtitle = Subtitle(video_id=payload.video_id, **payload.model_dump(exclude={"video_id"}))
    session.add(subtitle)
    await session.commit()
    await session.refresh(subtitle)
    return SubtitleResponse.model_validate(subtitle)


@router.put("/api/subtitles/{subtitle_id}", response_model=SubtitleResponse)
async def update_subtitle(
    subtitle_id: UUID,
    payload: SubtitleUpdateRequest,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> SubtitleResponse:
    result = await session.execute(select(Subtitle).where(Subtitle.id == subtitle_id))
    subtitle = result.scalar_one_or_none()
    if not subtitle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtitle not found")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(subtitle, key, value)
    await session.commit()
    await session.refresh(subtitle)
    return SubtitleResponse.model_validate(subtitle)


@router.delete("/api/subtitles/{subtitle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subtitle(
    subtitle_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> None:
    result = await session.execute(select(Subtitle).where(Subtitle.id == subtitle_id))
    subtitle = result.scalar_one_or_none()
    if not subtitle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtitle not found")
    await session.delete(subtitle)
    await session.commit()


@router.get("/api/subtitles", response_model=list[SubtitleResponse])
async def list_subtitles(
    video_id: UUID | None = None,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> list[SubtitleResponse]:
    query = select(Subtitle)
    if video_id:
        query = query.where(Subtitle.video_id == video_id)
    result = await session.execute(query.order_by(Subtitle.created_at.desc()))
    return [SubtitleResponse.model_validate(obj) for obj in result.scalars().all()]
