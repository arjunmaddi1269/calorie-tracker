"""File storage utilities for S3/MinIO."""
import uuid
from datetime import datetime
import boto3
from botocore.exceptions import ClientError

from app.core.config import settings


class StorageService:
    """Service for handling file uploads to S3/MinIO."""

    def __init__(self):
        """Initialize S3 client."""
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            endpoint_url=settings.AWS_S3_ENDPOINT_URL or None,
            region_name=settings.AWS_S3_REGION,
        )
        self.bucket_name = settings.AWS_S3_BUCKET

    def generate_file_key(self, user_id: str, filename: str) -> str:
        """
        Generate unique S3 key for uploaded file.

        Args:
            user_id: User ID
            filename: Original filename

        Returns:
            S3 key path
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_uuid = uuid.uuid4().hex[:8]
        extension = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"

        return f"food-photos/{user_id}/{timestamp}_{file_uuid}.{extension}"

    async def upload_file(
        self, file_data: bytes, user_id: str, filename: str, content_type: str = "image/jpeg"
    ) -> tuple[str, str]:
        """
        Upload file to S3/MinIO.

        Args:
            file_data: File bytes
            user_id: User ID
            filename: Original filename
            content_type: MIME type

        Returns:
            Tuple of (s3_key, public_url)

        Raises:
            Exception: If upload fails
        """
        try:
            s3_key = self.generate_file_key(user_id, filename)

            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_data,
                ContentType=content_type,
                ACL="public-read",
            )

            # Generate public URL
            if settings.AWS_S3_ENDPOINT_URL:
                # MinIO local development
                public_url = f"{settings.AWS_S3_ENDPOINT_URL}/{self.bucket_name}/{s3_key}"
            else:
                # AWS S3 production
                public_url = f"https://{self.bucket_name}.s3.{settings.AWS_S3_REGION}.amazonaws.com/{s3_key}"

            return s3_key, public_url

        except ClientError as e:
            raise Exception(f"Failed to upload file: {str(e)}")

    async def delete_file(self, s3_key: str) -> bool:
        """
        Delete file from S3/MinIO.

        Args:
            s3_key: S3 key of file to delete

        Returns:
            True if successful, False otherwise
        """
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError:
            return False

    async def get_file_url(self, s3_key: str, expires_in: int = 3600) -> str:
        """
        Generate presigned URL for private file access.

        Args:
            s3_key: S3 key
            expires_in: URL expiration time in seconds

        Returns:
            Presigned URL
        """
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": s3_key},
                ExpiresIn=expires_in,
            )
            return url
        except ClientError as e:
            raise Exception(f"Failed to generate presigned URL: {str(e)}")


# Global storage service instance
storage_service = StorageService()
