
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  FirestoreError
} from "firebase/firestore";
import { db } from "../firebase";
import { Lead } from '../types';

// IMPORTANTE: Verifique se este nome é IGUAL ao que aparece no Console do Firebase
const LEADS_COLLECTION = 'waiting_list';

export const dbService = {
  saveLead: async (lead: Omit<Lead, 'id' | 'timestamp'>): Promise<string> => {
    const cleanData = JSON.parse(JSON.stringify(lead));
    const docRef = await addDoc(collection(db, LEADS_COLLECTION), {
      ...cleanData,
      timestamp: Date.now(),
      tags: [],
    });
    return docRef.id;
  },

  subscribeToLeads: (
    callback: (leads: Lead[]) => void, 
    errorCallback?: (error: FirestoreError) => void
  ) => {
    const q = query(collection(db, LEADS_COLLECTION), orderBy('timestamp', 'desc'));
    return onSnapshot(
      q, 
      (snapshot) => {
        const leads = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Lead[];
        callback(leads);
      },
      (error) => {
        if (errorCallback) errorCallback(error);
      }
    );
  },

  updateLeadTags: async (id: string, tags: string[]) => {
    const leadRef = doc(db, LEADS_COLLECTION, id);
    await updateDoc(leadRef, { tags });
  },

  deleteLead: async (id: string) => {
    if (!id) {
      console.error("Tentativa de exclusão sem ID válido.");
      return;
    }
    
    console.log(`Iniciando deleteDoc para ID: ${id} na coleção: ${LEADS_COLLECTION}`);
    
    try {
      const leadRef = doc(db, LEADS_COLLECTION, id);
      await deleteDoc(leadRef);
      console.log("Comando deleteDoc enviado e processado com sucesso.");
    } catch (error) {
      console.error("Falha fatal no deleteDoc:", error);
      throw error;
    }
  }
};
