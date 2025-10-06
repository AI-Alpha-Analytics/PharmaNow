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

        // 🔹 Detectar si el body es FormData o JSON
        const isFormData = options.body instanceof FormData

        options.headers = {
          ...options.headers,
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(isFormData
            ? {} // si es FormData, no forzamos el tipo
            : { 'Content-Type': 'application/json' }), // 👈 importante
        }
      },
    })
  }

  return apiInstance
}
