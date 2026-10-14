import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { IconClose, IconUser, IconShield } from './Icons';

export const AuthModal = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' or 'register'

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (tab === 'login') {
        await login(username, password);
      } else {
        await register(username, email, password, fullName);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi xác thực');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (u, p) => {
    setLoading(true);
    setError('');
    try {
      await login(u, p);
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi đăng nhập nhanh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button"
              className={`btn btn-secondary ${tab === 'login' ? 'active' : ''}`}
              style={{ background: tab === 'login' ? 'var(--accent-blue)' : '', color: tab === 'login' ? '#000' : '' }}
              onClick={() => { setTab('login'); setError(''); }}
            >
              Đăng Nhập
            </button>
            <button 
              type="button"
              className={`btn btn-secondary ${tab === 'register' ? 'active' : ''}`}
              style={{ background: tab === 'register' ? 'var(--accent-blue)' : '', color: tab === 'register' ? '#000' : '' }}
              onClick={() => { setTab('register'); setError(''); }}
            >
              Đăng Ký
            </button>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <IconClose size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{ color: 'var(--danger)', fontSize: '0.85rem', background: 'var(--danger-bg)', padding: '10px 14px', borderRadius: '8px' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Tên đăng nhập</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="VD: admin hoặc user1"
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {tab === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Họ và tên</label>
                  <input 
                    type="text" 
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
                    className="form-input" 
                    placeholder="email@example.com"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%', marginTop: '6px' }}
            >
              {loading ? 'Đang xử lý...' : (tab === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản')}
            </button>

            {/* Quick Demo Login Helpers */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase' }}>
                Đăng nhập nhanh để trải nghiệm
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.8rem', padding: '8px' }}
                  onClick={() => quickLogin('admin', 'Admin@123')}
                >
                  <IconShield size={14} style={{ color: '#c084fc' }} />
                  Admin
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.8rem', padding: '8px' }}
                  onClick={() => quickLogin('user1', 'User@123')}
                >
                  <IconUser size={14} style={{ color: '#38bdf8' }} />
                  User Demo
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
