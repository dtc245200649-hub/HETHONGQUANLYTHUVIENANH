import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './api/client';
import { Navbar } from './components/Navbar';
import { GalleryPage } from './pages/GalleryPage';
import { AlbumsPage } from './pages/AlbumsPage';
import { AlbumDetailPage } from './pages/AlbumDetailPage';
import { AdminPage } from './pages/AdminPage';
import { ImageModal } from './components/ImageModal';
import { UploadModal } from './components/UploadModal';
import { AlbumModal } from './components/AlbumModal';
import { AuthModal } from './components/AuthModal';

export const App = () => {
  const { user, isAdmin } = useAuth();
  const [activeView, setActiveView] = useState('gallery'); // 'gallery', 'albums', 'album_detail', 'admin'
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Albums cache for upload dropdown
  const [albums, setAlbums] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const reloadData = () => setRefreshTrigger(prev => prev + 1);

  // Fetch albums for upload modal selector
  useEffect(() => {
    api.getAlbums().then(data => setAlbums(data.albums || [])).catch(() => {});
  }, [refreshTrigger]);

  const handleOpenUpload = () => {
    if (!user) {
      setIsAuthOpen(true);
    } else {
      setIsUploadOpen(true);
    }
  };

  const handleSelectAlbum = (album) => {
    setSelectedAlbumId(album.id);
    setActiveView('album_detail');
  };

  return (
    <>
      <Navbar 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeView={activeView}
        setActiveView={(view) => {
          if (view === 'admin' && !isAdmin) {
            setIsAuthOpen(true);
            return;
          }
          setActiveView(view);
        }}
        onOpenUpload={handleOpenUpload}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {activeView === 'gallery' && (
          <GalleryPage 
            searchTerm={searchTerm}
            selectedTag={selectedTag}
            onTagSelected={setSelectedTag}
            onImageClick={(img) => setSelectedImage(img)}
            onOpenUpload={handleOpenUpload}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeView === 'albums' && (
          <AlbumsPage 
            onSelectAlbum={handleSelectAlbum}
            onOpenCreateAlbum={() => setIsAlbumModalOpen(true)}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeView === 'album_detail' && (
          <AlbumDetailPage 
            albumId={selectedAlbumId}
            onBack={() => setActiveView('albums')}
            onImageClick={(img) => setSelectedImage(img)}
            onOpenUpload={handleOpenUpload}
          />
        )}

        {activeView === 'admin' && isAdmin && (
          <AdminPage />
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '28px 0', background: 'var(--bg-secondary)', marginTop: 'auto' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <div>
            © 2026 <strong>Hệ Thống Thư Viện Ảnh Trực Tuyến</strong>. Đồ án hoàn thiện chuẩn Enterprise.
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>🐳 Docker + Docker Compose</span>
            <span>🐘 PostgreSQL 16</span>
            <span>🐍 Python Flask API</span>
            <span>⚡ React + Vite</span>
            <span>🌐 Nginx Reverse Proxy</span>
            <span>📊 Prometheus & Grafana</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ImageModal 
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
        onUpdated={() => { reloadData(); setSelectedImage(null); }}
        onDeleted={() => { reloadData(); setSelectedImage(null); }}
      />

      <UploadModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={() => reloadData()}
        albums={albums}
      />

      <AlbumModal 
        isOpen={isAlbumModalOpen}
        onClose={() => setIsAlbumModalOpen(false)}
        onCreated={() => reloadData()}
      />

      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </>
  );
};
