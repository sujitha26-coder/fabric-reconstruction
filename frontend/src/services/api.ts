import axios from 'axios';
import type { AnalysisResult, ApiErrorResponse, ReconstructionResponse } from '../types';

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000';

const api = axios.create({ baseURL: apiBaseUrl });

api.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem('access_token');
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

export const inspectFabricQuality = async (formData: FormData) => {
  const response = await api.post('/api/quality/inspect', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const generateColorway = async (payload: FormData) => {
  const response = await api.post('/api/colorways/generate', payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const saveColorway = async (colorwayId: string) => {
  const response = await api.post(`/api/colorways/${colorwayId}/save`);
  return response.data;
};

export const getColorwayPresets = async () => {
  const response = await api.get('/api/colorways/presets');
  return response.data;
};

export const getLibraryProjects = async (search?: string) => {
  const response = await api.get('/api/library/projects', { params: search ? { search } : {} });
  return response.data;
};

export const createLibraryProject = async (payload: Record<string, unknown>) => {
  const response = await api.post('/api/library/projects', payload);
  return response.data;
};

export const createRestorationJob = async (formData: FormData) => {
  const response = await api.post('/api/restoration/jobs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const reviewRestorationJob = async (jobId: string, decision: 'approve' | 'reject') => {
  const response = await api.post(`/api/restoration/jobs/${jobId}/${decision}`);
  return response.data;
};

export const saveRestorationVersion = async (jobId: string) => {
  const response = await api.post(`/api/restoration/jobs/${jobId}/versions`);
  return response.data;
};

export const uploadFabricImage = async (formData: FormData): Promise<ReconstructionResponse> => {
  try {
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data as ReconstructionResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payload = error.response?.data as ApiErrorResponse | undefined;
      throw new Error(payload?.message || payload?.detail || 'Unable to upload the fabric image.');
    }

    throw new Error('Network error while uploading your fabric image.');
  }
};

export const getGalleryItems = async () => {
  try {
    const response = await api.get('/api/gallery');
    return response.data;
  } catch (error) {
    return [];
  }
};

export const getAnalysisJob = async (jobId: string): Promise<AnalysisResult> => {
  const response = await api.get(`/api/analysis/${jobId}`);
  return response.data as AnalysisResult;
};

export const getReconstructionResult = async (jobId: string) => {
  const response = await api.get(`/api/results/${jobId}`);
  return response.data;
};

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  access_token: string;
  token_type: 'bearer';
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/login', { email, password });
  return response.data;
};

export const register = async (
  fullName: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/register', {
    full_name: fullName,
    email,
    password
  });
  return response.data;
};

export default api;
