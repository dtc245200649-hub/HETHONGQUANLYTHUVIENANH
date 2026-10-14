import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { IconClose, IconDownload, IconTrash, IconEdit, IconCheck } from './Icons';

export const ImageModal = ({ image, onClose, onUpdated, onDeleted }) => {
  const { user, isAdmin } = useAuth();
  const canModify = isAdmin || (user && user.id === image.user_id);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(image.title);
  const [description, setDescription] = useState(image.description || '');
  const [isPublic, setIsPublic] = useState(image.is_public);
  const [tagsStr, setTagsStr] = useState((image.tags || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!image) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await api.updateImage(image.id, {
        title,
        description,
        is_public: isPublic,
        tags: tagsStr
      });
      setIsEditing(false);
      if (onUpdated) onUpdated(res.image);
    } catch (err) {
      setError(err.message || 'Lỗi khi cập nhật ảnh');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ảnh "${image.title}"?`)) return;
    try {
      await api.deleteImage(image.id);
      onClose();
      if (onDeleted) onDeleted(image.id);
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa ảnh');
    }
  };

  const handleDownload = () => {
    window.open(`/api/images/${image.id}/download`, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content lightbox-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Big Image View */}
        <div className="lightbox-img-pane">
          <img 
            src={image.file_url} 
            alt={image.title} 
            className="lightbox-img" 
          />
        </div>

        {/* Right: Info / Edit Pane */}
        <div className="lightbox-info-pane">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={`badge ${image.is_public ? 'badge-public' : 'badge-private'}`}>
              {image.is_public ? 'Công khai' : 'Riêng tư'}
            </span>
            <button className="btn-icon" onClick={onClose}>
              <IconClose size={18} />
            </button>
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: '6px' }}>
              {error}
            </div>
          )}

          {!isEditing ? (
            <>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {image.title}
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {image.description || 'Không có mô tả cho ảnh này.'}
                </p>
              </div>

              {/* Author Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                {image.author_avatar && (
                  <img src={image.author_avatar} alt="" style={{ width: 38, height: 38, borderRadius: '50%' }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{image.author_name || image.author}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Đăng ngày {new Date(image.created_at).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Specs & Metadata */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Độ phân giải:</span>
                  <span style={{ fontWeight: 600 }}>{image.resolution}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Dung lượng:</span>
                  <span style={{ fontWeight: 600 }}>{image.file_size_formatted}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Định dạng:</span>
                  <span style={{ fontWeight: 600 }}>{image.mime_type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Lượt xem / Tải về:</span>
                  <span style={{ fontWeight: 600 }}>👁️ {image.view_count} • 📥 {image.download_count}</span>
                </div>
                {image.album_title && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Thuộc Album:</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{image.album_title}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {image.tags && image.tags.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    THẺ NHÃN (TAGS)
                  </div>
                  <div className="card-tags">
                    {image.tags.map((t, idx) => (
                      <span key={idx} className="tag-pill">#{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Bottom */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="btn btn-primary" onClick={handleDownload} style={{ width: '100%' }}>
                  <IconDownload size={18} />
                  <span>Tải Ảnh Gốc Về</span>
                </button>

                {canModify && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setIsEditing(true)}
                      style={{ flex: 1 }}
                    >
                      <IconEdit size={16} />
                      Sửa
                    </button>
                    <button 
                      className="btn btn-danger" 
                      onClick={handleDelete}
                      style={{ flex: 1 }}
                    >
                      <IconTrash size={16} />
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Editing form */
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Chỉnh Sửa Thông Tin Ảnh</h3>

              <div className="form-group">
                <label className="form-label">Tiêu đề</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea 
                  className="form-textarea" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nhãn tag (phân cách bằng dấu phẩy)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={tagsStr} 
                  onChange={(e) => setTagsStr(e.target.value)} 
                  placeholder="Thiên nhiên, Du lịch, Hoàng hôn..." 
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input 
                    type="checkbox" 
                    checked={isPublic} 
                    onChange={(e) => setIsPublic(e.target.checked)} 
                  />
                  <span>Đặt ở chế độ Công khai (Public)</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsEditing(false)}
                  style={{ flex: 1 }}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  <IconCheck size={16} />
                  {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
