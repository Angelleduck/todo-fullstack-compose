import ky, { isHTTPError } from 'ky'

const apiUrl = import.meta.env.VITE_API_URL?.trim()
if (!apiUrl) {
  throw new Error('VITE_API_URL is required. Set it to the backend origin.')
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const bareClient = ky.create({
  baseUrl: apiUrl,
  credentials: 'include',
  retry: { limit: 0 },
})

let refreshPromise: Promise<boolean> | undefined

function refreshSession(): Promise<boolean> {
  refreshPromise ??= bareClient
    .post('/auth/refresh')
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      refreshPromise = undefined
    })
  return refreshPromise
}

export const client = ky.create({
  baseUrl: apiUrl,
  credentials: 'include',
  // Only the explicit 401 refresh below is retried; never repeat a write
  // automatically after an ambiguous network failure.
  retry: {
    limit: 1,
    methods: ['get', 'post', 'patch', 'delete'],
    statusCodes: [],
    shouldRetry: () => false,
  },
  hooks: {
    afterResponse: [
      async ({ request, response, retryCount }) => {
        const path = new URL(request.url).pathname
        if (
          response.status !== 401 ||
          retryCount > 0 ||
          [
            '/auth/register',
            '/auth/login',
            '/auth/logout',
            '/auth/refresh',
          ].includes(path)
        ) {
          return
        }

        if (await refreshSession()) {
          return ky.retry({
            request: new Request(request),
            code: 'SESSION_REFRESHED',
          })
        }
      },
    ],
    beforeError: [
      ({ error }) => {
        if (!isHTTPError(error)) return error
        // Ky 2 has already consumed the response and parsed its JSON into data.
        const payload: unknown = error.data
        const body =
          payload && typeof payload === 'object'
            ? (payload as Record<string, unknown>)
            : {}
        return new ApiError(
          typeof body.message === 'string'
            ? body.message
            : `Request failed (${error.response.status}).`,
          error.response.status,
          Array.isArray(body.details) ? body.details.map(String) : [],
        )
      },
    ],
  },
})

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.details.length > 0 ? error.details.join(' ') : error.message
  }
  return 'Could not reach the server. Please try again.'
}
