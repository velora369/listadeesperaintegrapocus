
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Configurações reais fornecidas pelo usuário
const firebaseConfig = {
  apiKey: "AIzaSyD0fovP-ExOhdQoSl8D6LoOyPPylbmT6v8",
  authDomain: "lista-de-espera-pocus.firebaseapp.com",
  projectId: "lista-de-espera-pocus",
  storageBucket: "lista-de-espera-pocus.firebasestorage.app",
  messagingSenderId: "582822758606",
  appId: "1:582822758606:web:9a5fb4b45646b705e3289f",
  measurementId: "G-7VYVBHR0MR"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Analytics se estiver em um ambiente de navegador
if (typeof window !== "undefined") {
  getAnalytics(app);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
