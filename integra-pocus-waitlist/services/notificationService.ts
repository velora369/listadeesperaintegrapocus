import { getToken } from "firebase/messaging";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getMessagingSafe } from "../firebase";

const ADMIN_TOKENS_COLLECTION = "admin_fcm_tokens";

function getVapidKey(): string {
  const key = import.meta.env.VITE_VAPID_KEY;
  if (!key) {
    console.warn(
      "VITE_VAPID_KEY não definida. Defina no .env para ativar push. Gere em Firebase Console → Cloud Messaging → Web Push certificates."
    );
  }
  return key || "";
}

/**
 * Registra o service worker do FCM e retorna o registration (para getToken).
 */
async function getSwRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js")
      || await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.error("Erro ao registrar service worker:", e);
    return null;
  }
}

export type NotificationStatus =
  | { status: "unsupported" }
  | { status: "permission-denied" }
  | { status: "no-vapid" }
  | { status: "error"; message: string }
  | { status: "ready" };

/**
 * Pede permissão, obtém o token FCM e salva no Firestore para o usuário logado.
 */
export async function enablePushNotifications(
  userId: string
): Promise<NotificationStatus> {
  if (typeof window === "undefined") return { status: "unsupported" };

  const vapidKey = getVapidKey();
  if (!vapidKey.trim()) return { status: "no-vapid" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { status: "permission-denied" };

  const messaging = await getMessagingSafe();
  if (!messaging) return { status: "unsupported" };

  const swReg = await getSwRegistration();
  if (!swReg) return { status: "error", message: "Service worker não disponível." };

  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swReg,
    });
    if (!token) return { status: "error", message: "Não foi possível obter o token." };

    const ref = doc(db, ADMIN_TOKENS_COLLECTION, userId);
    const snap = await getDoc(ref);
    const existing = (snap.data()?.tokens as string[]) || [];
    const tokens = existing.includes(token) ? existing : [...existing, token];

    await setDoc(ref, {
      tokens,
      updatedAt: Date.now(),
    });
    return { status: "ready" };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { status: "error", message };
  }
}

/**
 * Verifica se as notificações estão suportadas (HTTPS, SW, etc.).
 */
export async function isPushSupported(): Promise<boolean> {
  const m = await getMessagingSafe();
  return m != null;
}
