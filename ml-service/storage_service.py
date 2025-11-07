from __future__ import annotations

import uuid
import os
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

import boto3
from botocore.client import Config as BotoConfig
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from .models import FileObject, SettingsVersion
from .services import decrypt_settings, latest_settings


@dataclass
class StorageCredentials:
    endpoint: str
    bucket: str
    access_key: str
    secret_key: str
    region: Optional[str]
    path_style: bool


class StorageService:
    def __init__(self, credentials: StorageCredentials) -> None:
        session = boto3.session.Session(
            aws_access_key_id=credentials.access_key,
            aws_secret_access_key=credentials.secret_key,
            region_name=credentials.region or "us-east-1",
        )
        config = BotoConfig(signature_version="s3v4", s3={"addressing_style": "path" if credentials.path_style else "auto"})
        self.client = session.client("s3", endpoint_url=credentials.endpoint, config=config)
        self.credentials = credentials

    @classmethod
    async def from_session(cls, session: AsyncSession) -> "StorageService":
        record: Optional[SettingsVersion] = await latest_settings(session)
        if record:
            config = decrypt_settings(record)
            creds = StorageCredentials(
                endpoint=str(config.storage.endpoint),
                bucket=config.storage.bucket,
                access_key=config.storage.access_key,
                secret_key=config.storage.secret_key,
                region=config.storage.region,
                path_style=True,
            )
            return cls(creds)

        env_endpoint = os.getenv("AWS_S3_ENDPOINT", "http://minio:9000")
        env_bucket = os.getenv("AWS_S3_BUCKET", "comedyinsight")
        env_access_key = os.getenv("AWS_ACCESS_KEY_ID", "minioadmin")
        env_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY", "minioadmin")
        env_region = os.getenv("AWS_S3_REGION", "us-east-1")
        use_path_style = os.getenv("AWS_S3_USE_PATH_STYLE", "true").lower() == "true"

        creds = StorageCredentials(
            endpoint=env_endpoint,
            bucket=env_bucket,
            access_key=env_access_key,
            secret_key=env_secret_key,
            region=env_region,
            path_style=use_path_style,
        )
        return cls(creds)

    def ensure_bucket(self) -> None:
        try:
            self.client.head_bucket(Bucket=self.credentials.bucket)
        except ClientError:
            params: Dict[str, Any] = {"Bucket": self.credentials.bucket}
            if self.credentials.region and self.credentials.region != "us-east-1":
                params["CreateBucketConfiguration"] = {"LocationConstraint": self.credentials.region}
            self.client.create_bucket(**params)

    def list_buckets(self) -> List[str]:
        response = self.client.list_buckets()
        return [bucket["Name"] for bucket in response.get("Buckets", [])]

    def create_bucket(self, name: str, region: Optional[str] = None) -> None:
        params: Dict[str, Any] = {"Bucket": name}
        if region and region != "us-east-1":
            params["CreateBucketConfiguration"] = {"LocationConstraint": region}
        self.client.create_bucket(**params)

    def delete_bucket(self, name: str) -> None:
        self.client.delete_bucket(Bucket=name)

    def generate_object_key(self, file_name: str) -> str:
        timestamp = datetime.utcnow()
        path_prefix = f"{timestamp.year}/{timestamp.month:02d}/{timestamp.day:02d}"
        unique_id = uuid.uuid4().hex
        return f"uploads/{path_prefix}/{unique_id}-{file_name}"

    def generate_presigned_upload(self, key: str, content_type: str, expires_in: int = 3600) -> str:
        try:
            return self.client.generate_presigned_url(
                "put_object",
                Params={"Bucket": self.credentials.bucket, "Key": key, "ContentType": content_type},
                ExpiresIn=expires_in,
            )
        except (ClientError, BotoCoreError) as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Failed to create upload URL: {exc}") from exc

    def generate_presigned_download(self, key: str, expires_in: int = 600) -> str:
        try:
            return self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.credentials.bucket, "Key": key},
                ExpiresIn=expires_in,
            )
        except (ClientError, BotoCoreError) as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Failed to create download URL: {exc}") from exc

    def delete_object(self, key: str) -> None:
        try:
            self.client.delete_object(Bucket=self.credentials.bucket, Key=key)
        except (ClientError, BotoCoreError) as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Failed to delete file: {exc}") from exc

    def list_objects(self, prefix: Optional[str] = None, max_keys: int = 1000, continuation_token: Optional[str] = None) -> Dict[str, Any]:
        kwargs: Dict[str, Any] = {"Bucket": self.credentials.bucket, "MaxKeys": max_keys}
        if prefix:
            kwargs["Prefix"] = prefix
        if continuation_token:
            kwargs["ContinuationToken"] = continuation_token
        try:
            return self.client.list_objects_v2(**kwargs)
        except (ClientError, BotoCoreError) as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Failed to list files: {exc}") from exc

    def get_usage(self) -> Dict[str, Any]:
        continuation_token: Optional[str] = None
        total_size = 0
        total_files = 0
        while True:
            response = self.list_objects(continuation_token=continuation_token)
            for obj in response.get("Contents", []):
                total_files += 1
                total_size += obj.get("Size", 0)
            if response.get("IsTruncated"):
                continuation_token = response.get("NextContinuationToken")
            else:
                break
        return {"total_files": total_files, "total_size": total_size}

