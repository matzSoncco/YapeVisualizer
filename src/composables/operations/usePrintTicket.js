import { getTicketHTML } from '@/utils/TicketTemplate'

/**
 * Composable para imprimir tickets de venta
 * Proporciona una función `imprimirTicket` que genera el HTML del ticket y abre una ventana de impresión
 * @returns {Object} Objeto con la función `imprimirTicket`
 */
export function usePrintTicket() {
  const imprimirTicket = (sale, options = {}) => {
    const html = getTicketHTML(sale, options)

    const printWindow = window.open('', '_blank', 'width=600,height=800')

    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()

      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
      }
    } else {
      alert('Por favor, permite las ventanas emergentes.')
    }
  }

  return { imprimirTicket }
}