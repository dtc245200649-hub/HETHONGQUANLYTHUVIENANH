import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  IconLogo, 
  IconSearch, 
  IconUpload, 
  IconSun, 
  IconMoon, 
  IconShield, 
  IconAlbum, 
  IconUser 
} from './Icons';

export const Navbar = ({ 
  searchTerm, 
  setSearchTerm, 
  activeView, 
  setActiveView, 
  onOpenUpload, 
  onOpenAuth 
}) => {
  const { user, logout, theme, toggleTheme, isAdmin } = useAuth();

  return (
    <nav className="navbar">
      <div className="container nav-container">
        {/* Brand */}
        <a 
          href="#gallery" 
          className="brand-logo"
          onClick={(e) => { e.preventDefault(); setActiveView('gallery'); }}
        >
          <div className="brand-icon">
            <IconLogo size={22} />
          </div>
          <span>Gallery<span style={{ color: 'var(--accent-blue)' }}>Pro</span></span>
        </a>

        {/* Global Search Bar */}
        {activeView === 'gallery' && (
          <div className="search-bar">
            <span className="search-icon">
              <IconSearch size={18} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm ảnh theo tên, nhãn tag, tác giả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        )}

        {/* Navigation Actions */}
        <div className="nav-actions">
          <button 
            className={`btn btn-secondary ${activeView === 'gallery' ? 'active' : ''}`}
            onClick={() => setActiveView('gallery')}
            style={{ border: activeView === 'gallery' ? '1px solid var(--accent-blue)' : '' }}
          >
            Ảnh
          </button>

          <button 
            className={`btn btn-secondary ${activeView === 'albums' ? 'active' : ''}`}
            onClick={() => setActiveView('albums')}
            style={{ border: activeView === 'albums' ? '1px solid var(--accent-blue)' : '' }}
          >
            <IconAlbum size={16} />
            Album
          </button>

          {isAdmin && (
            <button 
              className={`btn btn-secondary ${activeView === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveView('admin')}
              style={{ 
                border: activeView === 'admin' ? '1px solid var(--accent-purple)' : '',
                color: activeView === 'admin' ? '#c084fc' : ''
              }}
            >
              <IconShield size={16} />
              Quản Trị
            </button>
          )}

          {/* Upload Button */}
          <button 
            className="btn btn-primary"
            onClick={onOpenUpload}
          >
            <IconUpload size={18} />
            <span>Tải Ảnh Lên</span>
          </button>

          {/* Theme Toggle */}
          <button 
            className="btn-icon" 
            onClick={toggleTheme} 
            title="Đổi giao diện Sáng / Tối"
          >
            {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>

          {/* User Account / Login */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} 
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.username}</span>
                <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                  {user.role}
                </span>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={logout}
              >
                Đăng Xuất
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-secondary"
              onClick={onOpenAuth}
            >
              <IconUser size={16} />
              Đăng Nhập
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
