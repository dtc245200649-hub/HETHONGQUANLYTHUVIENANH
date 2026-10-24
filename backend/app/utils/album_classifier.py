import re
from datetime import datetime
from ..models import Album

# Semantic category dictionary mapping common photography themes to keywords
CATEGORY_MAPPINGS = {
    'Thiên nhiên': [
        'thiên nhiên', 'thien nhien', 'phong cảnh', 'phong canh', 'nature', 'landscape',
        'forest', 'rừng', 'rung', 'núi', 'nui', 'mountain', 'hill', 'biển', 'bien', 'beach', 'ocean', 'sea',
        'sunset', 'hoàng hôn', 'hoang hon', 'sunrise', 'bình minh', 'binh minh',
        'hoa', 'flower', 'cây', 'cay', 'tree', 'vườn', 'vuon', 'garden', 'trời', 'troi', 'sky', 'mây', 'may', 'cloud',
        'thác', 'thac', 'waterfall', 'hồ', 'ho', 'lake', 'sông', 'song', 'river'
    ],
    'Kiến trúc & Đô thị': [
        'kiến trúc', 'kien truc', 'đô thị', 'do thi', 'thành phố', 'thanh pho', 'city',
        'building', 'tòa nhà', 'toa nha', 'street', 'đường phố', 'duong pho', 'cầu', 'cau', 'bridge',
        'nhà thờ', 'nha tho', 'chùa', 'chua', 'temple', 'church', 'tower', 'tháp', 'thap', 'urban', 'architecture',
        'nội thất', 'noi that', 'interior', 'cao ốc', 'cao oc', 'chung cư', 'chung cu'
    ],
    'Du lịch & Khám phá': [
        'du lịch', 'du lich', 'hành trình', 'hanh trinh', 'khám phá', 'kham pha', 'chuyến đi',
        'chuyen di', 'trip', 'travel', 'tour', 'vacation', 'holiday', 'đà lạt', 'da lat',
        'hà nội', 'ha noi', 'sài gòn', 'sai gon', 'đà nẵng', 'da nang', 'nha trang',
        'phú quốc', 'phu quoc', 'sapa', 'hạ long', 'ha long', 'vũng tàu', 'vung tau',
        'bali', 'japan', 'korea', 'thái lan', 'bản đồ', 'resort', 'hotel', 'khách sạn'
    ],
    'Chân dung & Con người': [
        'chân dung', 'chan dung', 'portrait', 'people', 'con người', 'con nguoi', 'selfie',
        'bạn bè', 'ban be', 'friend', 'gia đình', 'gia dinh', 'family', 'cô gái', 'co gai',
        'chàng trai', 'chang trai', 'baby', 'em bé', 'em be', 'trẻ em', 'tre em', 'nụ cười', 'nu cuoi', 'smile',
        'sinh nhật', 'sinh nhat', 'birthday', 'kỷ niệm', 'ky niem', 'party', 'tiệc'
    ],
    'Ẩm thực': [
        'ẩm thực', 'am thuc', 'món ăn', 'mon an', 'food', 'ăn uống', 'an uong', 'cafe',
        'cà phê', 'ca phe', 'coffee', 'trà', 'tra', 'tea', 'nhà hàng', 'nha hang', 'restaurant', 'nấu ăn',
        'cooking', 'bánh', 'banh', 'cake', 'bún', 'bun', 'phở', 'pho', 'cơm', 'com'
    ],
    'Động vật & Thú cưng': [
        'động vật', 'dong vat', 'thú cưng', 'thu cung', 'chó', 'cho', 'mèo', 'meo', 'dog',
        'cat', 'pet', 'animal', 'chim', 'bird', 'cá', 'ca', 'fish', 'hoang dã', 'wildlife'
    ],
    'Nghệ thuật & Trừu tượng': [
        'nghệ thuật', 'nghe thuat', 'art', 'trừu tượng', 'truu tuong', 'abstract', 'đen trắng',
        'den trang', 'black and white', 'monochrome', 'vintage', 'retro', 'minimalist',
        'tối giản', 'toi gian'
    ],
    'Anime & Hoạt hình': [
        'anime', 'manga', 'hoạt hình', 'hoat hinh', 'cartoon', 'comic', 'truyện tranh',
        'truyen tranh', 'chibi', 'cosplay', 'jujutsu', 'kaisen', 'naruto', 'one piece',
        'dragon ball', 'conan', 'bleach', 'attack on titan', 'demon slayer', 'otaku'
    ]
}

def normalize_text(text):
    if not text:
        return ""
    text = str(text).lower()
    text = re.sub(r'[_\-.,;:!?/\\()\[\]{}"]', ' ', text)
    return ' '.join(text.split())

def match_photo_to_album(user_id, title="", filename="", description="", tags=None, exif_data=None):
    """
    Intelligently match photo metadata to the most appropriate album.
    Returns matched Album instance or None.
    """
    tags = tags or []
    exif_data = exif_data or {}

    user_albums = Album.query.filter(
        (Album.user_id == user_id) | (Album.is_public == True)
    ).all()

    if not user_albums:
        user_albums = Album.query.all()

    if not user_albums:
        return None

    photo_corpus = f"{title} {filename} {description} {' '.join(tags)}"
    norm_photo = normalize_text(photo_corpus)

    date_taken = exif_data.get('date_taken', '')
    exif_year = ''
    if date_taken:
        match = re.search(r'\b(20\d{2})\b', date_taken)
        if match:
            exif_year = match.group(1)

    best_album = None
    best_score = 0

    for album in user_albums:
        score = 0
        norm_album_name = normalize_text(album.name)
        norm_album_desc = normalize_text(album.description or "")

        # A. Direct tag exact & partial matching (Top Priority)
        for t in tags:
            norm_t = normalize_text(t)
            if not norm_t:
                continue
            if norm_t == norm_album_name:
                score += 80  # Decisive exact tag match (e.g. tag 'anime' == album 'Anime')
            elif norm_t in norm_album_name or norm_album_name in norm_t:
                score += 40
            if norm_t in norm_album_desc:
                score += 15

        # B. Direct word / phrase matching with Album name
        album_words = [w for w in norm_album_name.split() if len(w) > 2]
        for w in album_words:
            if w in norm_photo:
                score += 15

        if norm_album_name and norm_album_name in norm_photo:
            score += 35

        # C. Year matching with EXIF date
        if exif_year:
            if exif_year in norm_album_name:
                score += 25
            if f"năm {exif_year}" in norm_album_name or f"nam {exif_year}" in norm_album_name:
                score += 35

        # D. Category Semantic Synonyms matching
        for cat_name, keywords in CATEGORY_MAPPINGS.items():
            album_belongs_to_cat = any(kw in norm_album_name or kw in norm_album_desc for kw in keywords)
            if album_belongs_to_cat:
                matched_kws = sum(
                    1 for kw in keywords 
                    if f" {kw} " in f" {norm_photo} " or norm_photo.startswith(f"{kw} ") or norm_photo.endswith(f" {kw}")
                )
                if matched_kws > 0:
                    score += matched_kws * 12

        # Give slight preference to user's own album
        if album.user_id == user_id:
            score += 5

        if score > best_score:
            best_score = score
            best_album = album

    # Confidence threshold
    if best_score >= 12:
        return best_album

    return None
