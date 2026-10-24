import React, { useState, useEffect } from 'react';
import { 
  X, Download, Heart, Trash2, Edit3, Calendar, HardDrive, 
  Maximize2, Tag, Folder, Eye, Check, Lock, Globe, 
  ChevronLeft, ChevronRight, RotateCcw, Camera, Aperture 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const PhotoModal = ({ photoId, onClose, onPhotoUpdated, onPhotoDeleted, onPrev, onNext }) => {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editTags, setEditTags] = useState('');
  const [editAlbumId, setEditAlbumId] = useState('auto');
  const [albums, setAlbums] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.getAlbums().then(res => {
      if (res.success) setAlbums(res.albums || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!photoId) return;
    const fetchPhoto = async () => {
      setLoading(true);
      try {
        const res = await api.getPhoto(photoId);
        if (res.success && res.photo) {
          setPhoto(res.photo);
          setEditTitle(res.photo.title);
          setEditDescription(res.photo.description || '');
          setEditIsPublic(res.photo.is_public);
          setEditTags((res.photo.tags || []).join(', '));
          setEditAlbumId(res.photo.album_id ? String(res.photo.album_id) : 'auto');
        }
      } catch (err) {
        addToast(err.message || 'Không thể tải chi tiết ảnh', 'error');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchPhoto();
  }, [photoId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext, onClose]);

  if (!photoId) return null;

  const isOwner = user && photo && (user.id === photo.user_id || isAdmin);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await api.updatePhoto(photo.id, {
        title: editTitle,
        description: editDescription,
        is_public: editIsPublic,
        album_id: editAlbumId,
        tags: editTags.split(',').map((t) => t.trim()).filter(Boolean)
      });
      if (res.success) {
        setPhoto(res.photo);
        setIsEditing(false);
        addToast(res.message || 'Đã cập nhật thông tin ảnh thành công', 'success');
        if (onPhotoUpdated) onPhotoUpdated(res.photo);
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi cập nhật ảnh', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (permanent = false) => {
    const confirmMsg = permanent 
      ? 'Bạn có chắc chắn muốn xóa vĩnh viễn hình ảnh này khỏi thư viện? Hành động này không thể hoàn tác!'
      : 'Chuyển ảnh này vào thùng rác? Bạn có thể khôi phục lại bất kỳ lúc nào.';
    if (!window.confirm(confirmMsg)) return;

    setDeleting(true);
    try {
      const res = await api.deletePhoto(photo.id, permanent);
      if (res.success) {
        addToast(res.message || 'Đã xóa ảnh thành công', 'success');
        if (onPhotoDeleted) onPhotoDeleted(photo.id);
        onClose();
      }
    } catch (err) {
      addToast(err.message || 'Không thể xóa ảnh', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async () => {
    try {
      const res = await api.restorePhoto(photo.id);
      if (res.success) {
        addToast('Đã khôi phục ảnh thành công!', 'success');
        if (onPhotoUpdated) onPhotoUpdated(res.photo);
        onClose();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi khôi phục ảnh', 'error');
    }
  };

  const handleDownload = () => {
    window.location.href = api.getDownloadUrl(photo.id);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: '1rem' }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1200px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'row',
          background: '#0b0f19',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          overflow: 'hidden'
        }}
      >
        <style>{`
          @media (max-width: 900px) {
            .modal-container {
              flex-direction: column !important;
              height: 95vh !important;
            }
            .modal-image-side {
              height: 50% !important;
            }
            .modal-info-side {
              width: 100% !important;
              height: 50% !important;
            }
          }
        `}</style>

        {/* Left Side: Photo Canvas */}
        <div
          className="modal-image-side"
          style={{
            flex: 1,
            background: '#040711',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            padding: '1.5rem'
          }}
        >
          {loading ? (
            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="animate-pulse">Đang tải ảnh chất lượng cao...</div>
            </div>
          ) : (
            <img
              src={photo.url}
              alt={photo.title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)'
              }}
            />
          )}

          {/* Floating Navigation Controls */}
          {onPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              title="Ảnh trước (Phím Mũi Tên Trái)"
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {onNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              title="Ảnh tiếp theo (Phím Mũi Tên Phải)"
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Quick close button on photo on mobile */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border-subtle)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Right Side: Photo Details Drawer */}
        <div
          className="modal-info-side"
          style={{
            width: '380px',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid var(--border-subtle)',
            overflowY: 'auto'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: 'var(--primary)'
              }}>
                {photo?.author_name ? photo.author_name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{photo?.author_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Tác giả</div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content Body */}
          <div style={{ padding: '1.5rem', flex: 1 }}>
            {!isEditing ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                    {photo?.title}
                  </h3>
                  <span className={`badge ${photo?.is_public ? 'badge-public' : 'badge-private'}`}>
                    {photo?.is_public ? <Globe size={12} /> : <Lock size={12} />}
                    {photo?.is_public ? 'Công khai' : 'Riêng tư'}
                  </span>
                </div>

                {photo?.description && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 }}>
                    {photo.description}
                  </p>
                )}

                {/* Primary Download Button */}
                <button
                  onClick={handleDownload}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem' }}
                >
                  <Download size={18} />
                  <span>Tải Ảnh Gốc Về Máy</span>
                </button>

                {/* Technical Specifications */}
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    Thông Số Kỹ Thuật
                  </div>
                  <div style={{
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Maximize2 size={14} /> Độ phân giải
                      </span>
                      <span style={{ fontWeight: 600 }}>{photo?.width} × {photo?.height} px</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <HardDrive size={14} /> Dung lượng
                      </span>
                      <span style={{ fontWeight: 600 }}>{formatFileSize(photo?.file_size)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} /> Ngày tải lên
                      </span>
                      <span style={{ fontWeight: 600 }}>
                        {photo?.created_at ? new Date(photo.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Eye size={14} /> Lượt xem / Lượt tải
                      </span>
                      <span style={{ fontWeight: 600 }}>
                        {photo?.views_count || 0} / {photo?.downloads_count || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Camera & EXIF Specifications */}
                {photo?.exif_data && Object.keys(photo.exif_data).length > 0 && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '10px' }}>
                      Thông Số Máy Ảnh (EXIF)
                    </div>
                    <div style={{
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontSize: '0.82rem'
                    }}>
                      {photo.exif_data.camera && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Camera size={14} color="var(--primary)" /> Thiết bị
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{photo.exif_data.camera}</span>
                        </div>
                      )}
                      {photo.exif_data.lens && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Ống kính</span>
                          <span style={{ fontWeight: 500, fontSize: '0.78rem' }}>{photo.exif_data.lens}</span>
                        </div>
                      )}
                      {(photo.exif_data.aperture || photo.exif_data.shutter_speed || photo.exif_data.iso || photo.exif_data.focal_length) && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '6px',
                          marginTop: '6px',
                          paddingTop: '8px',
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                          textAlign: 'center'
                        }}>
                          {photo.exif_data.focal_length && (
                            <div style={{ background: 'var(--bg-secondary)', padding: '6px 4px', borderRadius: '4px' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Tiêu cự</div>
                              <div style={{ fontWeight: 700 }}>{photo.exif_data.focal_length}</div>
                            </div>
                          )}
                          {photo.exif_data.aperture && (
                            <div style={{ background: 'var(--bg-secondary)', padding: '6px 4px', borderRadius: '4px' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Khẩu độ</div>
                              <div style={{ fontWeight: 700 }}>{photo.exif_data.aperture}</div>
                            </div>
                          )}
                          {photo.exif_data.shutter_speed && (
                            <div style={{ background: 'var(--bg-secondary)', padding: '6px 4px', borderRadius: '4px' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Tốc độ</div>
                              <div style={{ fontWeight: 700 }}>{photo.exif_data.shutter_speed}</div>
                            </div>
                          )}
                          {photo.exif_data.iso && (
                            <div style={{ background: 'var(--bg-secondary)', padding: '6px 4px', borderRadius: '4px' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>ISO</div>
                              <div style={{ fontWeight: 700 }}>{photo.exif_data.iso.replace('ISO ', '')}</div>
                            </div>
                          )}
                        </div>
                      )}
                      {photo.exif_data.date_taken && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                          <span>Ngày chụp gốc:</span>
                          <span>{photo.exif_data.date_taken}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Album info */}
                {photo?.album_name && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      Bộ Sưu Tập
                    </div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--primary)',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}>
                      <Folder size={16} />
                      <span>{photo.album_name}</span>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {photo?.tags && photo.tags.length > 0 && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      Thẻ Phân Loại
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {photo.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-muted)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.78rem'
                          }}
                        >
                          <Tag size={12} /> {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Owner Actions */}
                {isOwner && (
                  <div style={{ marginTop: '2rem', display: 'flex', gap: '10px' }}>
                    {photo?.is_deleted ? (
                      <>
                        <button
                          onClick={handleRestore}
                          className="btn btn-primary"
                          style={{ flex: 1, background: '#10b981', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <RotateCcw size={16} />
                          <span>Khôi Phục Ảnh</span>
                        </button>
                        <button
                          onClick={() => handleDelete(true)}
                          disabled={deleting}
                          className="btn btn-danger"
                          title="Xóa vĩnh viễn khỏi hệ thống"
                          style={{ padding: '0.6rem 1rem' }}
                        >
                          <Trash2 size={16} />
                          <span>Xóa Vĩnh Viễn</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '0.6rem' }}
                        >
                          <Edit3 size={16} />
                          <span>Chỉnh Sửa</span>
                        </button>
                        <button
                          onClick={() => handleDelete(false)}
                          disabled={deleting}
                          className="btn btn-danger"
                          style={{ padding: '0.6rem 1rem' }}
                          title="Chuyển vào thùng rác"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Editing Form */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Chỉnh Sửa Ảnh</div>

                <div className="form-group">
                  <label className="form-label">Tiêu đề ảnh</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Thẻ gắn kết (Tags)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Phân cách bằng dấu phẩy, ví dụ: Thiên nhiên, Hoàng hôn"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Bộ Sưu Tập (Album)
                    <span style={{ fontSize: '0.72rem', color: '#10b981', marginLeft: '6px', fontWeight: 600 }}>
                      ✨ Tự động theo Thẻ
                    </span>
                  </label>
                  <select
                    className="form-select"
                    value={editAlbumId}
                    onChange={(e) => setEditAlbumId(e.target.value)}
                    style={editAlbumId === 'auto' ? { borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.05)' } : {}}
                  >
                    <option value="auto">✨ [Tự động] Nhận diện theo thẻ tag & từ khóa</option>
                    <option value="">Không gán Album</option>
                    {albums.map((alb) => (
                      <option key={alb.id} value={String(alb.id)}>{alb.name}</option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Nhập thẻ (ví dụ: Anime, Thiên nhiên, ...) hệ thống sẽ tự động chuyển vào album trùng khớp.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    id="edit-is-public"
                    checked={editIsPublic}
                    onChange={(e) => setEditIsPublic(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="edit-is-public" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                    Công khai cho mọi người xem
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    <Check size={16} />
                    <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn btn-secondary"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
