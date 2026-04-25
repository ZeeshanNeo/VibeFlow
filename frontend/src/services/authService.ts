import axios from 'axios';

const API_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' && window.location.port !== '3000'
    ? '/api'
    : 'http://localhost:8080/api');

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

const normalizeUser = (user: any): User => ({
  id: Number(user?.id ?? user?.ID),
  email: user?.email ?? user?.EMAIL ?? '',
  name: user?.name ?? user?.NAME ?? '',
});

const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return { user, token };
  },

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/register`, { email, password, name });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return { user, token };
  },

  async simpleRegister(email: string, password: string, name: string): Promise<void> {
    await axios.post(`${API_URL}/auth/register`, { email, password, name });
  },
  logout(): void {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  },

  async getProfile(): Promise<User> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const response = await axios.get(`${API_URL}/auth/profile`);
    return normalizeUser(response.data.user);
  },

  async getAllUsers(): Promise<User[]> {
    const response = await axios.get(`${API_URL}/auth/users`);
    return (response.data.users || []).map(normalizeUser);
  },

  async updateProfile(name: string, email: string): Promise<AuthResponse> {
    const response = await axios.put(`${API_URL}/auth/profile`, { name, email });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return { user, token };
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};

// Set up axios interceptor for token refresh if needed
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default authService;
