/**
 * Standard API success response wrapper
 */
export interface ApiSuccessResponse<T> {
  data: T;
  status: number;
  message?: string;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  status: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Loading state
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Async state wrapper
 */
export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  order: SortOrder;
}

/**
 * Filter parameters
 */
export interface FilterParams {
  [key: string]: string | number | boolean;
}
