import { api } from '~/utils/api'

// ✅ Productos
export const createProducto = async (data) => {
  return await api('/inventario/productos', {
    method: 'POST',
    body: data,
  })
}

export const updateProducto = async (id, data) => {
  return await api(`/inventario/productos/${id}/update`, {
    method: 'PATCH',
    body: data,
  })
}

export const deleteProducto = async (id) => {
  return await api(`/inventario/productos/${id}/delete`, {
    method: 'DELETE',
  })
}

// ✅ Ubicaciones
export const createUbicacion = async (data) => {
  return await api('/inventario/ubicaciones', { method: 'POST', body: data })
}
export const updateUbicacion = async (id, data) => {
  return await api(`/inventario/ubicaciones/${id}/update`, {
    method: 'PATCH',
    body: data,
  })
}
export const deleteUbicacion = async (id) => {
  return await api(`/inventario/ubicaciones/${id}/delete`, { method: 'DELETE' })
}

// ✅ Bodegas
export const createBodega = async (data) => {
  return await api('/inventario/bodegas', { method: 'POST', body: data })
}
export const updateBodega = async (id, data) => {
  return await api(`/inventario/bodegas/${id}/update`, {
    method: 'PATCH',
    body: data,
  })
}
export const deleteBodega = async (id) => {
  return await api(`/inventario/bodegas/${id}/delete`, { method: 'DELETE' })
}

// ✅ Tandas
export const createTanda = async (data) => {
  return await api('/inventario/tandas', { method: 'POST', body: data })
}
export const updateTanda = async (id, data) => {
  return await api(`/inventario/tandas/${id}/update`, {
    method: 'PATCH',
    body: data,
  })
}

// ✅ Gráficos
export const getInfoCharts = async (params) => {
  return await api('/inventario/infoCharts', { method: 'GET', params })
}
