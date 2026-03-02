import { db } from '../firebaseConfig.js'
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'

/**
 * Simula la llegada de una notificación de billetera digital
 * @param {string} userId - El UID del usuario (dueño de la cuenta)
 */
export const simularDatos = async (userId) => {
    if (!userId) {
        console.error("Error: Se requiere el UID del usuario para simular en su subcolección.");
        return;
    }

    const randomMonto = [10, 20, 50, 100][Math.floor(Math.random() * 4)];
    const randomName = ['Max', 'Peposinho', 'Juerges'][Math.floor(Math.random() * 3)];
    const wallets = ['YAPE', 'PLIN'];
    const randomWallet = wallets[Math.floor(Math.random() * wallets.length)];

    try {
        // OPCIONAL: Esto asegura que el documento del usuario exista para que la subcolección sea visible
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, { lastActivity: serverTimestamp() }, { merge: true });

        const userNotificationsRef = collection(db, "users", userId, "yape_notifications");
        const docRef = await addDoc(userNotificationsRef, {
            senderName: randomName,
            amount: Number(randomMonto),
            wallet: randomWallet,
            status: "pending",
            branchId: null,
            branchName: null,
            timestamp: serverTimestamp(),
            metadata: {
                isSimulation: true,
                simulatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error("Error simulando yapeo: ", error);
    }
}