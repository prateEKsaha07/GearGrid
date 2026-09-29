import os

import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
)


def upload_image(file_bytes: bytes, folder: str) -> str:
    response = cloudinary.uploader.upload(
        file_bytes,
        resource_type="image",
        folder=folder,
    )
    return response["secure_url"]