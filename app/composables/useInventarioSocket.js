export const useInventarioSocket = () => {
  const { $socketInventario } = useNuxtApp()

  const productos = ref([])
  const bodegas = ref([])
  const ubicaciones = ref({})
  const tandas = ref({})

  const safeOn = (event, cb) => {
    if ($socketInventario) $socketInventario.on(event, cb)
  }
  const safeOff = (event) => {
    if ($socketInventario) $socketInventario.off(event)
  }
  const safeEmit = (event, payload) => {
    if ($socketInventario) $socketInventario.emit(event, payload)
  }

  // ================================
  // 🔹 Productos
  // ================================
  const fetchProductos = () => {
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

  // ================================
  // 🔹 Bodegas
  // ================================
  const fetchBodegas = () => {
    return new Promise((resolve) => {
      safeOff('loadAllBodegas')
      safeEmit('getAllBodegas')
      safeOn('loadAllBodegas', (data) => {
        bodegas.value = data
        resolve(bodegas.value)
      })
    })
  }

  // ================================
  // 🔹 Ubicaciones
  // ================================
  const fetchUbicacionesByBodega = (idBodega) => {
    return new Promise((resolve) => {
      safeOff(`${idBodega}-ubicaciones`)
      safeEmit('getUbicacionesByBodega', { idBodega })
      safeOn(`${idBodega}-ubicaciones`, (data) => {
        ubicaciones.value[idBodega] = data
        resolve(data)
      })
    })
  }

  // ================================
  // 🔹 Tandas
  // ================================
  const fetchTandasByProducto = (idProducto) => {
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
        resolve(normalizadas)
      })
    })
  }

  // ================================
  // 🔹 Eventos en tiempo real
  // ================================
  safeOn('stockProductoChange', (data) => {
    const med = productos.value.find((m) => m.id === data.id)
    if (med) {
      med.stock = data.stock
      med.cantidadTotal = data.stock
    }
  })

  safeOn('newTandaCreated', (tanda) => {
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

      // 🔹 recalcular fecha de vencimiento más próxima
      med.fechaVencimiento = med.lotes.length
        ? med.lotes.reduce((min, l) => {
            const fecha = new Date(l.vencimiento)
            return fecha < min ? fecha : min
          }, new Date(med.lotes[0].vencimiento))
        : null
    }

    if (!tandas.value[normalizada.productoId])
      tandas.value[normalizada.productoId] = []
    tandas.value[normalizada.productoId].push(normalizada)
  })

  safeOn('newTandaUpdate', (tanda) => {
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

        // 🔹 recalcular fecha de vencimiento más próxima
        med.fechaVencimiento = med.lotes.length
          ? med.lotes.reduce((min, l) => {
              const fecha = new Date(l.vencimiento)
              return fecha < min ? fecha : min
            }, new Date(med.lotes[0].vencimiento))
          : null
      }
    }
  })

  return {
    // state
    productos,
    bodegas,
    ubicaciones,
    tandas,
    // actions
    fetchProductos,
    fetchBodegas,
    fetchUbicacionesByBodega,
    fetchTandasByProducto,
  }
}
