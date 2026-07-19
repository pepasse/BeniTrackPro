import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG, AUTH_CONFIG } from './config';
import { ENDPOINTS } from './constants';

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur de requête
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercepteur de réponse
    this.axiosInstance.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => this.handleError(error)
    );
  }

  private handleError(error: AxiosError) {
    if (error.response?.status === 401) {
      // Token expiré, redirection vers login
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }

  public getInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  // GET
  public async get<T = any>(url: string, config?: any): Promise<T> {
    return this.axiosInstance.get<any, T>(url, config);
  }

  // POST
  public async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.axiosInstance.post<any, T>(url, data, config);
  }

  // PUT
  public async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.axiosInstance.put<any, T>(url, data, config);
  }

  // DELETE
  public async delete<T = any>(url: string, config?: any): Promise<T> {
    return this.axiosInstance.delete<any, T>(url, config);
  }

  // PATCH
  public async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.axiosInstance.patch<any, T>(url, data, config);
  }
}

export default new ApiClient();
