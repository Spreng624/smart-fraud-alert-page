// src/utils/request.ts
export const API_BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * 简易 Fetch 封装
 */
export const request = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`网络请求错误: ${response.status}`);
  }

  return response.json();
};