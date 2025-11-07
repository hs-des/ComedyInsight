from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from dependencies import admin_with_rate_limit
from db import get_db
from models import FileObject
from schemas import DirectUploadResponse
from storage_service import StorageService

router = APIRouter(tags=["files"])


@router.post("/api/upload", response_model=DirectUploadResponse, status_code=status.HTTP_201_CREATED)
async def direct_upload(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> DirectUploadResponse:
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    storage = await StorageService.from_session(session)
    storage.ensure_bucket()
    key = storage.generate_object_key(file.filename)
    try:
        storage.client.put_object(
            Bucket=storage.credentials.bucket,
            Key=key,
            Body=contents,
            ContentType=file.content_type or "application/octet-stream",
        )
    except Exception as exc:  # pragma: no cover - delegated to boto3
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Failed to upload file: {exc}") from exc

    record = FileObject(
        bucket=storage.credentials.bucket,
        key=key,
        file_name=file.filename,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(contents),
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)

    download_url = storage.generate_presigned_download(key, expires_in=600)
    object_url = f"{storage.credentials.endpoint.rstrip('/')}/{storage.credentials.bucket}/{key}"
    return DirectUploadResponse(
        file_id=record.id,
        file_name=record.file_name,
        key=key,
        content_type=record.content_type,
        size_bytes=record.size_bytes,
        download_url=download_url,
        object_url=object_url,
    )


@router.get("/api/files", include_in_schema=False)
async def list_files_alias(
    page: int = 1,
    page_size: int = 20,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
):
    from .files import list_files as core_list_files

    return await core_list_files(page=page, page_size=page_size, session=session, _=_)


@router.delete("/api/files/{file_id}", include_in_schema=False)
async def delete_file_alias(
    file_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
):
    from .files import delete_file as core_delete_file

    return await core_delete_file(file_id=file_id, session=session, actor=_)
