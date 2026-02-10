import { reactive, watch, computed } from 'vue';
import { useToast } from 'primevue/usetoast';

const matcherState = reactive({
    isListening: false,
    expectedAmount: 0,
    candidateYape: null,
    showModal: false,
    matchType: null,
    isLocked: false
});

export function useYapeMatcher() {
    const toast = useToast();

    /**
     * Inicia espera de un Yape con un monto específico
     * El cajero ha llenado el carrito y hace click en "Esperar Yape"
     * @param {int} montoTotal - Monto esperado para la transacción actual
     */
    const iniciarEspera = (montoTotal) => {
        if (montoTotal <= 0) {
            toast.add({ severity: 'warn', summary: 'Carrito vacío', life: 3000 });
            return;
        }

        matcherState.expectedAmount = Number(montoTotal);
        matcherState.isListening = true;
        matcherState.candidateYape = null;
        matcherState.isLocked = true;
        
        toast.add({ 
            severity: 'info', 
            summary: 'Esperando Yape...', 
            detail: `Monitoreando ingresos por S/ ${montoTotal.toFixed(2)}`,
            life: 3000 
        });
    };

    /**
     * Método para cancelar la espera de un Yape
     * Posibles errores en el proceso o decisión humana
     */
    const cancelarEspera = () => {
        matcherState.isListening = false;
        matcherState.expectedAmount = 0;
        matcherState.candidateYape = null;
        matcherState.showModal = false;
        matcherState.isLocked = false;
    };

    /**
     * Watcher para detectar nuevos Yapes entrantes y validar el monto esperado
     * @param {Ref} yapesPendientesRef - La referencia reactiva de useYape
     */
    const vigilarYapesEntrantes = (yapesPendientesRef) => {
        watch(yapesPendientesRef, (nuevosYapes) => {
            if (!matcherState.isListening || matcherState.showModal) return;

            const match = nuevosYapes.find(y => Math.abs(Number(y.amount) - matcherState.expectedAmount) < 0.1);

            if (match) {
                matcherState.candidateYape = match;
                matcherState.matchType = 'AUTO';
                matcherState.showModal = true;
                matcherState.isListening = false;
            }
        }, { deep: true });
    };

    /**
     * El cajero selecciona manualmente un Yape de la lista
     * @param {Object} yape - El Yape seleccionado manualmente
     * @param {int} montoCarrito - El monto actual del carrito para validar contra el Yape
     */
    const validarSeleccionManual = (yape, montoCarrito) => {
        if (montoCarrito <= 0) {
            matcherState.isLocked = true;
            matcherState.candidateYape = yape;
            return { valid: true, action: 'PRELLENAR' };
        }

        const diferencia = Math.abs(Number(yape.amount) - Number(montoCarrito));
        
        if (diferencia > 0.1) {
            toast.add({ 
                severity: 'error', 
                summary: 'Monto Incorrecto', 
                detail: `El Yape es de S/ ${yape.amount} pero el carrito espera S/ ${montoCarrito.toFixed(2)}`,
                life: 3000
            });
            return { valid: false };
        }

        matcherState.candidateYape = yape;
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
        matcherState.candidateYape = null;
        matcherState.showModal = false;
        matcherState.isLocked = false;
    };

    return {
        matcherState,
        iniciarEspera,
        cancelarEspera,
        vigilarYapesEntrantes,
        validarSeleccionManual,
        resetMatcher
    };
}