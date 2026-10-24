import React, { useState } from 'react';
import { Heart, Download, Eye, Lock, Globe, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const PhotoCard = ({ photo, sortBy, onClick, onFavoriteToggle }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [isFavorite, setIsFavorite] = useState(photo.is_favorite);
  const [favLoading, setFavLoading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) {
      addToast('Vui lòng đăng nhập để lưu ảnh yêu thích', 'info');
      return;
    }
    if (favLoading) return;

    setFavLoading(true);
    try {
      const res = await api.toggleFavorite(photo.id);
      setIsFavorite(res.is_favorite);
      if (res.is_favorite) {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.8 }
        });
      }
      if (onFavoriteToggle) onFavoriteToggle(photo.id, res.is_favorite);
    } catch (err) {
      addToast('Không thể cập nhật mục yêu thích', 'error');
    } finally {
      setFavLoading(false);
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    window.location.href = api.getDownloadUrl(photo.id);
  };

  return (
    <div
      onClick={() => onClick(photo)}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease',
        group: 'true'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
        const overlay = e.currentTarget.querySelector('.card-overlay');
        if (overlay) overlay.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        const overlay = e.currentTarget.querySelector('.card-overlay');
        if (overlay) overlay.style.opacity = '0';
      }}
    >
      {/* Aspect ratio container */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '68%', overflow: 'hidden', background: '#131b2e' }}>
        <img
          src={photo.thumbnail_url || photo.url}
          alt={photo.title}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease, transform 0.5s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
        />

        {/* Loading placeholder skeleton */}
        {!imgLoaded && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #131b2e 25%, #1a253f 50%, #131b2e 75%)',
            backgroundSize: '200% 100%',
            animation: 'pulse 1.5s infinite'
          }} />
        )}

        {/* Privacy Pill & Active Sort Metric Badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {!photo.is_public && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              color: 'var(--accent-amber)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <Lock size={12} /> Riêng tư
            </div>
          )}

          {sortBy === 'popular' && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.85)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              padding: '4px 9px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              <Eye size={12} /> {photo.views_count || 0} lượt xem
            </div>
          )}

          {sortBy === 'downloads' && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.85)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              padding: '4px 9px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              <Download size={12} /> {photo.downloads_count || 0} lượt tải
            </div>
          )}

          {sortBy === 'size' && (
            <div style={{
              background: 'rgba(168, 85, 247, 0.85)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              padding: '4px 9px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              💾 {formatFileSize(photo.file_size)}
            </div>
          )}
        </div>

        {/* Top Right Quick Actions */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10,
          display: 'flex',
          gap: '6px'
        }}>
          <button
            onClick={handleFavorite}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: isFavorite ? 'rgba(244, 63, 94, 0.9)' : 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isFavorite ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <Heart size={16} fill={isFavorite ? '#ffffff' : 'none'} color={isFavorite ? '#ffffff' : 'currentColor'} />
          </button>
        </div>

        {/* Card Hover Overlay with Meta */}
        <div
          className="card-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(10, 14, 23, 0.95) 0%, rgba(10, 14, 23, 0.4) 50%, transparent 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '16px',
            opacity: 0,
            transition: 'opacity 0.25s ease',
            zIndex: 5
          }}
        >
          <h4 style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {photo.title}
          </h4>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--primary)'
              }}>
                {photo.author_name ? photo.author_name[0].toUpperCase() : 'U'}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {photo.author_name}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-dim)' }} title="Lượt xem">
                <Eye size={13} />
                <span>{photo.views_count || 0}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-dim)' }} title="Dung lượng">
                <span>{formatFileSize(photo.file_size)}</span>
              </div>
              <button
                onClick={handleDownload}
                title="Tải ảnh về máy"
                style={{
                  background: 'var(--primary-light)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: 'var(--primary)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                <Download size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-info (Always visible for clean aesthetics) */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {photo.title}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            {photo.album_name ? `📁 ${photo.album_name}` : 'Ảnh đơn'}
          </div>
        </div>

        {/* Resolution badge */}
        {photo.width > 0 && (
          <span style={{
            fontSize: '0.7rem',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)'
          }}>
            {photo.width >= 3840 ? '4K' : photo.width >= 1920 ? 'FHD' : `${photo.width}x${photo.height}`}
          </span>
        )}
      </div>
    </div>
  );
};
