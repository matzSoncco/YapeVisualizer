import { computed } from "vue";
import { store } from "@/store";

/**
 * Composable para manejar la suscripción del usuario
 * @returns {Object} Funciones y propiedades relacionadas con la suscripción
 */
export function useSubscription() {
    /**
     * Estado de la suscripción del usuario
     * @returns {Object} Información detallada sobre el estado de la suscripción
     */
    const subscriptionStatus = computed(() => {
        const subData = store.userProfile?.subscription || {};
        const now = new Date();
        const trialEnd = subData.trialEndDate ? new Date(subData.trialEndDate) : null;
        const daysLeft = trialEnd ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : 0;
        const isTrialExpired = subData.status === 'trial' && daysLeft <= 0;
        const isPastDue = subData.status === 'overdue'
        const isCanceled = subData.status === 'canceled'
        const isExpired = subData.status === 'expired'

        const isHardBlocked = isTrialExpired || isPastDue || isCanceled || isExpired || subData.isActive === false

        if (subData.status === 'loading') {
            return {
                planName: 'Cargando...',
                status: 'loading',
                daysLeft: 0,
                isExpired: false,
                isActive: false,
                labelFecha: 'Cargando...'
            };
        }

        const nextBillingDate = subData.nextBillingDate ? new Date(subData.nextBillingDate) : null;

        let etiqueta = 'Próximo cobro';
        let fechaMostrar = 'N/A';

        if (subData.status === 'trial' && trialEnd) {
             etiqueta = 'Fin de prueba';
             fechaMostrar = trialEnd.toLocaleDateString();
        } else if (nextBillingDate) {
             fechaMostrar = nextBillingDate.toLocaleDateString();
        }

        return {
            ...subData,
            
            daysLeft,
            isHardBlocked: isHardBlocked,
            isNearExpiring: daysLeft > 0 && daysLeft <= 3,
            labelFecha: etiqueta,
            fechaMostrar: fechaMostrar
        };
    });

    /**
     * Determina si el usuario puede acceder a funciones premium
     * @returns {Boolean} true si tiene acceso, false en caso contrario
     */
    const canAccess = computed(() => {
        const info = subscriptionStatus.value;

        if (info.status === 'loading') return false;
        if (info.status === 'active') return true;

        if (info.status === 'trial') return !info.isExpired;

        return false;
    });

    return {
        subscriptionStatus,
        canAccess
    }
}