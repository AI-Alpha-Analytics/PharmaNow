import { useApi } from '~/utils/api'

// ✅ Productos
export const createProducto = async (data) => {
  return await useApi()('/inventario/productos', {
    method: 'POST',
    body: data,
  })
}

export const updateProducto = async (id, data) => {
  return await useApi()(`/inventario/productos/${id}/update`, {
    method: 'PATCH',
    body: data,
  })
}

export const deleteProducto = async (id) => {
  return await useApi()(`/inventario/productos/${id}/delete`, {
    method: 'DELETE',
  })
}

// ✅ Ubicaciones
export const createUbicacion = async (data) => {
  return await useApi()('/inventario/ubicaciones', {
    method: 'POST',
    body: data,
  })
}

export const updateUbicacion = async (id, data) => {
  return await useApi()(`/inventario/ubicaciones/${id}/update`, {
    method: 'PATCH',
    body: data,
  })
}

export const deleteUbicacion = async (id) => {
  return await useApi()(`/inventario/ubicaciones/${id}/delete`, {
    method: 'DELETE',
  })
}

// ✅ Bodegas
export const createBodega = async (data) => {
  return await useApi()('/inventario/bodegas', {
    method: 'POST',
    body: data,
  })
}

export const updateBodega = async (id, data) => {
  return await useApi()(`/inventario/bodegas/${id}/update`, {
    method: 'PATCH',
    body: data,
  })
}

export const deleteBodega = async (id) => {
  return await useApi()(`/inventario/bodegas/${id}/delete`, {
    method: 'DELETE',
  })
}

// ✅ Obtener bodega por ID
export const getBodegaById = async (idBodega) => {
  return await useApi()(`/inventario/bodegas/${idBodega}`, {
    method: 'GET',
  })
}

// ✅ Obtener todas las ubicaciones de una bodega
export const getUbicacionesByBodega = async (idBodega) => {
  return await useApi()(`/inventario/bodegas/${idBodega}/ubicaciones`, {
    method: 'GET',
  })
}


// ✅ Tandas
export const createTanda = async (data) => {
  return await useApi()('/inventario/tandas', {
    method: 'POST',
    body: data,
  })
}

export const updateTanda = async (id, data) => {
  return await useApi()(`/inventario/tandas/${id}/update`, {
    method: 'PATCH',
    body: data,
  })
}

// ✅ Gráficos
export const getInfoCharts = async (params) => {
  return await useApi()('/inventario/infoCharts', {
    method: 'GET',
    params,
  })
}
// ✅ Medicamentos por ubicación
export const getMedicamentosByUbicacion = async (idUbicacion) => {
  return await useApi()(`/inventario/ubicaciones/${idUbicacion}/medicamentos`, {
    method: 'GET',
  })
}
// ✅ Niveles
export const createNivel = async (data) => {
  return await useApi()('/inventario/niveles', {
    method: 'POST',
    body: data,
  })
}

export const updateNivel = async (id, data) => {
  return await useApi()(`/inventario/niveles/${id}/update`, {
    method: 'PATCH',
    body: data,
  })
}

export const deleteNivel = async (id) => {
  return await useApi()(`/inventario/niveles/${id}/delete`, {
    method: 'DELETE',
  })
}

export const getNivelesByUbicacion = async (idUbicacion) => {
  return await useApi()(`/inventario/niveles/${idUbicacion}`, {
    method: 'GET',
  })
}
