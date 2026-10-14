const API_BASE_URL = '/api';

class ApiService {
  getToken() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = options.headers || {};

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Lỗi yêu cầu: ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }

  // Auth APIs
  async login(username, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async register(username, email, password, full_name) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, full_name })
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  async updateProfile(data) {
    return await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async changePassword(old_password, new_password) {
    return await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password, new_password })
    });
  }

  logout() {
    this.setToken(null);
  }

  // Photos APIs
  async getPhotos(params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
        query.append(k, params[k]);
      }
    });
    return await this.request(`/photos?${query.toString()}`);
  }

  async getPhoto(id) {
    return await this.request(`/photos/${id}`);
  }

  async uploadPhotos(formData) {
    return await this.request('/photos/upload', {
      method: 'POST',
      body: formData
    });
  }

  async updatePhoto(id, data) {
    return await this.request(`/photos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deletePhoto(id) {
    return await this.request(`/photos/${id}`, {
      method: 'DELETE'
    });
  }

  async toggleFavorite(id) {
    return await this.request(`/photos/${id}/favorite`, {
      method: 'POST'
    });
  }

  async getPopularTags() {
    return await this.request('/photos/tags/popular');
  }

  getDownloadUrl(id) {
    return `/api/photos/${id}/download`;
  }

  // Albums APIs
  async getAlbums() {
    return await this.request('/albums');
  }

  async getAlbum(id) {
    return await this.request(`/albums/${id}`);
  }

  async createAlbum(data) {
    return await this.request('/albums', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateAlbum(id, data) {
    return await this.request(`/albums/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteAlbum(id) {
    return await this.request(`/albums/${id}`, {
      method: 'DELETE'
    });
  }

  // Admin APIs
  async getAdminStats() {
    return await this.request('/admin/stats');
  }

  async getAdminUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/admin/users?${query}`);
  }

  async updateUserRole(id, role) {
    return await this.request(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  }

  async toggleUserStatus(id) {
    return await this.request(`/admin/users/${id}/status`, {
      method: 'PUT'
    });
  }

  async deleteUser(id) {
    return await this.request(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  }

  async getAdminLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/admin/logs?${query}`);
  }
}

export const api = new ApiService();
