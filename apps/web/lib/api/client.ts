const SERVER_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

function getApiBaseUrl() {
  return typeof window === 'undefined' ? SERVER_API_BASE_URL : '/api';
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || `API request failed: ${response.status}`);
  }

  const payload = await response.text();
  return (payload ? JSON.parse(payload) : null) as T;
}
