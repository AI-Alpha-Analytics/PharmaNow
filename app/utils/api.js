import { useRuntimeConfig, useCookie } from '#app'

let apiInstance = null

export const useApi = () => {
  if (!apiInstance) {
    const config = useRuntimeConfig()

    apiInstance = $fetch.create({
      baseURL: config.public.apiRestUrl,
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
  }
  return apiInstance
}
