import { auth } from '@/firebaseConfig'

const BASE_URL = 'http://localhost:3000/api'

/**
 * Custom Fetch wrapper for API calls
 * @param {string} endpoint - The path relative to BASE_URL
 * @param {Object} options - Standard Fetch API options
 */
export async function apiFetch(endpoint, options = {}) {
  const user = auth.currentUser

  const token = user ? await user.getIdToken() : null

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error desconocido en la API')
    }

    return data
  } catch (error) {
    console.error(`Error en API [${endpoint}]:`, error.message)
    throw error
  }
}
