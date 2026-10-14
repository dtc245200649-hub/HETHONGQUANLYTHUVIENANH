import React from 'react';
import { useAuth } from '../context/AuthContext';
import { IconEye, IconDownload, IconTrash, IconEdit } from './Icons';

export const ImageCard = ({ image, onClick, onDelete, onTagClick }) => {
  const { user, isAdmin } = useAuth();
  const canModify = isAdmin || (user && user.id === image.user_id);

  const handleDownload = (e) => {
    e.stopPropagation();
    window.open(`/api/images/${image.id}/download`, '_blank');
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc chắn muốn xóa ảnh "${image.title}"?`)) {
      onDelete(image.id);
    }
  };

  return (
    <div className="image-card" onClick={() => onClick(image)}>
      <div className="card-img-wrapper">
        <img 
          src={image.file_url} 
          alt={image.title} 
          className="card-img" 
          loading="lazy" 
        />
        
        {/* Hover overlay with action buttons */}
        <div className="card-overlay">
          <div className="card-actions-top">
            <span className={`badge ${image.is_public ? 'badge-public' : 'badge-private'}`}>
              {image.is_public ? 'Công khai' : 'Riêng tư'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
              {image.resolution} • {image.file_size_formatted}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                className="action-btn-mini" 
                title="Tải về" 
                onClick={handleDownload}
              >
                <IconDownload size={15} />
              </button>
              {canModify && (
                <button 
                  className="action-btn-mini" 
                  title="Xóa ảnh" 
                  onClick={handleDelete}
                  style={{ background: 'rgba(239, 68, 68, 0.8)' }}
                >
                  <IconTrash size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="card-title" title={image.title}>
          {image.title}
        </div>

        <div className="card-meta">
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {image.author_avatar && (
              <img 
                src={image.author_avatar} 
                alt="" 
                style={{ width: 18, height: 18, borderRadius: '50%' }} 
              />
            )}
            <span>{image.author_name || image.author}</span>
          </span>
          <span>👁️ {image.view_count}</span>
        </div>

        {image.tags && image.tags.length > 0 && (
          <div className="card-tags">
            {image.tags.slice(0, 3).map((tag, idx) => (
              <span 
                key={idx} 
                className="tag-pill"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onTagClick) onTagClick(tag);
                }}
              >
                #{tag}
              </span>
            ))}
            {image.tags.length > 3 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                +{image.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
