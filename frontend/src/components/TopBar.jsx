import React, { useState } from 'react';
import { 
  Search, 
  UploadCloud, 
  ShieldCheck, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  SlidersHorizontal,
  FolderHeart,
  Camera,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const TopBar = ({ 
  search, 
  setSearch, 
  onSearchSubmit, 
  onOpenUpload, 
  onOpenAuth, 
  onToggleSidebar,
  currentTab,
  setCurrentTab 
}) => {
  const { user, logout, isAdmin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="top-header">
      {/* Mobile Toggle Button */}
      <button 
        onClick={onToggleSidebar}
        className="btn btn-secondary btn-icon"
        style={{ display: 'none' }}
        id="mobile-menu-btn"
      >
        <Menu size={19} />
      </button>

      <style>{`
        @media (max-width: 900px) {
          #mobile-menu-btn { display: inline-flex !important; }
        }
      `}</style>

      {/* Central Wide Search Box (Immich & Unsplash style) */}
      <form onSubmit={onSearchSubmit} style={{ flex: 1, maxWidth: '680px' }}>
        <div className="search-pill">
          <Search size={18} color="var(--text-dim)" />
          <input 
            type="text" 
            placeholder="Tìm kiếm ảnh, địa điểm, chủ đề hoặc thẻ tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
            >
              ✕
            </button>
          )}
        </div>
      </form>

      {/* Right Action Icons (Upload + Administration + Profile) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Upload Button */}
        {user ? (
          <button 
            onClick={onOpenUpload}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <UploadCloud size={17} />
            <span>Tải lên</span>
          </button>
        ) : (
          <button 
            onClick={() => onOpenAuth('login')}
            className="btn btn-brand"
            style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
          >
            <span>Đăng Nhập</span>
          </button>
        )}

        {/* Administration quick shortcut (Immich top bar style) */}
        {isAdmin && (
          <button
            onClick={() => setCurrentTab('admin')}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 0.95rem',
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={16} color="var(--accent-pink)" />
            <span style={{ display: 'none' }} className="admin-text-label">Quản trị</span>
            <style>{`
              @media (min-width: 600px) {
                .admin-text-label { display: inline !important; }
              }
            `}</style>
          </button>
        )}

        {/* User Avatar & Dropdown */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px'
              }}
            >
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
                alt={user.username}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--border-subtle)'
                }}
              />
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '125%',
                  right: 0,
                  width: '220px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '8px',
                  zIndex: 200,
                  animation: 'scaleIn 0.15s ease'
                }}
              >
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>{user.full_name || user.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>@{user.username} • {user.role}</div>
                </div>

                <button
                  onClick={() => { setCurrentTab('my-photos'); setDropdownOpen(false); }}
                  className="sidebar-link"
                  style={{ fontSize: '0.85rem' }}
                >
                  <Camera size={16} /> Ảnh của tôi
                </button>

                <button
                  onClick={() => { setCurrentTab('albums'); setDropdownOpen(false); }}
                  className="sidebar-link"
                  style={{ fontSize: '0.85rem' }}
                >
                  <FolderHeart size={16} /> Bộ sưu tập
                </button>

                {isAdmin && (
                  <button
                    onClick={() => { setCurrentTab('admin'); setDropdownOpen(false); }}
                    className="sidebar-link"
                    style={{ fontSize: '0.85rem', color: 'var(--accent-pink)' }}
                  >
                    <ShieldCheck size={16} /> Bảng điều khiển quản trị
                  </button>
                )}

                <button
                  onClick={() => { logout(); setDropdownOpen(false); }}
                  className="sidebar-link"
                  style={{ fontSize: '0.85rem', color: 'var(--accent-rose)', borderTop: '1px solid var(--border-subtle)', marginTop: '6px', paddingTop: '8px' }}
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
