import React, { useState } from 'react';
import { X, LogIn, UserPlus, Shield, Camera, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal = ({ isOpen, onClose, initialTab = 'login' }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    if (tab === 'login') {
      const res = await login(username, password);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    } else {
      const res = await register(username, email, password, fullName);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    }
    setSubmitting(false);
  };

  const handleQuickLogin = async (userType) => {
    setErrorMsg('');
    setSubmitting(true);
    let u = 'admin';
    let p = 'AdminPassword123!';
    if (userType === 'user') {
      u = 'photographer';
      p = 'UserPassword123!';
    }
    setUsername(u);
    setPassword(p);
    const res = await login(u, p);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: '1rem' }}>
      {/* Pixels Split-Screen Modal Container */}
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          borderRadius: '24px',
          background: '#0d121f',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9)'
        }}
      >
        <style>{`
          @media (max-width: 820px) {
            .pixels-hero-col { display: none !important; }
            .pixels-form-col { width: 100% !important; padding: 2rem 1.5rem !important; }
          }
        `}</style>

        {/* LEFT COLUMN: Artistic Camera Photography Showcase (Pixels style) */}
        <div
          className="pixels-hero-col"
          style={{
            flex: '1.05',
            position: 'relative',
            background: 'url(https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85) center center / cover no-repeat',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '2.5rem',
            overflow: 'hidden'
          }}
        >
          {/* Dark gradient overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(13, 18, 31, 0.3) 0%, rgba(13, 18, 31, 0.85) 100%)',
            zIndex: 1
          }} />

          {/* Top Logo Badge */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#090d16',
              padding: '6px 14px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              <span>PHOTOVAULT</span>
            </div>
          </div>

          {/* Bottom Hero Typography */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              lineHeight: 1.05,
              color: '#ffffff',
              marginBottom: '1rem',
              letterSpacing: '-0.03em'
            }}>
              One <br />
              Pixel At <br />
              A Time.
            </h2>
            <p style={{
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.5,
              maxWidth: '340px'
            }}>
              Quản lý và lưu trữ thư viện ảnh số thông minh, bảo mật và toàn diện.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Modern Minimalist Form */}
        <div
          className="pixels-form-col"
          style={{
            flex: '1',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            background: '#0d121f'
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>

          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px', color: '#ffffff' }}>
            {tab === 'login' ? 'Welcome back' : 'Create an account'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
            {tab === 'login' ? 'Đăng nhập để khám phá và quản lý thư viện của bạn' : 'Bắt đầu trải nghiệm PhotoVault ngay'}
          </p>

          {/* Error Message */}
          {errorMsg && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              marginBottom: '1.25rem'
            }}>
              {errorMsg}
            </div>
          )}

          {/* Quick 1-Click Demo Accounts */}
          {tab === 'login' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Đăng nhập nhanh 1 chạm:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(236, 72, 153, 0.1)',
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                    color: '#f472b6',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Shield size={14} /> Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('user')}
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: '#818cf8',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Camera size={14} /> User
                </button>
              </div>

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '1.25rem 0',
                color: 'var(--text-dim)',
                fontSize: '0.75rem'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hoặc nhập tài khoản</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tab === 'register' && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Họ và tên</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ padding: '0.65rem 0.9rem', fontSize: '0.88rem' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Email</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ padding: '0.65rem 0.9rem', fontSize: '0.88rem' }}
                  />
                </div>
              </>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Tên đăng nhập {tab === 'login' ? 'hoặc Email' : ''}</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ padding: '0.65rem 0.9rem', fontSize: '0.88rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Mật khẩu</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: '0.65rem 0.9rem', fontSize: '0.88rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '10px', fontSize: '0.92rem' }}
            >
              <span>{submitting ? 'Đang xử lý...' : tab === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}</span>
            </button>
          </form>

          {/* Toggle Tab Footer */}
          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            {tab === 'login' ? (
              <span>
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('register'); setErrorMsg(''); }}
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Đăng ký ngay
                </button>
              </span>
            ) : (
              <span>
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('login'); setErrorMsg(''); }}
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Đăng nhập
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
