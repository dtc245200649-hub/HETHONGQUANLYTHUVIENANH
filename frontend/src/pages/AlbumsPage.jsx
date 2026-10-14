import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { IconAlbum, IconTrash, IconEdit, IconCheck } from '../components/Icons';

export const AlbumsPage = ({ onSelectAlbum, onOpenCreateAlbum, refreshTrigger }) => {
  const { user, isAdmin } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const data = await api.getAlbums();
      setAlbums(data.albums || []);
    } catch (err) {
      console.error('Error fetching albums:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, [refreshTrigger]);

  const handleDeleteAlbum = async (e, album) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa album "${album.title}"?`)) return;

    try {
      await api.deleteAlbum(album.id);
      setAlbums(prev => prev.filter(a => a.id !== album.id));
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa album');
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <div className="hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="hero-title">Bộ Sưu Tập & Album</h1>
            <p className="hero-subtitle">
              Phân loại và lưu trữ ảnh theo từng chủ đề, chuyến đi hoặc dự án yêu thích của bạn.
            </p>
          </div>

          {user && (
            <button className="btn btn-primary" onClick={onOpenCreateAlbum}>
              <IconAlbum size={18} />
              <span>Tạo Album Mới</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Đang tải danh sách album...
        </div>
      ) : albums.length > 0 ? (
        <div className="gallery-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {albums.map(album => {
            const canModify = isAdmin || (user && user.id === album.user_id);
            return (
              <div 
                key={album.id} 
                className="image-card glass-panel"
                onClick={() => onSelectAlbum(album)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-img-wrapper" style={{ paddingTop: '60%' }}>
                  {album.cover_url ? (
                    <img src={album.cover_url} alt="" className="card-img" />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: 'var(--text-muted)' }}>
                      <IconAlbum size={48} />
                    </div>
                  )}

                  <div className="card-overlay">
                    <div className="card-actions-top">
                      <span className={`badge ${album.is_public ? 'badge-public' : 'badge-private'}`}>
                        {album.is_public ? 'Công khai' : 'Riêng tư'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                        📁 {album.image_count} bức ảnh
                      </span>
                      {canModify && (
                        <button 
                          className="action-btn-mini" 
                          style={{ background: 'rgba(239, 68, 68, 0.8)' }}
                          title="Xóa Album"
                          onClick={(e) => handleDeleteAlbum(e, album)}
                        >
                          <IconTrash size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {album.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minHeight: '36px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {album.description || 'Chưa có mô tả cho album này.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <span>Tác giả: <strong>{album.author_name || album.author}</strong></span>
                    <span>{new Date(album.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '30px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(129, 140, 248, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)', marginBottom: '16px' }}>
            <IconAlbum size={30} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Chưa có Album nào</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px auto', fontSize: '0.9rem' }}>
            Tạo các bộ sưu tập đầu tiên để gom nhóm các bức ảnh tuyệt đẹp của bạn lại với nhau.
          </p>
          {user && (
            <button className="btn btn-primary" onClick={onOpenCreateAlbum}>
              <IconAlbum size={18} />
              <span>Tạo Album Đầu Tiên</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
