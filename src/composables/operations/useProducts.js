import { ref } from 'vue'
import { db } from '@/firebaseConfig'
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  setDoc,
  doc,
  increment,
  serverTimestamp,
  runTransaction,
  getDoc
} from 'firebase/firestore'
import { useAuth } from '@/composables/core/useAuth'

export function useProducts() {
  const { user } = useAuth()
  const suggestions = ref([])

  /**
   * Genera un EAN aleatorio con el formato '19XXXX' 
   * y garantiza que no exista previamente en Firestore
   */
  const generarCodigoEANAleatorio = async (userUid) => {
    const productsRef = collection(db, 'users', userUid, 'products')
    let newCode = ''
    let exists = true
    while (exists) {
      const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      newCode = `19${randomDigits}`
      const q = query(productsRef, where('codEAN', '==', newCode), limit(1))
      const snap = await getDocs(q)
      exists = !snap.empty
    }
    return newCode
  }

  /**
   * Búsqueda en el Catálogo Maestro (Nivel Usuario, no Sucursal)
   * Optimizado para reducir lecturas (Limit 5)
   */
const buscarProductos = async (text) => {
    if (!user.value?.uid || !text || text.length < 2) {
      suggestions.value = []
      return
    }

    const searchTerm = text.toUpperCase()
    const productsRef = collection(db, 'users', user.value.uid, 'products')

    try {
      let q;
      // Si el texto es numérico y largo, priorizamos búsqueda por código EAN
      if (/^\d{4,}$/.test(text)) {
        q = query(
          productsRef,
          where('codEAN', '==', text),
          limit(5)
        )
      } else {
        // Búsqueda normal por nombre
        q = query(
          productsRef,
          where('name', '>=', searchTerm),
          where('name', '<=', searchTerm + '\uf8ff'),
          limit(5),
        )
      }

      const snapshot = await getDocs(q)
      suggestions.value = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
    } catch (error) {
      console.error('Error en catálogo:', error)
    }
  }

  /**
   * Auto-aprendizaje del Catálogo y Control de Stock Diario
   */
  const actualizarCatalogo = async (item) => {
    if (!user.value?.uid || !item.name) return

    // Si el item viene con ID de Firebase (fue seleccionado o escaneado), usarlo directo
    const productId = item.id || item.name.trim().toUpperCase().replace(/\s+/g, '_')
    const productRef = doc(db, 'users', user.value.uid, 'products', productId)

    try {
      let autoCodEAN = ""
      const docSnapExterno = await getDoc(productRef)
      if (!docSnapExterno.exists() && (!item.barcode || item.barcode.trim() === '')) {
        autoCodEAN = await generarCodigoEANAleatorio(user.value.uid)
      }

      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(productRef)
        const hoy = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD formato local
        const qtySold = item.qty || 1

        let pData = docSnap.exists() ? docSnap.data() : {
          name: item.name.toUpperCase(),
          codEAN: autoCodEAN,
          stock: 0,
          soldToday: 0,
          lastDateSold: hoy,
          frequency: 0
        }

        let newSoldToday = pData.soldToday || 0
        if (pData.lastDateSold !== hoy) {
          newSoldToday = qtySold // Reset matemático si es nuevo día
        } else {
          newSoldToday += qtySold
        }

        transaction.set(productRef, {
          name: item.name.toUpperCase(),
          lastPrice: Number(item.price),
          codEAN: item.barcode || pData.codEAN || autoCodEAN || "",
          stock: (pData.stock || 0) - qtySold,
          soldToday: newSoldToday,
          lastDateSold: hoy,
          updatedAt: serverTimestamp(),
          frequency: (pData.frequency || 0) + qtySold
        }, { merge: true })
      })
    } catch (error) {
      console.error("Error actualizando stock y ventas del producto:", error)
    }
  }

  /**
   * Actualizar manualmente un producto desde el inventario
   */
  const actualizarProducto = async (productId, newData) => {
    if (!user.value?.uid || !productId) return false
    try {
      const productRef = doc(db, 'users', user.value.uid, 'products', productId)
      await setDoc(productRef, {
        ...newData,
        updatedAt: serverTimestamp()
      }, { merge: true })
      return true
    } catch (error) {
      console.error("Error actualizando producto:", error)
      return false
    }
  }

  /**
   * Crear un producto manualmente desde el inventario con ID dinámico
   */
  const crearProducto = async (newData) => {
    if (!user.value?.uid) return null
    try {
      let finalCodEAN = newData.codEAN
      if (!finalCodEAN || finalCodEAN.trim() === '') {
        finalCodEAN = await generarCodigoEANAleatorio(user.value.uid)
      }

      const productsRef = collection(db, 'users', user.value.uid, 'products')
      const newDocRef = doc(productsRef) // Auto-genera ID único
      const fullData = {
        ...newData,
        codEAN: finalCodEAN,
        updatedAt: serverTimestamp(),
        frequency: 0 // Inicia con 0 ventas
      }
      await setDoc(newDocRef, fullData)
      return { id: newDocRef.id, ...fullData }
    } catch (error) {
      console.error("Error creando producto:", error)
      return null
    }
  }

  /**
   * Búsqueda por Código de Barras (EAN)
   */
  const buscarPorCodigoBarras = async (codigo) => {
    if (!user.value?.uid || !codigo) return null
    try {
      const productsRef = collection(db, 'users', user.value.uid, 'products')
      const q = query(productsRef, where('codEAN', '==', codigo), limit(1))
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const docInfo = snapshot.docs[0]
        return { id: docInfo.id, ...docInfo.data() }
      }
      return null
    } catch (error) {
      console.error("Error buscando por código:", error)
      return null
    }
  }

  /**
   * Obtiene todo el catálogo de productos (Módulo Inventario)
   */
  const obtenerTodosLosProductos = async () => {
    if (!user.value?.uid) return []
    try {
      const productsRef = collection(db, 'users', user.value.uid, 'products')
      const snapshot = await getDocs(productsRef)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error("Error obteniendo inventario:", error)
      return []
    }
  }

  /**
   * Ingreso Masivo de Stock
   */
  const abastecerStockMasivo = async (listaAjuste) => {
    if (!user.value?.uid || listaAjuste.length === 0) return false;
    
    try {
      await runTransaction(db, async (transaction) => {
        for (const item of listaAjuste) {
          const productRef = doc(db, 'users', user.value.uid, 'products', item.id);
          transaction.update(productRef, {
            stock: increment(item.cantidadNueva),
            updatedAt: serverTimestamp()
          });
        }
      });
      return true;
    } catch (error) {
      console.error("Error en carga masiva:", error);
      return false;
    }
  };

  return {
    suggestions,
    buscarProductos,
    actualizarCatalogo,
    actualizarProducto,
    crearProducto,
    buscarPorCodigoBarras,
    obtenerTodosLosProductos,
    abastecerStockMasivo
  }
}
