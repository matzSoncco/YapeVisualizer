import { computed } from "vue";
import { store } from "@/store";

export function useSubscription() {
    const subscriptionStatus = computed(() => {
        const userProfile = store.userProfile || {};
        const subData = userProfile.subscription || {};

        if (!userProfile.email) {
            return {
                planName: 'Cargando...',
                status: 'loading',
                daysLeft: 0,
                isExpired: false,
                isActive: false,
                labelFecha: '...'
            };
        }

        const now = new Date();
        const trialEnd = subData.trialEndDate ? new Date(subData.trialEndDate) : null;
        const nextBillingDate = subData.nextBillingDate ? new Date(subData.nextBillingDate) : null;

        let daysLeft = 0;
        if (subData.status === 'trial' && trialEnd) {
            const diffTime = trialEnd.getTime() - now.getTime();
            daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        const isTrialExpired = subData.status === 'trial' && daysLeft <= 0;
        const isHardExpired = ['overdue', 'canceled', 'expired'].includes(subData.status);

        let etiqueta = 'Próximo cobro';
        let fechaMostrar = 'N/A';

        if (subData.status === 'trial' && trialEnd) {
             etiqueta = 'Fin de prueba';
             fechaMostrar = trialEnd.toLocaleDateString(); // Formato simple
        } else if (nextBillingDate) {
             fechaMostrar = nextBillingDate.toLocaleDateString();
        }

        return {
            // Datos Crudos
            planName: subData.planName || 'Gratuito',
            status: subData.status || 'trial',
            limitSucursales: subData.limitSucursales || 1,
            isActive: subData.isActive || false,
            
            // Datos Calculados
            daysLeft: daysLeft,
            isExpired: isTrialExpired || isHardExpired,
            labelFecha: etiqueta,
            fechaMostrar: fechaMostrar
        };
    });

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