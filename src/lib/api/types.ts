export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  statusCode?: number;
  error?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retry?: {
    attempts: number;
    delay: number;
  };
}
