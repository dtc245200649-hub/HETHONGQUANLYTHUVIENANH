import os
import uuid
from PIL import Image, ImageOps

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_and_process_image(file_storage, upload_folder, thumb_folder, max_thumb_size=(500, 500)):
    os.makedirs(upload_folder, exist_ok=True)
    os.makedirs(thumb_folder, exist_ok=True)

    original_filename = file_storage.filename or 'upload.jpg'
    ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else 'jpg'
    
    # Generate unique filename to prevent collisions & directory traversal
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    thumb_name = f"thumb_{uuid.uuid4().hex}.webp"

    file_path = os.path.join(upload_folder, unique_name)
    thumb_path = os.path.join(thumb_folder, thumb_name)

    # Save original file
    file_storage.save(file_path)
    file_size = os.path.getsize(file_path)

    # Validate image and extract metadata using Pillow
    try:
        with Image.open(file_path) as img:
            # Correct orientation from EXIF if present
            try:
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass

            width, height = img.size
            mime_type = Image.MIME.get(img.format, f"image/{ext}")

            # Generate optimized thumbnail
            img_thumb = img.copy()
            img_thumb.thumbnail(max_thumb_size, Image.Resampling.LANCZOS)
            
            # Convert RGBA to RGB if saving as WebP/JPEG
            if img_thumb.mode in ('RGBA', 'LA') and ext in ('jpg', 'jpeg'):
                background = Image.new('RGB', img_thumb.size, (255, 255, 255))
                background.paste(img_thumb, mask=img_thumb.split()[-1])
                img_thumb = background
            elif img_thumb.mode not in ('RGB', 'RGBA'):
                img_thumb = img_thumb.convert('RGB')

            img_thumb.save(thumb_path, 'WEBP', quality=85, optimize=True)

        return {
            'success': True,
            'filename': unique_name,
            'thumbnail_filename': thumb_name,
            'file_size': file_size,
            'width': width,
            'height': height,
            'mime_type': mime_type
        }
    except Exception as e:
        # If pillow fails to open, remove potentially corrupt/malicious file
        if os.path.exists(file_path):
            os.remove(file_path)
        return {
            'success': False,
            'error': f"Tập tin không phải là hình ảnh hợp lệ hoặc bị lỗi: {str(e)}"
        }

def delete_image_files(upload_folder, thumb_folder, filename, thumbnail_filename=None):
    try:
        if filename:
            orig = os.path.join(upload_folder, filename)
            if os.path.exists(orig):
                os.remove(orig)
        if thumbnail_filename:
            thumb = os.path.join(thumb_folder, thumbnail_filename)
            if os.path.exists(thumb):
                os.remove(thumb)
    except Exception as e:
        print(f"Error deleting files {filename}: {e}")
