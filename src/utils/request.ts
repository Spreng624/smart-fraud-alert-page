const rawApiBase = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';

export const API_BASE = rawApiBase.replace(/\/$/, '');
export const HAS_REMOTE_API = API_BASE.length > 0;
export const DASHBOARD_USES_LOCAL_DATA = true;

const joinUrl = (base: string, path: string) => {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
};

const getMockPath = (endpoint: string, options?: RequestInit) => {
  const method = options?.method?.toUpperCase() ?? 'GET';
  if (method !== 'GET') return null;

  if (endpoint.startsWith('/statistics/')) {
    const name = endpoint.replace('/statistics/', '');
    return `${import.meta.env.BASE_URL}mock/statistics/${name}.json`;
  }

  if (endpoint.startsWith('/victim/')) {
    const name = endpoint.replace('/victim/', '');
    return `${import.meta.env.BASE_URL}mock/victim/${name}.json`;
  }

  if (endpoint === '/graph/manifest') {
    return `${import.meta.env.BASE_URL}mock/graph/manifest.json`;
  }

  if (endpoint === '/graph/categories') {
    return `${import.meta.env.BASE_URL}mock/graph/categories.json`;
  }

  if (endpoint.startsWith('/graph/by-category/')) {
    const slug = endpoint.replace('/graph/by-category/', '');
    return `${import.meta.env.BASE_URL}mock/graph/by_category/${encodeURIComponent(slug)}/graph_data.json`;
  }

  return null;
};

const fetchJson = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
};

export const request = async (endpoint: string, options?: RequestInit) => {
  const mockPath = getMockPath(endpoint, options);

  // Dashboard pages now read bundled JSON directly.
  if (mockPath) {
    return fetchJson(mockPath);
  }

  if (!HAS_REMOTE_API) {
    throw new Error(`No remote API available for ${endpoint}`);
  }

  return fetchJson(joinUrl(API_BASE, endpoint), options);
};
