import * as functions from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Quando um novo lead é criado em waiting_list, envia push para todos os
 * tokens em admin_fcm_tokens (cada admin pode ter vários dispositivos).
 */
export const onNewLeadPush = functions.onDocumentCreated(
  {
    document: "waiting_list/{leadId}",
    region: "southamerica-east1",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const fullName = (data?.fullName as string) || "Alguém";
    const title = "Nova inscrição na lista";
    const body = `${fullName} entrou na lista de espera.`;

    const tokensSnap = await db.collection("admin_fcm_tokens").get();
    const allTokens: string[] = [];
    tokensSnap.docs.forEach((d) => {
      const list = (d.data().tokens as string[]) || [];
      allTokens.push(...list);
    });

    if (allTokens.length === 0) {
      console.log("Nenhum token de admin para enviar push.");
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      tokens: allTokens,
      notification: { title, body },
      webpush: {
        fcmOptions: {
          link: "/",
        },
      },
    };

    try {
      const res = await messaging.sendEachForMulticast(message);
      console.log(
        `Push enviado: ${res.successCount} sucesso, ${res.failureCount} falha.`
      );
    } catch (e) {
      console.error("Erro ao enviar push:", e);
    }
  }
);
