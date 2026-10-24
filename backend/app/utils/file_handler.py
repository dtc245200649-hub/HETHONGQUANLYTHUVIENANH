import os
import uuid
from fractions import Fraction
from PIL import Image, ImageOps
from PIL.ExifTags import TAGS

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_exif_data(img):
    exif_data = {}
    try:
        raw_exif = img.getexif()
        if not raw_exif:
            return exif_data

        decoded = {}
        for tag_id, value in raw_exif.items():
            tag = TAGS.get(tag_id, tag_id)
            decoded[tag] = value

        if hasattr(raw_exif, 'get_ifd'):
            try:
                exif_ifd = raw_exif.get_ifd(0x8769)
                for tag_id, value in exif_ifd.items():
                    tag = TAGS.get(tag_id, tag_id)
                    decoded[tag] = value
            except Exception:
                pass

        # Camera Make & Model
        make = str(decoded.get('Make', '')).strip()
        model = str(decoded.get('Model', '')).strip()
        if make and model and make.lower() in model.lower():
            camera = model
        elif make and model:
            camera = f"{make} {model}"
        else:
            camera = model or make
        if camera:
            exif_data['camera'] = camera

        # Lens Model
        lens = str(decoded.get('LensModel', '')).strip()
        if lens:
            exif_data['lens'] = lens

        # Aperture
        f_number = decoded.get('FNumber')
        if f_number is not None:
            try:
                val = float(f_number)
                exif_data['aperture'] = f"f/{val:.1f}" if val % 1 else f"f/{int(val)}"
            except Exception:
                pass

        # Shutter speed
        exp_time = decoded.get('ExposureTime')
        if exp_time is not None:
            try:
                val = float(exp_time)
                if val < 1 and val > 0:
                    frac = Fraction(val).limit_denominator(8000)
                    exif_data['shutter_speed'] = f"{frac.numerator}/{frac.denominator}s"
                else:
                    exif_data['shutter_speed'] = f"{val:.1f}s"
            except Exception:
                pass

        # ISO
        iso = decoded.get('ISOSpeedRatings') or decoded.get('PhotographicSensitivity')
        if iso:
            exif_data['iso'] = f"ISO {iso}"

        # Focal Length
        focal = decoded.get('FocalLength')
        if focal is not None:
            try:
                exif_data['focal_length'] = f"{float(focal):.0f}mm"
            except Exception:
                pass

        # Date Taken
        date_taken = decoded.get('DateTimeOriginal') or decoded.get('DateTime')
        if date_taken:
            exif_data['date_taken'] = str(date_taken)

    except Exception as e:
        print(f"Error parsing EXIF: {e}")

    return exif_data

def save_and_process_image(file_storage, upload_folder, thumb_folder, max_thumb_size=(500, 500)):
    os.makedirs(upload_folder, exist_ok=True)
    os.makedirs(thumb_folder, exist_ok=True)

    original_filename = file_storage.filename or 'upload.jpg'
    ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else 'jpg'
    
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    thumb_name = f"thumb_{uuid.uuid4().hex}.webp"

    file_path = os.path.join(upload_folder, unique_name)
    thumb_path = os.path.join(thumb_folder, thumb_name)

    file_storage.save(file_path)
    file_size = os.path.getsize(file_path)

    try:
        exif_info = {}
        with Image.open(file_path) as img:
            exif_info = extract_exif_data(img)
            try:
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass

            width, height = img.size
            mime_type = Image.MIME.get(img.format, f"image/{ext}")

            img_thumb = img.copy()
            img_thumb.thumbnail(max_thumb_size, Image.Resampling.LANCZOS)
            
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
            'mime_type': mime_type,
            'exif_data': exif_info
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
