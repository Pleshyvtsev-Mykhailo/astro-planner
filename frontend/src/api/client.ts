import { getToken } from '../auth/tokenStorage';

const BASE_URL = String(import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  title: string;
  detail: string;
  errors: FieldErrors;

  constructor(status: number, title: string, detail = '', errors: FieldErrors = {}) {
    super(detail || title);
    this.name = 'ApiError';
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.errors = errors;
  }
}

export function fieldError(error: ApiError | null, field: string): string | undefined {
  if (!error) return undefined;
  const key = Object.keys(error.errors).find((k) => k.toLowerCase() === field.toLowerCase());
  return key ? error.errors[key][0] : undefined;
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query?: Query;
  body?: unknown;
  skipUnauthorizedHandler?: boolean;
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

const DEFAULT_TITLES: Record<number, string> = {
  400: 'Некоректний запит',
  401: 'Потрібен вхід',
  403: 'Недостатньо прав',
  404: 'Не знайдено',
  409: 'Конфлікт даних',
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, skipUnauthorizedHandler = false } = options;

  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    }
  }
  const queryString = params.toString();
  const url = `${BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;

  const token = getToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      'Сервер недоступний',
      'Не вдалося з’єднатися із сервером. Переконайтеся, що API запущено, і повторіть дію.',
    );
  }

  const text = await response.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = undefined;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token && !skipUnauthorizedHandler) {
      onUnauthorized?.();
    }
    const problem = (data ?? {}) as {
      title?: string;
      detail?: string;
      errors?: FieldErrors;
    };
    throw new ApiError(
      response.status,
      problem.title ?? DEFAULT_TITLES[response.status] ?? 'Помилка запиту',
      problem.detail ?? '',
      problem.errors ?? {},
    );
  }

  return data as T;
}