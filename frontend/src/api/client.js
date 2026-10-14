const API_BASE = '/api';

function getHeaders(isFormData = false) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.error || data.message || `Lỗi hệ thống (${response.status})`;
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  // Auth
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
  },

  async register(username, email, password, full_name) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, full_name })
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Images
  async getImages(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/images?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getImage(id) {
    const res = await fetch(`${API_BASE}/images/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async uploadImages(formData) {
    const res = await fetch(`${API_BASE}/images/upload`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse(res);
  },

  async updateImage(id, data) {
    const res = await fetch(`${API_BASE}/images/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteImage(id) {
    const res = await fetch(`${API_BASE}/images/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Albums
  async getAlbums(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/albums?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getAlbum(id) {
    const res = await fetch(`${API_BASE}/albums/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createAlbum(data) {
    const res = await fetch(`${API_BASE}/albums`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateAlbum(id, data) {
    const res = await fetch(`${API_BASE}/albums/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteAlbum(id) {
    const res = await fetch(`${API_BASE}/albums/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Tags
  async getTags() {
    const res = await fetch(`${API_BASE}/tags`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Admin
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getAdminUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/users?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async updateAdminUser(id, data) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteAdminUser(id) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getAdminLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/logs?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Backup & Restore
  async getBackups() {
    const res = await fetch(`${API_BASE}/admin/backup/list`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createBackup() {
    const res = await fetch(`${API_BASE}/admin/backup/create`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async restoreBackup(filename) {
    const res = await fetch(`${API_BASE}/admin/backup/restore`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ filename })
    });
    return handleResponse(res);
  }
};
