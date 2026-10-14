export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function errorBody(error) {
  const status = typeof error?.status === 'number' && error.status >= 400 && error.status < 600 ? error.status : 500;
  const code = error?.code || 'internal_server_error';
  const message = error?.message || 'An unexpected error occurred.';
  return {
    status,
    body: {
      error: {
        code,
        message,
      },
    },
  };
}
