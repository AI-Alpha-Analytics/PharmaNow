// composables/useMovimientoApi.js
import { useApi } from '~/utils/api'

export const useMovimientosApi = () => {
  const api = useApi()

  const registrarMerma = async (payload) => {
    try {
      const res = await api('/movimientos/merma', {
        method: 'POST',
        body: payload,
      })
      return res
    } catch (e) {
      console.error('❌ Error registrando merma', e)
      throw e
    }
  }

  return { registrarMerma }
}
