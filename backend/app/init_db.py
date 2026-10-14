import os
from PIL import Image, ImageDraw, ImageFont
from .models import db, User, Photo, Album, Tag
from .utils.file_handler import save_and_process_image

def seed_database(app):
    with app.app_context():
        # Create all tables
        db.create_all()

        # Check if admin exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@gallery.local',
                full_name='Hệ thống Quản Trị Viên',
                role='admin',
                avatar_url='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
            )
            admin.set_password('AdminPassword123!')
            db.session.add(admin)

        # Check if demo user exists
        demo_user = User.query.filter_by(username='photographer').first()
        if not demo_user:
            demo_user = User(
                username='photographer',
                email='user@gallery.local',
                full_name='Nhiếp Ảnh Gia Minh',
                role='user',
                avatar_url='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
            )
            demo_user.set_password('UserPassword123!')
            db.session.add(demo_user)

        db.session.commit()

        # Default tags
        default_tag_names = ['Thiên nhiên', 'Đô thị', 'Kiến trúc', 'Chân dung', 'Du lịch', 'Nghệ thuật', 'Hoàng hôn', 'Biển cả']
        tag_objects = {}
        for tname in default_tag_names:
            tag = Tag.query.filter_by(name=tname).first()
            if not tag:
                tag = Tag(name=tname)
                db.session.add(tag)
            tag_objects[tname] = tag
        db.session.commit()

        # Sample albums
        album1 = Album.query.filter_by(name='Hành Trình Khám Phá').first()
        if not album1:
            album1 = Album(
                name='Hành Trình Khám Phá',
                description='Bộ sưu tập các khoảnh khắc du lịch và phong cảnh ấn tượng nhất.',
                is_public=True,
                user_id=demo_user.id
            )
            db.session.add(album1)

        album2 = Album.query.filter_by(name='Kiến Trúc & Đô Thị').first()
        if not album2:
            album2 = Album(
                name='Kiến Trúc & Đô Thị',
                description='Những góc nhìn hiện đại và ánh đèn thành phố về đêm.',
                is_public=True,
                user_id=admin.id
            )
            db.session.add(album2)

        db.session.commit()

        # Check if photos exist
        if Photo.query.count() == 0:
            upload_dir = app.config['UPLOAD_FOLDER']
            thumb_dir = app.config['THUMBNAIL_FOLDER']
            os.makedirs(upload_dir, exist_ok=True)
            os.makedirs(thumb_dir, exist_ok=True)

            sample_photos_data = [
                {
                    'title': 'Hoàng Hôn Trên Biển Hoàng Gia',
                    'desc': 'Khung cảnh hoàng hôn rực rỡ với những dải mây màu cam vàng trải dài vô tận.',
                    'tags': ['Thiên nhiên', 'Hoàng hôn', 'Biển cả'],
                    'album': album1,
                    'user': demo_user,
                    'color': (245, 147, 66),
                    'color2': (200, 70, 30),
                    'views': 125,
                    'downloads': 34,
                    'is_favorite': True
                },
                {
                    'title': 'Ánh Đèn Thành Phố Hiện Đại',
                    'desc': 'Góc nhìn từ trên cao xuống trung tâm tài chính sầm uất lúc chạng vạng.',
                    'tags': ['Đô thị', 'Kiến trúc', 'Nghệ thuật'],
                    'album': album2,
                    'user': admin,
                    'color': (30, 41, 59),
                    'color2': (14, 165, 233),
                    'views': 289,
                    'downloads': 58,
                    'is_favorite': True
                },
                {
                    'title': 'Rừng Thông Trong Sương Sớm',
                    'desc': 'Buổi sáng mộng mơ tại cao nguyên với sương mù bảng lảng len lỏi qua từng tán cây.',
                    'tags': ['Thiên nhiên', 'Du lịch'],
                    'album': album1,
                    'user': demo_user,
                    'color': (45, 85, 60),
                    'color2': (80, 140, 100),
                    'views': 94,
                    'downloads': 19,
                    'is_favorite': False
                },
                {
                    'title': 'Cầu Treo Ánh Kim',
                    'desc': 'Kiến trúc cầu dây văng hiện đại vươn mình qua eo biển lộng gió.',
                    'tags': ['Kiến trúc', 'Đô thị'],
                    'album': album2,
                    'user': admin,
                    'color': (180, 83, 9),
                    'color2': (245, 158, 11),
                    'views': 160,
                    'downloads': 42,
                    'is_favorite': False
                },
                {
                    'title': 'Sóng Biển Vỗ Bờ Đá',
                    'desc': 'Nét đẹp hoang sơ của những mỏm đá ngàn năm giữa biển trời trong xanh.',
                    'tags': ['Biển cả', 'Thiên nhiên', 'Nghệ thuật'],
                    'album': album1,
                    'user': demo_user,
                    'color': (2, 132, 199),
                    'color2': (56, 189, 248),
                    'views': 210,
                    'downloads': 65,
                    'is_favorite': True
                },
                {
                    'title': 'Đại Lộ Ánh Sáng Về Đêm',
                    'desc': 'Vệt sáng của các dòng xe tạo nên những dải lụa phát quang tuyệt đẹp.',
                    'tags': ['Đô thị', 'Nghệ thuật'],
                    'album': album2,
                    'user': admin,
                    'color': (88, 28, 135),
                    'color2': (168, 85, 247),
                    'views': 312,
                    'downloads': 88,
                    'is_favorite': True
                }
            ]

            for i, p_info in enumerate(sample_photos_data):
                # Generate high quality gradient image locally
                width, height = 1200, 800
                img = Image.new('RGB', (width, height))
                draw = ImageDraw.Draw(img)

                # Vertical gradient
                c1 = p_info['color']
                c2 = p_info['color2']
                for y in range(height):
                    ratio = y / float(height)
                    r = int(c1[0] * (1 - ratio) + c2[0] * ratio)
                    g = int(c1[1] * (1 - ratio) + c2[1] * ratio)
                    b = int(c1[2] * (1 - ratio) + c2[2] * ratio)
                    draw.line([(0, y), (width, y)], fill=(r, g, b))

                # Add modern artistic circles / overlay
                draw.ellipse([width//4, height//4, width*3//4, height*3//4], outline=(255, 255, 255, 120), width=3)
                draw.ellipse([width//3, height//3, width*2//3, height*2//3], outline=(255, 255, 255, 60), width=2)

                fname = f"sample_photo_{i+1}.jpg"
                tname = f"thumb_sample_photo_{i+1}.webp"
                fpath = os.path.join(upload_dir, fname)
                tpath = os.path.join(thumb_dir, tname)

                img.save(fpath, 'JPEG', quality=90)
                
                # Make thumbnail
                thumb_img = img.copy()
                thumb_img.thumbnail((500, 500), Image.Resampling.LANCZOS)
                thumb_img.save(tpath, 'WEBP', quality=85)

                photo = Photo(
                    title=p_info['title'],
                    description=p_info['desc'],
                    filename=fname,
                    thumbnail_filename=tname,
                    file_size=os.path.getsize(fpath),
                    width=width,
                    height=height,
                    mime_type='image/jpeg',
                    is_public=True,
                    is_favorite=p_info['is_favorite'],
                    views_count=p_info['views'],
                    downloads_count=p_info['downloads'],
                    user_id=p_info['user'].id,
                    album_id=p_info['album'].id if p_info['album'] else None
                )
                photo.tags = [tag_objects[t] for t in p_info['tags'] if t in tag_objects]
                db.session.add(photo)

            db.session.commit()
            print("Successfully initialized database with admin, user, tags, albums, and sample photos.")
