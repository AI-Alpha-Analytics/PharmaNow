import * as Inventario from '~/services/inventarioService'

export const useInventario = () => {
  const productos = ref([])
  const bodegas = ref([])
  const ubicaciones = ref({})

  // ================================
  // 🔹 Productos (REST solo CRUD)
  // ================================
  const fetchProductos = async () => {
    productos.value = await Inventario.getProductos()
    return productos.value
  }

  const addProducto = async (data) => {
    const nuevo = await Inventario.createProducto(data)
    productos.value.push(nuevo)
    return nuevo
  }
  const addTanda = async (data) => {
    return await Inventario.createTanda(data)
  }

  const updateProducto = async (id, data) => {
    const actualizado = await Inventario.updateProducto(id, data)
    const idx = productos.value.findIndex((p) => p.id === id)
    if (idx !== -1) productos.value[idx] = actualizado
    return actualizado
  }

  const deleteProducto = async (id) => {
    await Inventario.deleteProducto(id)
    productos.value = productos.value.filter((p) => p.id !== id)
  }

  // ================================
  // 🔹 Bodegas
  // ================================
  const fetchBodegas = async () => {
    bodegas.value = await Inventario.getBodegas()
    return bodegas.value
  }

  const addBodega = async (data) => {
    const nueva = await Inventario.createBodega(data)
    bodegas.value.push(nueva)
    return nueva
  }

  const updateBodega = async (id, data) => {
    const bodega = await Inventario.updateBodega(id, data)
    const idx = bodegas.value.findIndex((b) => b.id === id)
    if (idx !== -1) bodegas.value[idx] = bodega
    return bodega
  }

  const deleteBodega = async (id) => {
    await Inventario.deleteBodega(id)
    bodegas.value = bodegas.value.filter((b) => b.id !== id)
  }

  // ================================
  // 🔹 Ubicaciones
  // ================================
  const fetchUbicacionesByBodega = async (idBodega) => {
    ubicaciones.value[idBodega] = await Inventario.getUbicacionesByBodega(
      idBodega
    )
    return ubicaciones.value[idBodega]
  }

  return {
    // state
    productos,
    bodegas,
    ubicaciones,
    // productos
    fetchProductos,
    addProducto,
    addTanda,
    updateProducto,
    deleteProducto,
    // bodegas
    fetchBodegas,
    addBodega,
    updateBodega,
    deleteBodega,
    // ubicaciones
    fetchUbicacionesByBodega,
  }
}
