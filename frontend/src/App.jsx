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
  const [photoList, setPhotoList] = useState([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ isOpen: false, tab: 'login' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleSelectPhoto = (id, list = []) => {
    setSelectedPhotoId(id);
    if (list && list.length > 0) {
      setPhotoList(list);
    }
  };

  const currentPhotoIndex = photoList.findIndex(
    (p) => (p?.id !== undefined ? p.id === selectedPhotoId : p === selectedPhotoId)
  );
  const hasPrev = currentPhotoIndex > 0;
  const hasNext = currentPhotoIndex !== -1 && currentPhotoIndex < photoList.length - 1;

  const handlePrevPhoto = () => {
    if (hasPrev) {
      const prev = photoList[currentPhotoIndex - 1];
      setSelectedPhotoId(prev?.id !== undefined ? prev.id : prev);
    }
  };

  const handleNextPhoto = () => {
    if (hasNext) {
      const next = photoList[currentPhotoIndex + 1];
      setSelectedPhotoId(next?.id !== undefined ? next.id : next);
    }
  };

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
              onSelectPhoto={handleSelectPhoto} 
              searchQuery={searchQuery}
              refreshTrigger={refreshKey}
            />
          )}

          {currentTab === 'albums' && (
            <AlbumsPage 
              onSelectPhoto={handleSelectPhoto} 
              refreshTrigger={refreshKey}
            />
          )}

          {currentTab === 'favorites' && (
            <MyPhotosPage
              onSelectPhoto={handleSelectPhoto}
              onOpenUpload={() => setUploadModalOpen(true)}
              defaultFilter="favorite"
              refreshTrigger={refreshKey}
            />
          )}

          {currentTab === 'my-photos' && (
            <MyPhotosPage
              onSelectPhoto={handleSelectPhoto}
              onOpenUpload={() => setUploadModalOpen(true)}
              refreshTrigger={refreshKey}
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
        onPhotoUpdated={triggerRefresh}
        onPhotoDeleted={triggerRefresh}
        onPrev={hasPrev ? handlePrevPhoto : null}
        onNext={hasNext ? handleNextPhoto : null}
      />

      {/* Drag & Drop Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={triggerRefresh}
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
