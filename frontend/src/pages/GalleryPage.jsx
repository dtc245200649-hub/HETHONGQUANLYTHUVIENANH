import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Heart, RefreshCw, ChevronLeft, ChevronRight, Image as ImageIcon, Flame, Folder } from 'lucide-react';
import { PhotoCard } from '../components/PhotoCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const GalleryPage = ({ onSelectPhoto, searchQuery = '', refreshTrigger }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('');
  const [popularTags, setPopularTags] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPhotos, setTotalPhotos] = useState(0);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await api.getPhotos({
        page,
        per_page: 24,
        search: searchQuery,
        tag: activeTag,
        sort: sortBy,
        favorite: favoritesOnly
      });
      if (res.success) {
        setPhotos(res.photos || []);
        setTotalPages(res.pages || 1);
        setTotalPhotos(res.total || 0);
      }
    } catch (err) {
      console.error('Error fetching photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await api.getPopularTags();
      if (res.success && res.tags) {
        setPopularTags(res.tags);
      }
    } catch (err) {
      console.warn('Failed to load tags:', err);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [page, activeTag, sortBy, favoritesOnly, searchQuery, refreshTrigger]);

  return (
    <div>
      {/* Immich / Unsplash Category Bar */}
      <div className="category-scroller">
        <button
          onClick={() => { setActiveTag(''); setPage(1); }}
          className={`category-chip ${activeTag === '' ? 'active' : ''}`}
        >
          Tất cả ảnh
        </button>
        {popularTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => { setActiveTag(activeTag === tag.name ? '' : tag.name); setPage(1); }}
            className={`category-chip ${activeTag === tag.name ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            {tag.is_album ? <Folder size={13} style={{ opacity: 0.85 }} /> : <span style={{ opacity: 0.6 }}>#</span>}
            <span>{tag.name}</span>
          </button>
        ))}
      </div>

      {/* Timeline Section Header & Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff' }}>
            {activeTag ? `Chủ đề / Album: ${activeTag}` : searchQuery ? `Kết quả: "${searchQuery}"` : 'Tất cả hình ảnh'}
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            Hiển thị {photos.length} trên tổng số {totalPhotos} ảnh
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Favorite toggle */}
          {user && (
            <button
              onClick={() => { setFavoritesOnly(!favoritesOnly); setPage(1); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                background: favoritesOnly ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-secondary)',
                color: favoritesOnly ? 'var(--accent-rose)' : 'var(--text-muted)',
                border: favoritesOnly ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Heart size={14} fill={favoritesOnly ? 'currentColor' : 'none'} />
              <span>Yêu thích</span>
            </button>
          )}

          {/* Sort selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SlidersHorizontal size={15} color="var(--text-dim)" />
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.82rem', borderRadius: 'var(--radius-full)' }}
            >
              <option value="newest">Mới nhất</option>
              <option value="popular">Xem nhiều</option>
              <option value="downloads">Lượt tải</option>
              <option value="size">Dung lượng</option>
              <option value="oldest">Cũ nhất</option>
            </select>
          </div>

          <button
            onClick={() => fetchPhotos()}
            title="Tải lại"
            className="btn btn-secondary btn-icon"
            style={{ width: '34px', height: '34px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Immich / Google Photos Grid */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              style={{
                borderRadius: 'var(--radius-lg)',
                aspectRatio: '4/3',
                background: 'var(--bg-secondary)',
                animation: 'pulse 1.5s infinite'
              }}
            />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 1rem',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border-subtle)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            color: 'var(--text-dim)'
          }}>
            <ImageIcon size={28} />
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Không tìm thấy hình ảnh nào</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Thử chọn danh mục khác hoặc xóa bộ lọc tìm kiếm.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              sortBy={sortBy}
              onClick={() => onSelectPhoto(photo.id, photos)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '2rem' }}>
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="btn btn-secondary btn-sm"
          >
            <ChevronLeft size={16} /> Trước
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 8px' }}>
            Trang <strong style={{ color: 'var(--text-main)' }}>{page}</strong> / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="btn btn-secondary btn-sm"
          >
            Sau <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
