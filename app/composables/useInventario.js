import * as Inventario from '~/services/inventarioService'

export const useInventario = () => {
  const productos = ref([])

  const fetchProductos = async () => {}

  const addProducto = async (data) => {
    const nuevo = await Inventario.createProducto(data)
    productos.value.push(nuevo)
  }

  return { productos, fetchProductos, addProducto }
}
