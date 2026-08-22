import { createClient } from '@/lib/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface ApiErrorResponse {
  detail: string | { msg: string; loc: string[] }[];
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'Error en la petición';
    try {
      const errorData: ApiErrorResponse = await response.json();
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail.map((e) => e.msg).join(', ');
      }
    } catch {
      errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}