import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  IconShield, 
  IconDatabase, 
  IconActivity, 
  IconUser, 
  IconServer, 
  IconDownload, 
  IconRefresh, 
  IconTrash, 
  IconCheck 
} from '../components/Icons';

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'backup', 'logs'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [backups, setBackups] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [userSearch, setUserSearch] = useState('');

  const fetchStats = async () => {
    try {
      const data = await api.getAdminStats();
      setStats(data.stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.getAdminUsers({ search: userSearch });
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const fetchBackups = async () => {
    try {
      const data = await api.getBackups();
      setBackups(data.backups || []);
    } catch (err) {
      console.error('Error loading backups:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await api.getAdminLogs();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error loading logs:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'backup') fetchBackups();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, userSearch]);

  const showNotification = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
  };

  // Toggle user status
  const handleToggleUserActive = async (user) => {
    try {
      await api.updateAdminUser(user.id, { is_active: !user.is_active });
      showNotification(`Đã ${user.is_active ? 'khóa' : 'kích hoạt'} tài khoản ${user.username}`);
      fetchUsers();
    } catch (err) {
      showNotification(err.message, 'danger');
    }
  };

  // Change user role
  const handleChangeRole = async (user, newRole) => {
    try {
      await api.updateAdminUser(user.id, { role: newRole });
      showNotification(`Đã cập nhật quyền của ${user.username} thành ${newRole.toUpperCase()}`);
      fetchUsers();
    } catch (err) {
      showNotification(err.message, 'danger');
    }
  };

  // Delete user
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Xác nhận xóa tài khoản "${user.username}" cùng toàn bộ dữ liệu ảnh?`)) return;
    try {
      await api.deleteAdminUser(user.id);
      showNotification(`Đã xóa tài khoản ${user.username}`);
      fetchUsers();
      fetchStats();
    } catch (err) {
      showNotification(err.message, 'danger');
    }
  };

  // Create backup
  const handleCreateBackup = async () => {
    setActionLoading(true);
    try {
      const res = await api.createBackup();
      showNotification(res.message || 'Tạo bản sao lưu thành công!');
      fetchBackups();
    } catch (err) {
      showNotification(err.message || 'Lỗi khi tạo sao lưu', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // Restore backup
  const handleRestoreBackup = async (filename) => {
    if (!window.confirm(`CẢNH BÁO: Phục hồi từ file "${filename}" sẽ ghi đè dữ liệu hiện tại. Bạn có chắc chắn muốn tiếp tục?`)) return;
    setActionLoading(true);
    try {
      const res = await api.restoreBackup(filename);
      showNotification(res.message || 'Đã phục hồi dữ liệu thành công!');
      fetchStats();
      fetchBackups();
    } catch (err) {
      showNotification(err.message || 'Lỗi khi phục hồi', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <div className="hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(192, 132, 252, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
            <IconShield size={26} />
          </div>
          <div>
            <h1 className="hero-title" style={{ background: 'linear-gradient(135deg, #c084fc, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Trung Tâm Quản Trị & Giám Sát Hệ Thống
            </h1>
            <p className="hero-subtitle">
              Quản trị người dùng, cơ sở dữ liệu PostgreSQL, sao lưu phục hồi và giám sát Prometheus & Grafana.
            </p>
          </div>
        </div>

        {/* Status toast message */}
        {statusMsg.text && (
          <div style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            background: statusMsg.type === 'danger' ? 'var(--danger-bg)' : 'var(--success-bg)',
            color: statusMsg.type === 'danger' ? 'var(--danger)' : 'var(--success)',
            border: `1px solid ${statusMsg.type === 'danger' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            fontWeight: 600,
            marginTop: '10px'
          }}>
            {statusMsg.text}
          </div>
        )}

        {/* Tab Headers */}
        <div className="tabs" style={{ marginTop: '16px' }}>
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <IconActivity size={18} />
            Tổng Quan & Giám Sát
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <IconUser size={18} />
            Quản Lý Người Dùng
          </button>
          <button 
            className={`tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            <IconDatabase size={18} />
            Sao Lưu & Phục Hồi
          </button>
          <button 
            className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <IconServer size={18} />
            Nhật Ký Audit
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & MONITORING */}
      {activeTab === 'overview' && (
        <div>
          {/* Quick Stats Grid */}
          <div className="stats-grid">
            <div className="glass-panel stat-card">
              <div className="stat-icon">
                <IconUser size={24} />
              </div>
              <div>
                <div className="stat-val">{stats?.total_users || 0}</div>
                <div className="stat-label">Tổng người dùng ({stats?.active_users || 0} hoạt động)</div>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                <IconServer size={24} />
              </div>
              <div>
                <div className="stat-val">{stats?.total_images || 0}</div>
                <div className="stat-label">Tổng số lượng ảnh</div>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon" style={{ background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8' }}>
                <IconDatabase size={24} />
              </div>
              <div>
                <div className="stat-val">{stats?.total_storage_mb || 0} MB</div>
                <div className="stat-label">Dung lượng ảnh đã dùng</div>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <IconActivity size={24} />
              </div>
              <div>
                <div className="stat-val">{stats?.total_albums || 0}</div>
                <div className="stat-label">Tổng bộ sưu tập</div>
              </div>
            </div>
          </div>

          {/* Monitoring Service Links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {/* Prometheus Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontWeight: 800 }}>
                    P
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Prometheus Monitoring</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cổng 9090 (Trực tiếp)</span>
                  </div>
                </div>
                <span className="badge badge-public">Hoạt động</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Thu thập các số liệu thời gian thực (HTTP requests, latency, image counter, storage gauge) từ Flask backend.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a 
                  href="http://localhost:9090" 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.85rem' }}
                >
                  Mở Prometheus UI (9090) ↗
                </a>
                <a 
                  href="/metrics" 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.85rem' }}
                >
                  Xem Raw /metrics ↗
                </a>
              </div>
            </div>

            {/* Grafana Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontWeight: 800 }}>
                    G
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Grafana Visual Dashboards</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cổng 3001 (Tài khoản: admin / admin123)</span>
                  </div>
                </div>
                <span className="badge badge-public">Sẵn sàng</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Bảng điều khiển trực quan hóa đẹp mắt với đồ thị request rate, thời gian phản hồi API và thống kê tài nguyên.
              </p>
              <a 
                href="http://localhost:3001" 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                Mở Grafana Dashboard (Cổng 3001) ↗
              </a>
            </div>
          </div>

          {/* Disk space usage */}
          {stats?.disk_total_gb && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Dung Lượng Đĩa Máy Chủ</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Đã dùng {stats.disk_percent}% ({stats.disk_free_gb} GB trống / {stats.disk_total_gb} GB tổng)
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${stats.disk_percent}%`, height: '100%', background: stats.disk_percent > 85 ? 'var(--danger)' : 'var(--accent-gradient)' }}></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Danh Sách Người Dùng Hệ Thống</h3>
            <div style={{ maxWidth: '320px', width: '100%' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Tìm username, email..." 
                value={userSearch} 
                onChange={(e) => setUserSearch(e.target.value)} 
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Tài Khoản</th>
                  <th>Họ và Tên</th>
                  <th>Email</th>
                  <th>Vai Trò</th>
                  <th>Ảnh Đã Đăng</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={u.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                        <span style={{ fontWeight: 700 }}>{u.username}</span>
                      </div>
                    </td>
                    <td>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select 
                        className="form-select" 
                        style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                        value={u.role}
                        onChange={(e) => handleChangeRole(u, e.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{u.image_count} ảnh</td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-public' : 'badge-private'}`}>
                        {u.is_active ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleToggleUserActive(u)}
                        >
                          {u.is_active ? 'Khóa' : 'Mở khóa'}
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteUser(u)}
                        >
                          <IconTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>
                Sao Lưu Toàn Bộ Dữ Liệu & Ảnh Tải Lên
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Tạo bản lưu trữ nén (.tar.gz) bao gồm cơ sở dữ liệu và thư mục hình ảnh uploads.
              </p>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleCreateBackup}
              disabled={actionLoading}
            >
              <IconDatabase size={18} />
              <span>{actionLoading ? 'Đang sao lưu...' : 'Tạo Bản Sao Lưu Ngay'}</span>
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
              Danh Sách Các Bản Sao Lưu Đã Tạo ({backups.length})
            </h3>

            {backups.length > 0 ? (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Tên Tệp Sao Lưu</th>
                      <th>Kích Thước</th>
                      <th>Thời Gian Tạo</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((b, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                          📦 {b.filename}
                        </td>
                        <td>{b.size_formatted}</td>
                        <td>{new Date(b.created_at).toLocaleString('vi-VN')}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a 
                              href={`/api/admin/backup/download/${b.filename}`}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              <IconDownload size={14} />
                              Tải Về
                            </a>
                            <button 
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={() => handleRestoreBackup(b.filename)}
                              disabled={actionLoading}
                            >
                              <IconRefresh size={14} />
                              Phục Hồi
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                Chưa có bản sao lưu nào. Hãy nhấn "Tạo Bản Sao Lưu Ngay" ở trên.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
            Nhật Ký Hoạt Động Hệ Thống (Audit Logs)
          </h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Hành Động</th>
                  <th>Mô Tả Chi Tiết</th>
                  <th>Thời Gian</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td>
                      <span className="badge badge-user">{l.action}</span>
                    </td>
                    <td>{l.description}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(l.created_at).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
