import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { IconClose, IconAlbum, IconCheck } from './Icons';

export const AlbumModal = ({ isOpen, onClose, onCreated, albumToEdit = null }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (albumToEdit) {
      setTitle(albumToEdit.title);
      setDescription(albumToEdit.description || '');
      setIsPublic(albumToEdit.is_public);
    } else {
      setTitle('');
      setDescription('');
      setIsPublic(true);
    }
    setError('');
  }, [isOpen, albumToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên album');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (albumToEdit) {
        const res = await api.updateAlbum(albumToEdit.id, {
          title: title.trim(),
          description: description.trim(),
          is_public: isPublic
        });
        if (onCreated) onCreated(res.album);
      } else {
        const res = await api.createAlbum({
          title: title.trim(),
          description: description.trim(),
          is_public: isPublic
        });
        if (onCreated) onCreated(res.album);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu album');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconAlbum size={22} style={{ color: 'var(--accent-blue)' }} />
            <h2 className="modal-title">
              {albumToEdit ? 'Chỉnh Sửa Album' : 'Tạo Bộ Sưu Tập Mới'}
            </h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <IconClose size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ color: 'var(--danger)', fontSize: '0.85rem', background: 'var(--danger-bg)', padding: '10px 14px', borderRadius: '8px' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Tên Album / Bộ sưu tập</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="VD: Chuyến du lịch Sapa 2026..."
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mô tả Album</label>
              <textarea 
                className="form-textarea" 
                placeholder="Ghi chú câu chuyện hoặc chủ đề của bộ sưu tập này..."
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={isPublic} 
                  onChange={(e) => setIsPublic(e.target.checked)} 
                />
                <span>Công khai album cho mọi người cùng xem</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <IconCheck size={16} />
              {loading ? 'Đang lưu...' : (albumToEdit ? 'Cập Nhật' : 'Tạo Album')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
