import React, { useState, useEffect } from 'react';
import {
  Users,
  Image as ImageIcon,
  HardDrive,
  Eye,
  Activity,
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  Database,
  Server,
  Terminal,
  RefreshCw,
  ExternalLink,
  DownloadCloud,
  FileText,
  Trash2,
  Download,
  Archive,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AdminPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('users'); // users, logs, monitoring, backup
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.getAdminStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.getAdminUsers({ search: userSearch });
      if (res.success && res.users) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error('Failed to load admin users:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.getAdminLogs();
      if (res.success && res.logs) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to load admin logs:', err);
    }
  };

  const fetchBackups = async () => {
    try {
      const res = await api.getBackups();
      if (res.success && res.backups) {
        setBackups(res.backups);
      }
    } catch (err) {
      console.error('Failed to load backups:', err);
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    addToast('Đang tiến hành sao lưu Database và tệp Media...', 'info');
    try {
      const res = await api.createBackup();
      if (res.success) {
        addToast(res.message || 'Tạo bản sao lưu thành công!', 'success');
        await fetchBackups();
      } else {
        addToast(res.message || 'Lỗi khi tạo bản sao lưu', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Không thể tạo bản sao lưu', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tệp sao lưu "${filename}"?`)) return;
    try {
      const res = await api.deleteBackup(filename);
      if (res.success) {
        addToast(`Đã xóa bản sao lưu ${filename}`, 'success');
        await fetchBackups();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi xóa tệp sao lưu', 'error');
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchUsers(), fetchLogs(), fetchBackups()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleRoleToggle = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Bạn có chắc muốn chuyển quyền của "${targetUser.username}" thành "${newRole}"?`)) return;

    try {
      const res = await api.updateUserRole(targetUser.id, newRole);
      if (res.success) {
        addToast(res.message, 'success');
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi cập nhật quyền hạn', 'error');
    }
  };

  const handleStatusToggle = async (targetUser) => {
    try {
      const res = await api.toggleUserStatus(targetUser.id);
      if (res.success) {
        addToast(res.message, 'success');
        fetchUsers();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi thay đổi trạng thái', 'error');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`CẢNH BÁO: Xóa người dùng "${targetUser.username}" sẽ xóa toàn bộ hình ảnh liên quan. Bạn có chắc không?`)) return;

    try {
      const res = await api.deleteUser(targetUser.id);
      if (res.success) {
        addToast(res.message, 'success');
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi xóa người dùng', 'error');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Bảng Điều Khiển Quản Trị</h1>
            <span className="badge badge-admin">Super Admin</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Quản trị phân quyền người dùng, giám sát lưu lượng và trạng thái toàn hệ thống thư viện.
          </p>
        </div>

        <button onClick={refreshAll} className="btn btn-secondary">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* 4 Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Total Users */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Tổng Người Dùng
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '6px' }}>
                {stats?.total_users || 0}
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '8px' }}>
            ✓ Đang hoạt động bình thường
          </div>
        </div>

        {/* Total Photos */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Tổng Số Ảnh
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '6px', color: 'var(--accent-cyan)' }}>
                {stats?.total_photos || 0}
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            {stats?.total_albums || 0} bộ sưu tập được tạo
          </div>
        </div>

        {/* Views & Downloads */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Lượt Xem & Tải Về
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '6px', color: 'var(--accent-pink)' }}>
                {stats?.total_views || 0} <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>/ {stats?.total_downloads || 0}</span>
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.15)', color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Eye size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            Lưu lượng tương tác cao
          </div>
        </div>

        {/* Storage */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Dung Lượng Đĩa
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '6px', color: 'var(--accent-amber)' }}>
                {stats?.storage_mb || 0} <span style={{ fontSize: '1rem' }}>MB</span>
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            Thư mục ảnh gốc & WebP Thumbnails
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem'
      }}>
        {[
          { id: 'users', label: 'Quản Lý Người Dùng & Phân Quyền', icon: Users },
          { id: 'logs', label: 'Nhật Ký Hệ Thống (Audit Logs)', icon: FileText },
          { id: 'monitoring', label: 'Giám Sát (Prometheus + Grafana)', icon: Activity },
          { id: 'backup', label: 'Sao Lưu & Phục Hồi (Backup)', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: User Management */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Danh Sách Người Dùng ({users.length})</h3>
            <div style={{ width: '260px' }}>
              <input
                type="text"
                placeholder="Tìm username hoặc email..."
                className="form-input"
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); fetchUsers(); }}
                style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Người Dùng</th>
                <th style={{ padding: '10px 12px' }}>Email</th>
                <th style={{ padding: '10px 12px' }}>Vai Trò (Role)</th>
                <th style={{ padding: '10px 12px' }}>Trạng Thái</th>
                <th style={{ padding: '10px 12px' }}>Ngày Tạo</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={u.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`}
                        alt={u.username}
                        style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.full_name || u.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                      {u.role === 'admin' ? 'Quản Trị Viên' : 'Người Dùng'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {u.is_active ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-emerald)', fontSize: '0.8rem' }}>
                        <CheckCircle size={14} /> Hoạt động
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-rose)', fontSize: '0.8rem' }}>
                        <XCircle size={14} /> Bị khóa
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {u.id !== user.id && (
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleRoleToggle(u)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Đổi vai trò
                        </button>
                        <button
                          onClick={() => handleStatusToggle(u)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', color: u.is_active ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}
                        >
                          {u.is_active ? 'Khóa' : 'Kích hoạt'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="btn btn-danger btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Nhật Ký Kiểm Toán Hoạt Động Hệ Thống
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px' }}>Thời Gian</th>
                <th style={{ padding: '10px' }}>Hành Động</th>
                <th style={{ padding: '10px' }}>Tài Khoản</th>
                <th style={{ padding: '10px' }}>Địa Chỉ IP</th>
                <th style={{ padding: '10px' }}>Chi Tiết</th>
                <th style={{ padding: '10px' }}>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '10px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : 'N/A'}
                  </td>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{log.action}</td>
                  <td style={{ padding: '10px', color: 'var(--primary)' }}>@{log.username}</td>
                  <td style={{ padding: '10px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{log.ip_address}</td>
                  <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{log.details}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      background: log.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: log.status === 'SUCCESS' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                    }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Monitoring (Prometheus + Grafana) */}
      {activeTab === 'monitoring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Hạ Tầng Giám Sát: Prometheus & Grafana</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hệ thống xuất chỉ số thời gian thực và trực quan hóa hiệu năng</p>
                </div>
              </div>

              <a
                href="/metrics"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', gap: '6px' }}
              >
                <span>Xem Raw Metrics (/metrics)</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
              marginTop: '1.25rem'
            }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>Prometheus Server</div>
                  <span className="badge badge-public">Cổng: 9090</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Thu thập metrics chu kỳ 15s từ Backend Flask (`http_requests_total`, `http_request_duration_seconds`, `gallery_storage_used_bytes`).
                </p>
                <a
                  href="http://127.0.0.1:9090"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '12px', width: '100%' }}
                >
                  Mở Prometheus UI (127.0.0.1:9090) <ExternalLink size={13} />
                </a>
              </div>

              <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-pink)' }}>Grafana Dashboard</div>
                  <span className="badge badge-admin">Cổng: 3001</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Hiển thị biểu đồ trực quan hóa lưu lượng HTTP, tốc độ upload ảnh, thời gian phản hồi API và mức tiêu thụ đĩa.
                </p>
                <a
                  href="http://127.0.0.1:3001"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '12px', width: '100%' }}
                >
                  Mở Grafana Dashboard (127.0.0.1:3001) <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="var(--primary)" />
              <span>Các Metrics Tùy Biến Đã Cấu Hình:</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', fontSize: '0.82rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <code>http_requests_total</code>
                <div style={{ color: 'var(--text-dim)', marginTop: '4px' }}>Đếm tổng số request theo method & endpoint</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <code>http_request_duration_seconds</code>
                <div style={{ color: 'var(--text-dim)', marginTop: '4px' }}>Đo độ trễ phản hồi của API Backend</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <code>gallery_photo_uploads_total</code>
                <div style={{ color: 'var(--text-dim)', marginTop: '4px' }}>Tổng số ảnh được tải lên hệ thống</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <code>gallery_storage_used_bytes</code>
                <div style={{ color: 'var(--text-dim)', marginTop: '4px' }}>Tổng dung lượng lưu trữ ảnh trên đĩa cứng</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Backup & Restore */}
      {activeTab === 'backup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Action Bar */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Database size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Quản Trị Cơ Sở Dữ Liệu & Sao Lưu</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sao lưu trọn gói CSDL PostgreSQL và thư mục ảnh Docker volume</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={fetchBackups}
                  className="btn btn-secondary btn-sm"
                  title="Làm mới danh sách"
                >
                  <RefreshCw size={15} />
                  <span>Làm mới</span>
                </button>

                <button
                  onClick={handleCreateBackup}
                  disabled={backupLoading}
                  className="btn btn-primary btn-sm"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
                >
                  {backupLoading ? <RefreshCw size={15} className="spin" /> : <DownloadCloud size={15} />}
                  <span>{backupLoading ? 'Đang sao lưu...' : 'Tạo Sao Lưu Ngay (1 Chạm)'}</span>
                </button>
              </div>
            </div>

            {/* Backups Table */}
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Archive size={16} color="var(--accent-emerald)" />
                <span>Danh Sách Bản Sao Lưu Hệ Thống ({backups.length} tệp)</span>
              </h4>

              {backups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <Archive size={36} color="var(--text-dim)" style={{ margin: '0 auto 10px auto' }} />
                  <p style={{ color: 'var(--text-muted)' }}>Chưa có bản sao lưu nào. Hãy bấm <b>"Tạo Sao Lưu Ngay"</b> ở trên!</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '10px 12px' }}>Tên Tệp Sao Lưu</th>
                        <th style={{ textAlign: 'left', padding: '10px 12px' }}>Loại</th>
                        <th style={{ textAlign: 'left', padding: '10px 12px' }}>Dung Lượng</th>
                        <th style={{ textAlign: 'left', padding: '10px 12px' }}>Thời Gian Tạo</th>
                        <th style={{ textAlign: 'right', padding: '10px 12px' }}>Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map((b) => (
                        <tr key={b.filename} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600 }}>
                            {b.filename}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {b.type === 'database' ? (
                              <span className="badge badge-admin" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                                PostgreSQL DB
                              </span>
                            ) : (
                              <span className="badge badge-user" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                                Thư Mục Media
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-dim)' }}>
                            {b.size_mb > 0 ? `${b.size_mb} MB` : `${Math.round(b.size_bytes / 1024)} KB`}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-dim)' }}>
                            {new Date(b.created_at).toLocaleString('vi-VN')}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <a
                                href={api.getBackupDownloadUrl(b.filename)}
                                download
                                className="btn btn-outline btn-sm"
                                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                                title="Tải về máy tính"
                              >
                                <Download size={13} />
                                <span>Tải về</span>
                              </a>
                              <button
                                onClick={() => handleDeleteBackup(b.filename)}
                                className="btn btn-sm"
                                style={{ padding: '5px 8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'none' }}
                                title="Xóa bản sao lưu này"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* CLI Instructions Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={16} color="var(--primary)" />
              <span>Kịch Bản Dòng Lệnh Phục Hồi Dữ Liệu (Restore) Khi Gặp Sự Cố:</span>
            </h4>
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              lineHeight: 1.7
            }}>
              <div style={{ color: 'var(--text-dim)' }}># Trên Windows (Powershell / CMD):</div>
              <div style={{ color: 'var(--accent-emerald)' }}>
                .\backup\restore.bat backup\archives\db_backup_xxxx.sql backup\archives\media_backup_xxxx.zip
              </div>

              <div style={{ color: 'var(--text-dim)', marginTop: '12px' }}># Trên Linux / macOS:</div>
              <div style={{ color: 'var(--accent-cyan)' }}>
                ./backup/restore.sh backup/archives/db_backup_xxxx.sql.gz backup/archives/media_backup_xxxx.tar.gz
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
