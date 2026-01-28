import { db } from '../firebaseConfig.js'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export const simularDatos = async (userEmail) => {
    if (!userEmail || typeof userEmail !== 'string') {
        console.error("Error: Se requiere un email válido para simular.");
        return;
    }

    const randomMonto = [10, 20, 50, 100][Math.floor(Math.random() * 4)];
    const randomName = ['Max', 'Peposinho', 'Juerges'][Math.floor(Math.random() * 3)];

    try {
        await addDoc(collection(db, "yape_notifications"), {
            userEmail: userEmail,
            senderName: randomName,
            amount: randomMonto,
            status: "pending",
            branchName: null,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error simulando yapeo: ", error);
    }
}