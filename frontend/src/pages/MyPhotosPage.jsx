import React, { useState, useEffect } from 'react';
import { Camera, Eye, Download, Upload, Lock, Globe, Heart } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PhotoCard } from '../components/PhotoCard';

export const MyPhotosPage = ({ onSelectPhoto, onOpenUpload, defaultFilter = 'all', refreshTrigger }) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [trashPhotos, setTrashPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState(defaultFilter); // all, public, private, favorite, trash

  const fetchMyPhotos = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [resPhotos, resTrash] = await Promise.all([
        api.getPhotos({ user_id: user.id, per_page: 50 }),
        api.getPhotos({ user_id: user.id, trash: true, per_page: 50 })
      ]);
      if (resPhotos.success) {
        setPhotos(resPhotos.photos || []);
      }
      if (resTrash.success) {
        setTrashPhotos(resTrash.photos || []);
      }
    } catch (err) {
      console.error('Failed to load my photos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPhotos();
  }, [user, refreshTrigger]);

  const totalViews = photos.reduce((acc, p) => acc + (p.views_count || 0), 0);
  const totalDownloads = photos.reduce((acc, p) => acc + (p.downloads_count || 0), 0);

  const filteredPhotos = filterType === 'trash' ? trashPhotos : photos.filter((p) => {
    if (filterType === 'public') return p.is_public;
    if (filterType === 'private') return !p.is_public;
    if (filterType === 'favorite') return p.is_favorite;
    return true;
  });

  return (
    <div>
      {/* Header Profile / Summary */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`}
              alt={user?.username}
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--primary)',
                boxShadow: 'var(--shadow-glow)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{user?.full_name || user?.username}</h2>
                <span className={`badge ${user?.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                  {user?.role}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                @{user?.username} • Đã tham gia {new Date(user?.created_at || Date.now()).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          <button onClick={onOpenUpload} className="btn btn-primary">
            <Upload size={18} />
            <span>Tải Ảnh Mới Lên</span>
          </button>
        </div>

        {/* Quick User Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tổng Ảnh Đã Đăng</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              {photos.length}
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tổng Lượt Xem</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
              {totalViews}
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Lượt Tải Về</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
              {totalDownloads}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: `Tất cả (${photos.length})` },
          { id: 'public', label: `Công khai (${photos.filter(p => p.is_public).length})` },
          { id: 'private', label: `Riêng tư (${photos.filter(p => !p.is_public).length})` },
          { id: 'favorite', label: `Yêu thích (${photos.filter(p => p.is_favorite).length})` },
          { id: 'trash', label: `🗑️ Thùng rác (${trashPhotos.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: filterType === tab.id 
                ? (tab.id === 'trash' ? 'rgba(239, 68, 68, 0.15)' : 'var(--primary-light)') 
                : 'var(--bg-secondary)',
              color: filterType === tab.id 
                ? (tab.id === 'trash' ? '#f87171' : 'var(--primary)') 
                : 'var(--text-muted)',
              border: filterType === tab.id 
                ? (tab.id === 'trash' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)') 
                : '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          Đang tải danh sách ảnh cá nhân...
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <Camera size={36} color="var(--text-dim)" style={{ margin: '0 auto 10px auto' }} />
          <h4>{filterType === 'trash' ? 'Thùng rác trống' : 'Chưa có hình ảnh nào trong mục này'}</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {filterType === 'trash' 
              ? 'Các ảnh đã xóa sẽ tạm thời lưu ở đây trước khi bạn xóa vĩnh viễn.' 
              : 'Nhấn "Tải Ảnh Mới Lên" để lưu giữ khoảnh khắc đầu tiên của bạn.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredPhotos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onClick={() => onSelectPhoto(photo.id, filteredPhotos)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
