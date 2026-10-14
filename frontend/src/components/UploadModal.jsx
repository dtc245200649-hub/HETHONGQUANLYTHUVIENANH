import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { IconClose, IconUpload, IconCheck } from './Icons';

export const UploadModal = ({ isOpen, onClose, onUploaded, albums = [] }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([]);
      setPreviews([]);
      setTitle('');
      setDescription('');
      setAlbumId('');
      setTags('');
      setIsPublic(true);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setError('Vui lòng chọn tệp định dạng hình ảnh hợp lệ (PNG, JPG, WEBP, GIF, SVG)');
      return;
    }
    setError('');
    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, { file, url: e.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (idx) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Vui lòng chọn ít nhất một hình ảnh để tải lên');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('title', title);
    formData.append('description', description);
    formData.append('is_public', isPublic ? 'true' : 'false');
    if (albumId) formData.append('album_id', albumId);
    if (tags) formData.append('tags', tags);

    try {
      const res = await api.uploadImages(formData);
      if (onUploaded) onUploaded(res.images);
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconUpload size={22} style={{ color: 'var(--accent-blue)' }} />
            <h2 className="modal-title">Tải Ảnh Lên Thư Viện</h2>
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

            {/* Dropzone */}
            <div 
              className={`dropzone ${dragOver ? 'active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                <IconUpload size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Kéo thả ảnh vào đây, hoặc nhấn để chọn tệp
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Hỗ trợ PNG, JPG, JPEG, WEBP, GIF (Tối đa 32MB / ảnh)
                </div>
              </div>
            </div>

            {/* Selected Previews Grid */}
            {previews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px', maxHeight: '160px', overflowY: 'auto', padding: '6px' }}>
                {previews.map((item, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={item.url} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      type="button" 
                      onClick={() => removeFile(idx)}
                      style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <IconClose size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Inputs */}
            <div className="form-group">
              <label className="form-label">Tiêu đề ảnh (tùy chọn nếu tải nhiều ảnh)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="VD: Bình minh trên biển Phú Quốc"
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mô tả ảnh</label>
              <textarea 
                className="form-textarea" 
                placeholder="Nhập mô tả chi tiết, cảm xúc hoặc câu chuyện sau bức ảnh..."
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Chọn Album</label>
                <select 
                  className="form-select" 
                  value={albumId} 
                  onChange={(e) => setAlbumId(e.target.value)}
                >
                  <option value="">-- Không phân album --</option>
                  {albums.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nhãn Tags</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Du lịch, Thiên nhiên, Đẹp..."
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={isPublic} 
                  onChange={(e) => setIsPublic(e.target.checked)} 
                />
                <span>Công khai cho mọi người cùng chiêm ngưỡng (Public)</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={uploading || selectedFiles.length === 0}
            >
              <IconCheck size={16} />
              {uploading ? 'Đang tải lên...' : `Tải lên (${selectedFiles.length})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
