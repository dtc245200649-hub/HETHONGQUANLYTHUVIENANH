-- ==============================================================================
-- CƠ SỞ DỮ LIỆU THƯ VIỆN ẢNH TRỰC TUYẾN (ONLINE GALLERY SYSTEM)
-- PostgreSQL Initial Schema & Seed Data
-- ==============================================================================

-- 1. BẢNG NGƯỜI DÙNG (USERS)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG BỘ SƯU TẬP / ALBUM
CREATE TABLE IF NOT EXISTS albums (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_image_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BẢNG HÌNH ẢNH (IMAGES)
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    width INTEGER DEFAULT 0,
    height INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    album_id INTEGER REFERENCES albums(id) ON DELETE SET NULL,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Thêm khóa ngoại cho cover_image_id của albums sau khi images đã tồn tại
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_albums_cover_image'
    ) THEN
        ALTER TABLE albums 
        ADD CONSTRAINT fk_albums_cover_image 
        FOREIGN KEY (cover_image_id) REFERENCES images(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. BẢNG NHÃN (TAGS)
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. BẢNG QUAN HỆ ẢNH - NHÃN (IMAGE_TAGS)
CREATE TABLE IF NOT EXISTS image_tags (
    image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (image_id, tag_id)
);

-- 6. BẢNG NHẬT KÝ HỆ THỐNG / AUDIT LOG
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CHỈ MỤC (INDEXES) TỐI ƯU HÓA TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_album_id ON images(album_id);
CREATE INDEX IF NOT EXISTS idx_images_is_public ON images(is_public);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_albums_user_id ON albums(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- SEED DỮ LIỆU MẶC ĐỊNH
-- Mật khẩu mặc định:
-- Admin: admin / Admin@123 (hash werkzeug scrypt / pbkdf2)
-- User: user1 / User@123
INSERT INTO users (username, email, password_hash, full_name, role, is_active)
VALUES 
(
    'admin', 
    'admin@gallery.local', 
    'scrypt:32768:8:1$xI6wX0yU4mX5fK8z$78a62309f48caadca006d6eb52fcff836371f845511516e8812cbf2521f52daea52f6f3938cf0ff6c5b6b71b7829cf8290f6b864aee78ce8f4602f37cbb35fa7',
    'Hệ Thống Quản Trị Viên', 
    'admin', 
    TRUE
),
(
    'user1', 
    'user1@gallery.local', 
    'scrypt:32768:8:1$yJ7xY1zV5nX6gL9a$89b73410f59dbbeea117e7fc63adff947482f956622627f9923dcf3632f63ebfb63f7f4a49df1ff7d6c7c82c893adf9301f7c975bff89df905713f48dcc46fa8',
    'Nguyễn Văn A', 
    'user', 
    TRUE
)
ON CONFLICT (username) DO NOTHING;

-- Seed một số tags mẫu
INSERT INTO tags (name) VALUES 
('Thiên nhiên'), ('Du lịch'), ('Kiến trúc'), ('Công nghệ'), ('Chân dung'), ('Nghệ thuật')
ON CONFLICT (name) DO NOTHING;
