import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { GalleryPage } from './pages/GalleryPage';
import { AlbumsPage } from './pages/AlbumsPage';
import { MyPhotosPage } from './pages/MyPhotosPage';
import { AdminPage } from './pages/AdminPage';
import { PhotoModal } from './components/PhotoModal';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { ShieldCheck, Database, Server, Activity, Heart, Camera } from 'lucide-react';

export function App() {
  const { user, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState('gallery'); // gallery, albums, my-photos, admin
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ isOpen: false, tab: 'login' });

  const handleOpenAuth = (tab = 'login') => {
    setAuthModal({ isOpen: true, tab });
  };

  const handlePhotoUpdated = (updatedPhoto) => {
    // Optionally trigger refreshes if needed
  };

  const handlePhotoDeleted = (deletedId) => {
    // Handled
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenUpload={() => setUploadModalOpen(true)}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main View Area */}
      <main className="main-content">
        {currentTab === 'gallery' && (
          <GalleryPage onSelectPhoto={(id) => setSelectedPhotoId(id)} />
        )}

        {currentTab === 'albums' && (
          <AlbumsPage onSelectPhoto={(id) => setSelectedPhotoId(id)} />
        )}

        {currentTab === 'my-photos' && (
          <MyPhotosPage
            onSelectPhoto={(id) => setSelectedPhotoId(id)}
            onOpenUpload={() => setUploadModalOpen(true)}
          />
        )}

        {currentTab === 'admin' && (
          isAdmin ? (
            <AdminPage />
          ) : (
            <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
              <ShieldCheck size={48} color="var(--accent-rose)" style={{ margin: '0 auto 12px auto' }} />
              <h2>Quyền truy cập bị từ chối</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                Trang này chỉ dành riêng cho Quản trị viên (Admin).
              </p>
              <button onClick={() => setCurrentTab('gallery')} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                Quay lại Thư Viện
              </button>
            </div>
          )
        )}
      </main>

      {/* Global Modals */}
      <PhotoModal
        photoId={selectedPhotoId}
        onClose={() => setSelectedPhotoId(null)}
        onPhotoUpdated={handlePhotoUpdated}
        onPhotoDeleted={handlePhotoDeleted}
      />

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={() => {
          // If on gallery or my-photos, let it re-render
        }}
      />

      <AuthModal
        isOpen={authModal.isOpen}
        initialTab={authModal.tab}
        onClose={() => setAuthModal({ isOpen: false, tab: 'login' })}
      />

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '2.5rem 1.5rem',
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem' }}>
              Photo<span className="gradient-text">Vault</span>
            </span>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.78rem',
            color: 'var(--text-dim)'
          }}>
            <span className="badge" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              ⚡ React + Vite
            </span>
            <span className="badge" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              🐍 Python Flask
            </span>
            <span className="badge" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              🐘 PostgreSQL
            </span>
            <span className="badge" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              🌐 Nginx Reverse Proxy
            </span>
            <span className="badge" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              🐳 Docker & Compose
            </span>
            <span className="badge" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              📊 Prometheus + Grafana
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center' }}>
            Đề tài: Xây dựng và triển khai hệ thống thư viện ảnh trực tuyến sử dụng Docker, kết hợp quản trị CSDL, sao lưu và giám sát hệ thống.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
