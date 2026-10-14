import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Compass, 
  Heart, 
  FolderHeart, 
  Camera, 
  ShieldCheck, 
  HardDrive, 
  Cloud, 
  Server,
  Layers,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Sidebar = ({ currentTab, setCurrentTab, isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({ storage_mb: 0 });

  useEffect(() => {
    // Optionally fetch live storage for sidebar widget
    const loadStats = async () => {
      try {
        if (isAdmin) {
          const res = await api.getAdminStats();
          if (res.success && res.stats) {
            setStats(res.stats);
          }
        }
      } catch (e) {
        // quiet
      }
    };
    loadStats();
  }, [isAdmin, currentTab]);

  const navPrimary = [
    { id: 'gallery', label: 'Ảnh (Photos)', icon: ImageIcon },
    { id: 'albums', label: 'Bộ Sưu Tập (Albums)', icon: FolderHeart },
    ...(user ? [{ id: 'favorites', label: 'Yêu Thích (Favorites)', icon: Heart }] : []),
  ];

  const navLibrary = [
    ...(user ? [{ id: 'my-photos', label: 'Ảnh Của Tôi (Library)', icon: Camera }] : []),
  ];

  const navAdmin = [
    ...(isAdmin ? [{ id: 'admin', label: 'Quản Trị (Administration)', icon: ShieldCheck, badge: 'Admin' }] : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            zIndex: 85,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header (Immich / Google Photos style) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.25rem 0.5rem 1.25rem 0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '0.75rem'
        }}>
          <div 
            onClick={() => { setCurrentTab('gallery'); if (onClose) onClose(); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            {/* Immich Pinwheel Style Icon */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #ec4899 50%, #f59e0b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
            }}>
              <Layers size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1
              }}>
                Photo<span className="gradient-text">Vault</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Self-Hosted Gallery
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="btn btn-secondary btn-icon"
            style={{ width: '32px', height: '32px', display: 'none' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
          {navPrimary.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setCurrentTab(item.id); if (onClose) onClose(); }}
                className={`sidebar-link ${active ? 'active' : ''}`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Library Section */}
          {user && (
            <>
              <div className="sidebar-heading">Thư Viện Cá Nhân</div>
              {navLibrary.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setCurrentTab(item.id); if (onClose) onClose(); }}
                    className={`sidebar-link ${active ? 'active' : ''}`}
                  >
                    <Icon size={19} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="sidebar-heading">Quản Trị Hệ Thống</div>
              {navAdmin.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setCurrentTab(item.id); if (onClose) onClose(); }}
                    className={`sidebar-link ${active ? 'active' : ''}`}
                  >
                    <Icon size={19} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="badge badge-admin" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Bottom Storage & Server Status Widget (Google Photos / Immich style) */}
        <div className="storage-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cloud size={15} color="var(--primary)" />
              <span>Dung lượng lưu trữ</span>
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {stats.storage_mb > 0 ? `${stats.storage_mb} MB` : 'Sẵn sàng'}
            </span>
          </div>

          <div style={{
            height: '5px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            marginBottom: '10px'
          }}>
            <div style={{
              width: `${Math.min(Math.max((stats.storage_mb || 2) * 5, 12), 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
              borderRadius: 'var(--radius-full)'
            }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-emerald)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }} />
              Server Online
            </span>
            <span style={{ color: 'var(--text-dim)' }}>Docker v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
