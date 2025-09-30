import * as Inventario from '~/services/inventarioService'

export const useInventarioSocket = () => {
  const nuxtApp = useNuxtApp()
  const $socketInventario = process.client ? nuxtApp.$socketInventario : null

  const productos = ref([])
  const bodegas = ref([])
  const ubicaciones = ref({})
  const tandas = ref({})

  // 🔹 Helper para evitar errores si no hay socket
  const safeOn = (event, cb) => {
    if ($socketInventario) $socketInventario.on(event, cb)
  }
  const safeOff = (event) => {
    if ($socketInventario) $socketInventario.off(event)
  }
  const safeEmit = (event, payload) => {
    if ($socketInventario) $socketInventario.emit(event, payload)
  }

  // 🔹 Cargar todos los productos
  const fetchProductos = () => {
    if (!$socketInventario) return Promise.resolve([])
    return new Promise((resolve) => {
      safeOff('loadAllProductos')
      safeEmit('getAllProductos')
      safeOn('loadAllProductos', (data) => {
        productos.value = data.map((p) => ({
          ...p,
          lotes: [],
          cantidadTotal: p.stock ?? 0,
          fechaVencimiento: null,
        }))
        resolve(productos.value)
      })
    })
  }

  // 🔹 Crear producto
  const addProducto = async (formData) => {
    const nuevo = await Inventario.createProducto(formData)
    await fetchProductos()
    return nuevo
  }

  // 🔹 Bodegas
  const fetchBodegas = () => {
    if (!$socketInventario) return
    safeOff('loadAllBodegas')
    safeEmit('getAllBodegas')
    safeOn('loadAllBodegas', (data) => {
      bodegas.value = data
    })
  }

  // 🔹 Ubicaciones por bodega
  const fetchUbicacionesByBodega = (idBodega) => {
    if (!$socketInventario) return
    safeOff(`${idBodega}-ubicaciones`)
    safeEmit('getUbicacionesByBodega', { idBodega })
    safeOn(`${idBodega}-ubicaciones`, (data) => {
      ubicaciones.value[idBodega] = data
    })
  }

  // 🔹 Tandas por producto
  const fetchTandasByProducto = (idProducto) => {
    if (!$socketInventario) return Promise.resolve([])
    return new Promise((resolve) => {
      safeOff(`${idProducto}-tanda`)
      safeEmit('getTandasByIdProducto', { idProducto })
      safeOn(`${idProducto}-tanda`, (data) => {
        const normalizadas = data.map((l) => ({
          ...l,
          vencimiento: l.fechaVencimiento,
          cantidad: l.cantidad ?? l.cantidadActual ?? 0,
        }))

        tandas.value[idProducto] = normalizadas

        const med = productos.value.find((m) => m.id === idProducto)
        if (med) {
          med.lotes = normalizadas
          med.cantidadTotal = normalizadas.reduce(
            (acc, l) => acc + l.cantidad,
            0
          )
          med.fechaVencimiento = normalizadas.length
            ? normalizadas.reduce((min, l) => {
                const fecha = new Date(l.vencimiento)
                return fecha < min ? fecha : min
              }, new Date(normalizadas[0].vencimiento))
            : null
        }

        resolve(normalizadas)
      })
    })
  }

  // ============================================
  // 🔹 Eventos en tiempo real (cliente-only)
  // ============================================
  if ($socketInventario) {
    safeOn('stockProductoChange', (data) => {
      console.log('🔄 Stock actualizado:', data)
      const med = productos.value.find((m) => m.id === data.id)
      if (med) {
        med.stock = data.stock
        med.cantidadTotal = data.stock
      }
    })

    safeOn('newTandaCreated', (tanda) => {
      console.log('🆕 Nueva tanda creada:', tanda)
      const normalizada = {
        ...tanda,
        vencimiento: tanda.fechaVencimiento,
        cantidad: tanda.cantidad ?? tanda.cantidadActual ?? 0,
      }

      const med = productos.value.find((m) => m.id === normalizada.productoId)
      if (med) {
        if (!med.lotes.some((l) => l.id === normalizada.id)) {
          med.lotes.push(normalizada)
        }
        med.cantidadTotal = med.lotes.reduce((acc, l) => acc + l.cantidad, 0)
      }

      if (!tandas.value[normalizada.productoId])
        tandas.value[normalizada.productoId] = []
      tandas.value[normalizada.productoId].push(normalizada)
    })

    safeOn('newTandaUpdate', (tanda) => {
      console.log('✏️ Tanda actualizada:', tanda)
      const normalizada = {
        ...tanda,
        vencimiento: tanda.fechaVencimiento,
        cantidad: tanda.cantidad ?? tanda.cantidadActual ?? 0,
      }

      const med = productos.value.find((m) => m.id === normalizada.productoId)
      if (med && med.lotes) {
        const idx = med.lotes.findIndex((l) => l.id === normalizada.id)
        if (idx !== -1) {
          med.lotes[idx] = { ...med.lotes[idx], ...normalizada }
          med.cantidadTotal = med.lotes.reduce((acc, l) => acc + l.cantidad, 0)
        }
      }
    })
  }

  return {
    productos,
    bodegas,
    ubicaciones,
    tandas,
    fetchProductos,
    addProducto,
    fetchBodegas,
    fetchUbicacionesByBodega,
    fetchTandasByProducto,
  }
}
