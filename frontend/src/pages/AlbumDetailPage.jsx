import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ImageCard } from '../components/ImageCard';
import { IconAlbum, IconUpload } from '../components/Icons';

export const AlbumDetailPage = ({ albumId, onBack, onImageClick, onOpenUpload }) => {
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAlbumDetail = async () => {
    setLoading(true);
    try {
      const data = await api.getAlbum(albumId);
      setAlbum(data.album);
    } catch (err) {
      console.error('Error fetching album detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (albumId) fetchAlbumDetail();
  }, [albumId]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
        Đang tải thông tin album...
      </div>
    );
  }

  if (!album) {
    return (
      <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
        <p>Không tìm thấy album hoặc bạn không có quyền truy cập.</p>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '16px' }}>
          Quay lại danh sách Album
        </button>
      </div>
    );
  }

  const images = album.images || [];

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <button 
        className="btn btn-secondary" 
        onClick={onBack} 
        style={{ marginTop: '20px', marginBottom: '16px' }}
      >
        ← Quay lại danh sách Album
      </button>

      {/* Album Banner Card */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
            <IconAlbum size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {album.title}
            </h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Tác giả: <strong>{album.author_name || album.author}</strong> • {images.length} bức ảnh
            </div>
          </div>
        </div>

        {album.description && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '800px' }}>
            {album.description}
          </p>
        )}
      </div>

      {/* Album Photos */}
      {images.length > 0 ? (
        <div className="gallery-grid">
          {images.map(img => (
            <ImageCard 
              key={img.id} 
              image={img} 
              onClick={onImageClick} 
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Album này hiện chưa có bức ảnh nào.
          </p>
          <button className="btn btn-primary" onClick={onOpenUpload}>
            <IconUpload size={18} />
            <span>Tải Ảnh Vào Album Này</span>
          </button>
        </div>
      )}
    </div>
  );
};
