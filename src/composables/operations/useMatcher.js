import { reactive, watch, computed } from 'vue';
import { useToast } from 'primevue/usetoast';

const matcherState = reactive({
    isListening: false,
    expectedAmount: 0,
    candidate: null,
    showModal: false,
    matchType: null,
    isLocked: false,
    loading: false
});

export function useMatcher() {
    const toast = useToast();

    /**
     * Inicia espera de un pago digital con un monto específico
     * El cajero ha llenado el carrito y hace click en "Esperar pago digital"
     * @param {int} montoTotal - Monto esperado para la transacción actual
     */
    const iniciarEspera = (montoTotal) => {
        const monto = Number(montoTotal);

        if (monto <= 0) {
            return false;
        }

        matcherState.expectedAmount = monto;
        matcherState.isListening = true;
        matcherState.candidate = null;
        matcherState.isLocked = true;
        matcherState.loading = false;
        
        return true;
    };

    /**
     * Método para cancelar la espera de un pago digital
     * Posibles errores en el proceso o decisión humana
     */
    const cancelarEspera = () => {
        matcherState.isListening = false;
        matcherState.expectedAmount = 0;
        matcherState.candidate = null;
        matcherState.showModal = false;
        matcherState.isLocked = false;
    };

    /**
     * Watcher para detectar nuevos pagos digitales entrantes y validar el monto esperado
     * @param {Ref} pendientesRef - La referencia reactiva de useDigitalPayments
     */
    const vigilarEntrantes = (pendientesRef) => {
        watch(pendientesRef, (nuevosPagos) => {
            if (!matcherState.isListening || matcherState.showModal) return;

            const match = nuevosPagos.find(y => Number(y.amount) === matcherState.expectedAmount);

            if (match) {
                matcherState.candidate = match;
                matcherState.matchType = 'AUTO';
                matcherState.showModal = true;
                matcherState.isListening = false;
            }
        }, { deep: true });
    };

    /**
     * El cajero selecciona manualmente un pago de la lista
     * @param {Object} pagoDigital - El pago digital seleccionado manualmente
     * @param {int} montoCarrito - El monto actual del carrito para validar contra el pago digital
     */
    const validarSeleccionManual = (pagoDigital, montoCarrito) => {

        if (montoCarrito <= 0) {
            matcherState.candidate = pagoDigital;
            matcherState.expectedAmount = Number(pagoDigital.amount);
            matcherState.matchType = 'DIRECT';

            matcherState.showModal = true;
            matcherState.isListening = false;
            matcherState.isLocked = true;

            return { valid: true, action: 'CONFIRM_DIRECT' };
        }

        const areEqual = Math.round(Number(pagoDigital.amount) * 100) === Math.round(Number(montoCarrito) * 100);
        
        if (!areEqual) {
            return { 
                valid: false, 
                error: 'AMOUNT_MISMATCH', 
                pagoDigitalAmount: pagoDigital.amount, 
                expected: montoCarrito 
            };
        }

        matcherState.candidate = pagoDigital;
        matcherState.expectedAmount = montoCarrito;
        matcherState.matchType = 'MANUAL';
        matcherState.showModal = true;
        matcherState.isListening = false;
        matcherState.isLocked = true;

        return { valid: true, action: 'CONFIRMAR' };
    };

    /**
     * Finaliza el proceso y limpia el estado del matcher
     */
    const resetMatcher = () => {
        matcherState.isListening = false;
        matcherState.expectedAmount = 0;
        matcherState.candidate = null;
        matcherState.showModal = false;
        matcherState.isLocked = false;
        matcherState.loading = false;
    };

    return {
        matcherState,
        iniciarEspera,
        cancelarEspera,
        vigilarEntrantes,
        validarSeleccionManual,
        resetMatcher
    };
}