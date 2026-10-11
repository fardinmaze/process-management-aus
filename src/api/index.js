// Thin client over the (mock) process API. Same {code, response, data} contract as the Django app.
// To go live: replace the body of `call` with an axios request to `${API_BASE}/${path}`.
import { dispatch, ApiError, resetDemo } from '@/mock/server'

const LATENCY = 60

export async function call(path, payload = {}) {
  await new Promise((r) => setTimeout(r, LATENCY))
  try {
    return dispatch(path, payload).data
  } catch (e) {
    if (e instanceof ApiError) {
      const err = new Error(e.message)
      err.code = e.code
      err.data = e.data
      if (e.code === 401 && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/invite')) {
        setTimeout(() => { location.href = '/login' }, 0)
      }
      throw err
    }
    throw e
  }
}
export { resetDemo }
