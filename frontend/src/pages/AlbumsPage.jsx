import React, { useState, useEffect } from 'react';
import { FolderPlus, Folder, Image as ImageIcon, Plus, X, Lock, Globe, Download, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PhotoCard } from '../components/PhotoCard';

export const AlbumsPage = ({ onSelectPhoto, refreshTrigger }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  // Create album state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [albumIsPublic, setAlbumIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const res = await api.getAlbums();
      if (res.success && res.albums) {
        setAlbums(res.albums);
      }
    } catch (err) {
      console.error('Failed to load albums:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, [refreshTrigger]);

  const openAlbum = async (album) => {
    setSelectedAlbum(album);
    setPhotosLoading(true);
    try {
      const res = await api.getAlbum(album.id);
      if (res.success && res.album) {
        setAlbumPhotos(res.album.photos || []);
      }
    } catch (err) {
      addToast('Không thể tải ảnh trong album này', 'error');
    } finally {
      setPhotosLoading(false);
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!albumName.trim()) {
      addToast('Vui lòng nhập tên bộ sưu tập', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await api.createAlbum({
        name: albumName.trim(),
        description: albumDesc.trim(),
        is_public: albumIsPublic
      });
      if (res.success) {
        addToast('Đã tạo bộ sưu tập mới thành công!', 'success');
        setCreateModalOpen(false);
        setAlbumName('');
        setAlbumDesc('');
        fetchAlbums();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi tạo album', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlbum = async (albumId, albumName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bộ sưu tập "${albumName}"?\n(Các hình ảnh trong album sẽ không bị xóa mà chỉ được gỡ liên kết khỏi album này)`)) {
      return;
    }
    try {
      const res = await api.deleteAlbum(albumId);
      if (res.success) {
        addToast(`Đã xóa bộ sưu tập "${albumName}" thành công!`, 'success');
        if (selectedAlbum && selectedAlbum.id === albumId) {
          setSelectedAlbum(null);
        }
        await fetchAlbums();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi xóa bộ sưu tập', 'error');
    }
  };

  return (
    <div>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '2rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {selectedAlbum ? selectedAlbum.name : 'Bộ Sưu Tập (Albums)'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {selectedAlbum
              ? (selectedAlbum.description || 'Các bức ảnh nằm trong bộ sưu tập này')
              : 'Tổ chức và gom nhóm ảnh theo từng chủ đề hoặc sự kiện đặc biệt.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {selectedAlbum ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {albumPhotos.length > 0 && (
                <a
                  href={api.getAlbumDownloadUrl(selectedAlbum.id)}
                  download
                  className="btn btn-primary"
                  title="Tải toàn bộ hình ảnh trong album dưới dạng tệp nén .ZIP"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={16} />
                  <span>Tải trọn bộ Album (.zip)</span>
                </a>
              )}
              {user && (user.id === selectedAlbum.user_id || user.role === 'admin') && (
                <button
                  onClick={() => handleDeleteAlbum(selectedAlbum.id, selectedAlbum.name)}
                  className="btn btn-danger"
                  title="Xóa bộ sưu tập này"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={16} />
                  <span>Xóa Album</span>
                </button>
              )}
              <button onClick={() => setSelectedAlbum(null)} className="btn btn-secondary">
                ← Quay lại danh sách Albums
              </button>
            </div>
          ) : user ? (
            <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary">
              <FolderPlus size={18} />
              <span>Tạo Album Mới</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Album Detail view */}
      {selectedAlbum ? (
        <div>
          {photosLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              Đang tải ảnh trong album...
            </div>
          ) : albumPhotos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-subtle)'
            }}>
              <ImageIcon size={36} color="var(--text-dim)" style={{ margin: '0 auto 10px auto' }} />
              <h4>Chưa có hình ảnh nào trong album này</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Khi tải ảnh lên, bạn có thể chọn gán ảnh vào album "{selectedAlbum.name}".
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: '1.5rem'
            }}>
              {albumPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onClick={() => onSelectPhoto(photo.id, albumPhotos)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Albums Grid */
        loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{ height: '220px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <Folder size={40} color="var(--text-dim)" style={{ margin: '0 auto 12px auto' }} />
            <h4>Chưa có bộ sưu tập nào được tạo</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Hãy nhấn nút "Tạo Album Mới" để bắt đầu nhóm các hình ảnh lại với nhau.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() => openAlbum(album)}
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.25s ease, border-color 0.25s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                {/* Visual Cover image */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '180px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: '#131b2e',
                  marginBottom: '1rem'
                }}>
                  {album.cover_image_url ? (
                    <img
                      src={album.cover_image_url}
                      alt={album.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.15))'
                    }}>
                      <Folder size={44} color="var(--primary)" />
                    </div>
                  )}

                  <span style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {album.photos_count || 0} ảnh
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{album.name}</h3>
                  <span className={`badge ${album.is_public ? 'badge-public' : 'badge-private'}`}>
                    {album.is_public ? <Globe size={11} /> : <Lock size={11} />}
                    {album.is_public ? 'Công khai' : 'Riêng tư'}
                  </span>
                </div>

                {album.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
                    {album.description}
                  </p>
                )}

                <div style={{
                  marginTop: 'auto',
                  paddingTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)'
                }}>
                  <span>Tạo bởi: {album.author_name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{new Date(album.created_at).toLocaleDateString('vi-VN')}</span>
                    {user && (user.id === album.user_id || user.role === 'admin') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAlbum(album.id, album.name);
                        }}
                        title="Xóa bộ sưu tập này"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Create Album Modal */}
      {createModalOpen && (
        <div className="modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tạo Bộ Sưu Tập Mới</h3>
              <button onClick={() => setCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateAlbum}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên Album</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="ví dụ: Kỷ niệm Đà Lạt 2026"
                    value={albumName}
                    onChange={(e) => setAlbumName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả ngắn</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Giới thiệu về nội dung bộ sưu tập..."
                    value={albumDesc}
                    onChange={(e) => setAlbumDesc(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    id="album-public"
                    checked={albumIsPublic}
                    onChange={(e) => setAlbumIsPublic(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="album-public" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                    Công khai cho mọi người cùng xem
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  <span>{creating ? 'Đang tạo...' : 'Tạo Album'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
