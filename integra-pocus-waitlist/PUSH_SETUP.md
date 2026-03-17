# Configuração: Push Notifications (admin)

## Bloco 3 — Firestore: tokens do admin

### Estrutura da coleção `admin_fcm_tokens`

- **Coleção:** `admin_fcm_tokens`
- **Documento:** ID = `userId` (o `uid` do Firebase Auth do admin)
- **Campos:**
  - `tokens`: array de strings (cada string é um FCM token do dispositivo)
  - `updatedAt`: número (timestamp em ms)

### Regras de segurança (Firestore)

No [Console do Firebase](https://console.firebase.google.com) → Firestore Database → Regras, **adicione** (ou ajuste) as regras para a coleção `admin_fcm_tokens`:

```
// Permite que apenas o usuário autenticado leia e escreva seu próprio documento de tokens
match /admin_fcm_tokens/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

Se você já tiver regras para `waiting_list` e outras coleções, mantenha-as e só inclua o bloco acima para `admin_fcm_tokens`.

---

## Bloco 2 — Firebase Console (você faz manualmente)

1. **FCM:** Project Settings → Cloud Messaging → confira que está ativo.
2. **Web Push (VAPID):** Em "Web configuration" ou "Web Push certificates", gere um par de chaves e copie a **Chave de chave pública** (VAPID key). Você vai colocar no código (variável de ambiente ou constante).
3. **Plano Blaze:** Upgrade do projeto para poder usar Cloud Functions.

---

## Variável de ambiente (VAPID)

Crie um arquivo `.env` na pasta `integra-pocus-waitlist` (e adicione `.env` ao `.gitignore` se ainda não estiver):

```
VITE_VAPID_KEY=sua-chave-vapid-aqui
```

A chave VAPID é usada no front para registrar o dispositivo e receber push.

---

## Bloco 4 — Deploy da Cloud Function

Na **raiz do repositório** (pasta `listadeesperaintegrapocus`):

1. Instale as dependências das functions:
   ```bash
   cd functions && npm install && npm run build && cd ..
   ```
2. Faça o deploy (projeto já está em `.firebaserc` como `lista-de-espera-pocus`):
   ```bash
   firebase deploy --only functions
   ```
3. É necessário que o projeto esteja no **plano Blaze** no Firebase Console.
