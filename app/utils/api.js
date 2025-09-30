export const api = $fetch.create({
  baseURL: process.env.NUXT_PUBLIC_API_BASE_URL,
  credentials: 'include',
  onRequest({ options }) {
    const token = useCookie('token').value
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      }
    }
  },
})
