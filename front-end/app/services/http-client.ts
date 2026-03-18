const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';
export const authExpiredEventName = 'ayel-auth-expired';

interface RequestOptions extends RequestInit {
  token?: string | null;
}

async function parseResponse<T>(response: Response, options: { shouldDispatchAuthExpired: boolean }): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const hasJson = contentType.includes('application/json');
  const payload = hasJson ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 401 && options.shouldDispatchAuthExpired && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(authExpiredEventName));
    }

    const message = payload && typeof payload.message === 'string' ? payload.message : `HTTP ${response.status}`;
    const error = new Error(message);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return payload as T;
}

export async function httpClient<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
  });

  return parseResponse<T>(response, {
    shouldDispatchAuthExpired: Boolean(options.token),
  });
}

export { apiUrl };
