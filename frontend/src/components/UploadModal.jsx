import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Image as ImageIcon, Trash2, CheckCircle2, Lock, Globe, Plus } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [albums, setAlbums] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setPreviews([]);
      setTitle('');
      setDescription('');
      setTags('');
      setAlbumId('');
      setProgress(0);
      return;
    }

    const fetchAlbums = async () => {
      try {
        const res = await api.getAlbums();
        if (res.success && res.albums) {
          setAlbums(res.albums);
        }
      } catch (err) {
        console.error('Failed to fetch albums for upload select', err);
      }
    };
    fetchAlbums();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFilesSelected = (newFiles) => {
    const validImageFiles = Array.from(newFiles).filter((f) => f.type.startsWith('image/'));
    if (validImageFiles.length === 0) {
      addToast('Vui lòng chỉ chọn các tập tin hình ảnh (JPG, PNG, WebP, GIF)', 'error');
      return;
    }

    setFiles((prev) => [...prev, ...validImageFiles]);

    // Generate previews
    const newPreviews = validImageFiles.map((file) => ({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      url: URL.createObjectURL(file)
    }));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      addToast('Vui lòng chọn ít nhất 1 hình ảnh để tải lên', 'error');
      return;
    }

    setUploading(true);
    setProgress(15);

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('is_public', isPublic ? 'true' : 'false');
    if (albumId) formData.append('album_id', albumId);
    if (tags) formData.append('tags', tags);

    // Simulate progress animation
    const interval = setInterval(() => {
      setProgress((p) => (p < 85 ? p + 10 : p));
    }, 150);

    try {
      const res = await api.uploadPhotos(formData);
      clearInterval(interval);
      setProgress(100);

      if (res.success) {
        addToast(res.message || 'Tải ảnh lên thành công!', 'success');
        if (onUploadSuccess) onUploadSuccess(res.uploaded_photos);
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        addToast(res.message || 'Có lỗi xảy ra khi tải ảnh lên', 'error');
      }
    } catch (err) {
      clearInterval(interval);
      addToast(err.message || 'Lỗi kết nối máy chủ khi upload', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Tải Ảnh Lên Thư Viện</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Hỗ trợ JPEG, PNG, WebP, GIF (Tối đa 30MB)</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            {/* Drag and drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragging ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.02)',
                transition: 'all var(--transition-fast)',
                marginBottom: '1.25rem'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) handleFilesSelected(e.target.files);
                }}
              />
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                color: 'var(--primary)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <UploadCloud size={28} />
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                Kéo thả hình ảnh vào đây, hoặc <span style={{ color: 'var(--primary)' }}>chọn từ máy tính</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Có thể chọn nhiều ảnh cùng lúc
              </div>
            </div>

            {/* Selected Previews */}
            {previews.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ảnh đã chọn ({previews.length})</span>
                  <button
                    type="button"
                    onClick={() => { setFiles([]); setPreviews([]); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Xóa tất cả
                  </button>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                  gap: '8px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  padding: '4px'
                }}>
                  {previews.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        aspectRatio: '1',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(244, 63, 94, 0.85)',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata Fields */}
            {files.length === 1 && (
              <div className="form-group">
                <label className="form-label">Tiêu đề ảnh (tùy chọn)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Để trống sẽ dùng tên file gốc"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Mô tả bức ảnh</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Ghi chú câu chuyện hoặc thông tin chụp ảnh..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Bộ Sưu Tập (Album)</label>
                <select
                  className="form-select"
                  value={albumId}
                  onChange={(e) => setAlbumId(e.target.value)}
                >
                  <option value="">Không gán Album</option>
                  {albums.map((alb) => (
                    <option key={alb.id} value={alb.id}>{alb.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Thẻ gắn kết (Tags)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Thiên nhiên, Du lịch, ..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            {/* Privacy Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              marginTop: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isPublic ? <Globe size={20} color="var(--accent-emerald)" /> : <Lock size={20} color="var(--accent-amber)" />}
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    {isPublic ? 'Chế độ Công khai' : 'Chế độ Riêng tư'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {isPublic ? 'Tất cả mọi người đều có thể xem ảnh' : 'Chỉ mình bạn và Quản trị viên nhìn thấy'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className="btn btn-secondary btn-sm"
              >
                Đổi thành {isPublic ? 'Riêng tư' : 'Công khai'}
              </button>
            </div>

            {/* Upload progress */}
            {uploading && (
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>Đang tải lên và xử lý thumbnail chất lượng cao...</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{progress}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'var(--gradient-brand)',
                    transition: 'width 0.2s ease'
                  }} />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="btn btn-secondary"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={uploading || files.length === 0}
              className="btn btn-primary"
            >
              <UploadCloud size={18} />
              <span>{uploading ? 'Đang Tải Lên...' : `Bắt Đầu Tải Lên (${files.length})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
