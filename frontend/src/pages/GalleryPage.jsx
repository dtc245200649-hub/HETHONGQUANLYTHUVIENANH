import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Sparkles, Heart, RefreshCw, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { PhotoCard } from '../components/PhotoCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const GalleryPage = ({ onSelectPhoto }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
        per_page: 18,
        search,
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
  }, [page, activeTag, sortBy, favoritesOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPhotos();
  };

  return (
    <div>
      {/* Hero Header */}
      <div style={{
        textAlign: 'center',
        padding: '3rem 1rem 2rem 1rem',
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--primary-light)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: 'var(--primary)',
          fontSize: '0.82rem',
          fontWeight: 600,
          marginBottom: '1rem'
        }}>
          <Sparkles size={14} />
          <span>Thư viện lưu trữ và chia sẻ ảnh số trực tuyến</span>
        </div>

        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: '2rem',
          letterSpacing: '-0.03em'
        }}>
          Khám Phá Thế Giới Qua Từng <br />
          <span className="gradient-text">Khoảnh Khắc Tuyệt Mỹ</span>
        </h1>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 8px 6px 18px',
            boxShadow: 'var(--shadow-md)',
            transition: 'border-color 0.2s ease'
          }}>
            <Search size={20} color="var(--text-dim)" style={{ marginRight: '10px' }} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, mô tả, thẻ thể loại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                outline: 'none',
                flex: 1
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px', marginRight: '6px' }}
              >
                ×
              </button>
            )}
            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.4rem', borderRadius: 'var(--radius-full)' }}>
              Tìm Kiếm
            </button>
          </div>
        </form>

        {/* Popular Tag Pills */}
        {popularTags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginRight: '4px' }}>Xu hướng:</span>
            <button
              onClick={() => { setActiveTag(''); setPage(1); }}
              style={{
                background: activeTag === '' ? 'var(--primary)' : 'var(--bg-secondary)',
                color: activeTag === '' ? '#ffffff' : 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Tất cả
            </button>
            {popularTags.slice(0, 8).map((tag) => (
              <button
                key={tag.id}
                onClick={() => { setActiveTag(activeTag === tag.name ? '' : tag.name); setPage(1); }}
                style={{
                  background: activeTag === tag.name ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: activeTag === tag.name ? '#ffffff' : 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Control Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '1rem 0',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Hiển thị <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{photos.length}</span> trên tổng số <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{totalPhotos}</span> hình ảnh
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
                padding: '0.5rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                background: favoritesOnly ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-secondary)',
                color: favoritesOnly ? 'var(--accent-rose)' : 'var(--text-muted)',
                border: favoritesOnly ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Heart size={15} fill={favoritesOnly ? 'currentColor' : 'none'} />
              <span>Yêu thích</span>
            </button>
          )}

          {/* Sort selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SlidersHorizontal size={16} color="var(--text-dim)" />
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="form-select"
              style={{ width: 'auto', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
            >
              <option value="newest">Mới nhất</option>
              <option value="popular">Xem nhiều nhất</option>
              <option value="downloads">Lượt tải cao</option>
              <option value="size">Dung lượng lớn</option>
              <option value="oldest">Cũ nhất</option>
            </select>
          </div>

          <button
            onClick={() => fetchPhotos()}
            title="Tải lại danh sách"
            className="btn btn-secondary btn-icon"
            style={{ width: '36px', height: '36px' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
          padding: '1rem 0'
        }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
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
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            color: 'var(--text-dim)'
          }}>
            <ImageIcon size={32} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>Không tìm thấy hình ảnh nào</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Thử thay đổi từ khóa tìm kiếm hoặc chọn thẻ thể loại khác.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem'
        }}>
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onClick={() => onSelectPhoto(photo.id)}
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
            <ChevronLeft size={16} /> Trang trước
          </button>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 8px' }}>
            Trang <strong style={{ color: 'var(--text-main)' }}>{page}</strong> / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="btn btn-secondary btn-sm"
          >
            Trang tiếp <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
