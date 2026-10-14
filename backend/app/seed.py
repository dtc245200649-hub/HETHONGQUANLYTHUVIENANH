import os
from PIL import Image as PILImage, ImageDraw, ImageFont
from app import db
from app.models.user import User
from app.models.album import Album
from app.models.image import Image
from app.models.tag import Tag
from flask import current_app

def generate_sample_image(filepath, text, bg_color, text_color):
    """Generates a high-quality sample image with beautiful gradient or solid color and text"""
    width, height = 1200, 800
    img = PILImage.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Draw modern grid / abstract decorative circles
    draw.ellipse([width - 300, -100, width + 200, 400], fill=(255, 255, 255, 20), outline=None)
    draw.ellipse([-150, height - 350, 350, height + 150], fill=(0, 0, 0, 30), outline=None)

    # Write text in center
    # Use default bitmap font with large step or fallback
    draw.rectangle([60, height - 160, width - 60, height - 60], fill=(0, 0, 0, 140))
    draw.text((100, height - 120), text, fill=text_color)

    img.save(filepath, 'JPEG', quality=95)
    return width, height

def seed_initial_data():
    # 1. Admin user
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@gallery.local',
            full_name='Quản Trị Viên Hệ Thống',
            role='admin',
            is_active=True
        )
        admin.set_password('Admin@123')
        db.session.add(admin)

    # 2. Demo user
    user1 = User.query.filter_by(username='user1').first()
    if not user1:
        user1 = User(
            username='user1',
            email='user1@gallery.local',
            full_name='Nguyễn Văn Demo',
            role='user',
            is_active=True
        )
        user1.set_password('User@123')
        db.session.add(user1)

    db.session.commit()

    # 3. Default Tags
    tag_names = ['Thiên nhiên', 'Du lịch', 'Kiến trúc', 'Công nghệ', 'Nghệ thuật', 'Hoàng hôn', 'Biển đảo']
    tags_map = {}
    for name in tag_names:
        tag = Tag.query.filter_by(name=name).first()
        if not tag:
            tag = Tag(name=name)
            db.session.add(tag)
        tags_map[name] = tag

    db.session.commit()

    # 4. Default Albums
    album1 = Album.query.filter_by(title='Bộ sưu tập Phong cảnh 2026').first()
    if not album1:
        album1 = Album(
            title='Bộ sưu tập Phong cảnh 2026',
            description='Tuyển tập những hình ảnh thiên nhiên và danh lam thắng cảnh tuyệt đẹp',
            is_public=True,
            user_id=admin.id
        )
        db.session.add(album1)

    album2 = Album.query.filter_by(title='Kiến trúc & Đô thị hiện đại').first()
    if not album2:
        album2 = Album(
            title='Kiến trúc & Đô thị hiện đại',
            description='Góc nhìn kiến trúc tương lai và các tòa nhà chọc trời',
            is_public=True,
            user_id=user1.id
        )
        db.session.add(album2)

    db.session.commit()

    # 5. Generate sample images if gallery is empty
    if Image.query.count() == 0:
        upload_folder = current_app.config['UPLOAD_FOLDER']
        os.makedirs(upload_folder, exist_ok=True)

        samples = [
            {
                'title': 'Bình minh trên vịnh Hạ Long',
                'description': 'Ánh sáng bình minh rạng rỡ phản chiếu trên mặt nước phẳng lặng',
                'filename': 'sample_halong.jpg',
                'bg': (30, 80, 130),
                'fg': (255, 255, 255),
                'tags': ['Thiên nhiên', 'Du lịch', 'Biển đảo'],
                'user': admin,
                'album': album1
            },
            {
                'title': 'Tháp Landmark 81 Về Đêm',
                'description': 'Đường chân trời rực rỡ với ánh đèn lung linh tại trung tâm thành phố',
                'filename': 'sample_landmark.jpg',
                'bg': (24, 28, 48),
                'fg': (255, 215, 0),
                'tags': ['Kiến trúc', 'Công nghệ'],
                'user': user1,
                'album': album2
            },
            {
                'title': 'Hoàng hôn Đà Lạt Mộng Mơ',
                'description': 'Rừng thông trong làn sương chiều và vệt mây ngũ sắc huyền ảo',
                'filename': 'sample_dalat.jpg',
                'bg': (180, 70, 50),
                'fg': (255, 245, 230),
                'tags': ['Thiên nhiên', 'Hoàng hôn', 'Du lịch'],
                'user': admin,
                'album': album1
            },
            {
                'title': 'Không gian Công nghệ AI 2026',
                'description': 'Thiết kế trung tâm dữ liệu và kiến trúc đám mây thế hệ mới',
                'filename': 'sample_datacenter.jpg',
                'bg': (15, 23, 42),
                'fg': (56, 189, 248),
                'tags': ['Công nghệ', 'Nghệ thuật'],
                'user': user1,
                'album': album2
            }
        ]

        for s in samples:
            filepath = os.path.join(upload_folder, s['filename'])
            w, h = generate_sample_image(
                filepath, 
                f"{s['title']} | Gallery Online", 
                s['bg'], 
                s['fg']
            )
            file_size = os.path.getsize(filepath)

            img_record = Image(
                title=s['title'],
                description=s['description'],
                filename=s['filename'],
                original_filename=s['filename'],
                file_path=filepath,
                file_size=file_size,
                mime_type='image/jpeg',
                width=w,
                height=h,
                is_public=True,
                user_id=s['user'].id,
                album_id=s['album'].id,
                view_count=18,
                download_count=5
            )

            db.session.add(img_record)

            for tname in s['tags']:
                tag_obj = Tag.query.filter_by(name=tname).first()
                if tag_obj:
                    img_record.tags.append(tag_obj)

        db.session.commit()

        # Update cover photo for albums
        first_img1 = Image.query.filter_by(album_id=album1.id).first()
        if first_img1:
            album1.cover_image_id = first_img1.id

        first_img2 = Image.query.filter_by(album_id=album2.id).first()
        if first_img2:
            album2.cover_image_id = first_img2.id

        db.session.commit()
