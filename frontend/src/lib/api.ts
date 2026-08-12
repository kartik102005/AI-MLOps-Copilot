/**
 * Helper function for making API requests with optional Authorization header.
 * Resolves VITE_API_URL dynamically for production cloud deployments (Vercel -> Render).
 */
const BASE_URL = (import.meta.env.VITE_API_URL as string) || ''

export async function fetchApi(
  url: string,
  options: RequestInit = {},
  token?: string | null
): Promise<Response> {
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const finalUrl =
    url.startsWith('/') && BASE_URL
      ? `${BASE_URL.replace(/\/$/, '')}${url}`
      : url

  return fetch(finalUrl, {
    ...options,
    headers,
  })
}
