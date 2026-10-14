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
import { ShieldCheck } from 'lucide-react';

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


    </div>
  );
}

export default App;
