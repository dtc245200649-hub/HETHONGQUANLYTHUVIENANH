import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { GalleryPage } from './pages/GalleryPage';
import { AlbumsPage } from './pages/AlbumsPage';
import { MyPhotosPage } from './pages/MyPhotosPage';
import { AdminPage } from './pages/AdminPage';
import { PhotoModal } from './components/PhotoModal';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { ShieldCheck } from 'lucide-react';

export function App() {
  const { user, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState('gallery'); // gallery, albums, my-photos, admin, favorites
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ isOpen: false, tab: 'login' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenAuth = (tab = 'login') => {
    setAuthModal({ isOpen: true, tab });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (currentTab !== 'gallery') {
      setCurrentTab('gallery');
    }
  };

  return (
    <div className="app-layout">
      {/* Left Sidebar (Immich & Google Photos Style) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Right Stage */}
      <div className="main-stage">
        {/* Top Header Bar */}
        <TopBar
          search={searchQuery}
          setSearch={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onOpenUpload={() => setUploadModalOpen(true)}
          onOpenAuth={handleOpenAuth}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />

        {/* Dynamic Content Views */}
        <main className="content-wrapper">
          {currentTab === 'gallery' && (
            <GalleryPage 
              onSelectPhoto={(id) => setSelectedPhotoId(id)} 
              searchQuery={searchQuery}
            />
          )}

          {currentTab === 'albums' && (
            <AlbumsPage onSelectPhoto={(id) => setSelectedPhotoId(id)} />
          )}

          {currentTab === 'favorites' && (
            <MyPhotosPage
              onSelectPhoto={(id) => setSelectedPhotoId(id)}
              onOpenUpload={() => setUploadModalOpen(true)}
              defaultFilter="favorite"
            />
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
      </div>

      {/* Lightbox Photo Preview Modal */}
      <PhotoModal
        photoId={selectedPhotoId}
        onClose={() => setSelectedPhotoId(null)}
      />

      {/* Drag & Drop Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />

      {/* Pixels Split-Screen Login & Register Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialTab={authModal.tab}
        onClose={() => setAuthModal({ isOpen: false, tab: 'login' })}
      />
    </div>
  );
}

export default App;
