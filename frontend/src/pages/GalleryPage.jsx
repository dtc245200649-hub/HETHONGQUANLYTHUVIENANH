import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ImageCard } from '../components/ImageCard';
import { IconUpload, IconRefresh } from '../components/Icons';

export const GalleryPage = ({ 
  searchTerm, 
  onImageClick, 
  onOpenUpload, 
  onTagSelected, 
  selectedTag,
  refreshTrigger 
}) => {
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'mine'
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 24,
        sort_by: sortBy
      };
      if (searchTerm) params.search = searchTerm;
      if (selectedTag) params.tag = selectedTag;
      if (filterMode === 'mine' && user) params.only_mine = true;

      const data = await api.getImages(params);
      setImages(data.images || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Error fetching gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const data = await api.getTags();
      setTags(data.tags || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [searchTerm, selectedTag, filterMode, sortBy, page, refreshTrigger]);

  useEffect(() => {
    fetchTags();
  }, [refreshTrigger]);

  const handleDeleteImage = async (imageId) => {
    try {
      await api.deleteImage(imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa ảnh');
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Hero section */}
      <div className="hero">
        <h1 className="hero-title">Khám Phá Thư Viện Ảnh Trực Tuyến</h1>
        <p className="hero-subtitle">
          Nền tảng lưu trữ, quản lý và chia sẻ hình ảnh độ nét cao chuẩn Enterprise. Triển khai Docker, giám sát Prometheus & Grafana.
        </p>

        {/* Filter Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginTop: '12px' }}>
          <div className="tabs">
            <button 
              className={`tab-btn ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => { setFilterMode('all'); setPage(1); }}
            >
              Tất Cả Ảnh
            </button>
            {user && (
              <button 
                className={`tab-btn ${filterMode === 'mine' ? 'active' : ''}`}
                onClick={() => { setFilterMode('mine'); setPage(1); }}
              >
                Ảnh Của Tôi
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sắp xếp:</span>
            <select 
              className="form-select" 
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Mới nhất</option>
              <option value="most_viewed">Xem nhiều nhất</option>
              <option value="most_downloaded">Tải về nhiều nhất</option>
              <option value="size">Dung lượng lớn nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
          </div>
        </div>

        {/* Tag chips bar */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Chủ đề:</span>
            <button 
              className={`tag-pill ${!selectedTag ? 'active' : ''}`}
              onClick={() => onTagSelected('')}
            >
              Tất cả
            </button>
            {tags.slice(0, 10).map(t => (
              <button 
                key={t.id} 
                className={`tag-pill ${selectedTag === t.name ? 'active' : ''}`}
                onClick={() => onTagSelected(selectedTag === t.name ? '' : t.name)}
              >
                #{t.name} ({t.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
            <IconRefresh size={32} />
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.95rem' }}>Đang tải thư viện ảnh...</div>
        </div>
      ) : images.length > 0 ? (
        <>
          <div className="gallery-grid">
            {images.map(img => (
              <ImageCard 
                key={img.id} 
                image={img} 
                onClick={onImageClick}
                onDelete={handleDeleteImage}
                onTagClick={onTagSelected}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '40px' }}>
              <button 
                className="btn btn-secondary" 
                disabled={page <= 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Trang trước
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Trang {page} / {totalPages}
              </span>
              <button 
                className="btn btn-secondary" 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Trang sau
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '30px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', marginBottom: '16px' }}>
            <IconUpload size={30} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Chưa có hình ảnh nào</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px auto', fontSize: '0.9rem' }}>
            {searchTerm || selectedTag ? 'Không tìm thấy ảnh phù hợp với điều kiện lọc.' : 'Hãy là người đầu tiên đăng tải những bức ảnh tuyệt đẹp lên thư viện!'}
          </p>
          <button className="btn btn-primary" onClick={onOpenUpload}>
            <IconUpload size={18} />
            <span>Tải Ảnh Lên Ngay</span>
          </button>
        </div>
      )}
    </div>
  );
};
