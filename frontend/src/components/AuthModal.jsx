import React, { useState } from 'react';
import { X, Lock, User, Mail, ShieldAlert, Sparkles, LogIn, UserPlus } from 'lucide-react';
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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setTab('login'); setErrorMsg(''); }}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 700,
                color: tab === 'login' ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                borderBottom: tab === 'login' ? '2px solid var(--primary)' : '2px solid transparent',
                paddingBottom: '4px'
              }}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => { setTab('register'); setErrorMsg(''); }}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 700,
                color: tab === 'register' ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                borderBottom: tab === 'register' ? '2px solid var(--primary)' : '2px solid transparent',
                paddingBottom: '4px'
              }}
            >
              Đăng Ký
            </button>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: 'var(--accent-rose)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                {errorMsg}
              </div>
            )}

            {tab === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Họ và tên</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Tên đăng nhập {tab === 'login' ? 'hoặc Email' : ''}</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu (tối thiểu 6 ký tự)</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
            >
              {tab === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
              <span>{submitting ? 'Đang xử lý...' : tab === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}</span>
            </button>

            {/* Quick Demo Login Presets */}
            {tab === 'login' && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '10px' }}>
                  ⚡ Hoặc đăng nhập nhanh bằng tài khoản mẫu:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin')}
                    disabled={submitting}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', borderColor: 'rgba(236, 72, 153, 0.4)' }}
                  >
                    👑 Admin (Quản trị)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('user')}
                    disabled={submitting}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                  >
                    📸 Photographer (User)
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
