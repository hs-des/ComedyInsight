from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import admin_with_rate_limit
from db import get_db
from models import FileObject
from schemas import (
    BucketListResponse,
    BucketRequest,
    FileItem,
    FileListResponse,
    StorageUsageResponse,
    UploadFileRequest,
    UploadFileResponse,
)
from storage_service import StorageService

router = APIRouter(prefix="/api/files", tags=["files"])


@router.post("/upload", response_model=UploadFileResponse)
async def request_upload(
    payload: UploadFileRequest,
    session: AsyncSession = Depends(get_db),
    actor: str = Depends(admin_with_rate_limit),
) -> UploadFileResponse:
    storage = await StorageService.from_session(session)
    storage.ensure_bucket()

    key = storage.generate_object_key(payload.file_name)
    upload_url = storage.generate_presigned_upload(key, payload.content_type)

    record = FileObject(
        bucket=storage.credentials.bucket,
        key=key,
        file_name=payload.file_name,
        content_type=payload.content_type,
        size_bytes=payload.size_bytes,
    )
    session.add(record)
    await session.commit()

    return UploadFileResponse(file_id=str(record.id), upload_url=upload_url, method="PUT", expires_in=3600)


@router.get("", response_model=FileListResponse)
async def list_files(
    page: int = 1,
    page_size: int = 20,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> FileListResponse:
    if page < 1 or page_size < 1 or page_size > 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid pagination parameters")

    query = select(FileObject).where(FileObject.deleted_at.is_(None)).order_by(FileObject.uploaded_at.desc())
    total_query = select(func.count()).select_from(FileObject).where(FileObject.deleted_at.is_(None))

    total_result = await session.execute(total_query)
    total = total_result.scalar_one()

    result = await session.execute(query.offset((page - 1) * page_size).limit(page_size))
    records = result.scalars().all()

    storage = await StorageService.from_session(session)

    items: list[FileItem] = []
    for record in records:
        preview_url: Optional[str] = None
        if record.content_type.startswith(("image/", "application/pdf")):
            preview_url = storage.generate_presigned_download(record.key, expires_in=300)
        download_url = storage.generate_presigned_download(record.key, expires_in=300)

        items.append(
            FileItem(
                id=str(record.id),
                file_name=record.file_name,
                content_type=record.content_type,
                size_bytes=record.size_bytes,
                bucket=record.bucket,
                key=record.key,
                uploaded_at=record.uploaded_at.isoformat(),
                preview_url=preview_url,
                download_url=download_url,
            )
        )

    return FileListResponse(items=items, page=page, page_size=page_size, total=total)


@router.get("/{file_id}/download")
async def download_file(
    file_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> dict:
    result = await session.execute(select(FileObject).where(FileObject.id == file_id, FileObject.deleted_at.is_(None)))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    storage = await StorageService.from_session(session)
    url = storage.generate_presigned_download(record.key, expires_in=600)
    return {"url": url}


@router.delete("/{file_id}")
async def delete_file(
    file_id: UUID,
    session: AsyncSession = Depends(get_db),
    actor: str = Depends(admin_with_rate_limit),
) -> dict:
    result = await session.execute(select(FileObject).where(FileObject.id == file_id, FileObject.deleted_at.is_(None)))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    storage = await StorageService.from_session(session)
    storage.delete_object(record.key)
    record.deleted_at = datetime.utcnow()
    record.updated_at = record.deleted_at
    await session.commit()
    return {"success": True, "message": "File deleted"}


@router.get("/storage-usage", response_model=StorageUsageResponse)
async def storage_usage(
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> StorageUsageResponse:
    storage = await StorageService.from_session(session)
    usage = storage.get_usage()
    return StorageUsageResponse(total_files=usage["total_files"], total_size=usage["total_size"])


@router.get("/buckets", response_model=BucketListResponse)
async def list_buckets(
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> BucketListResponse:
    storage = await StorageService.from_session(session)
    return BucketListResponse(buckets=storage.list_buckets())


@router.post("/buckets", status_code=status.HTTP_201_CREATED)
async def create_bucket(
    payload: BucketRequest,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> dict:
    storage = await StorageService.from_session(session)
    storage.create_bucket(payload.name, payload.region)
    return {"success": True, "bucket": payload.name}


@router.delete("/buckets/{bucket_name}")
async def delete_bucket(
    bucket_name: str,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> dict:
    storage = await StorageService.from_session(session)
    if bucket_name == storage.credentials.bucket:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete active storage bucket")
    storage.delete_bucket(bucket_name)
    return {"success": True, "bucket": bucket_name}
