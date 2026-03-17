// Service worker para Firebase Cloud Messaging (push no background).
// Deve ficar na raiz do site (public/ no Vite = / na build).
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Mesma config do app (firebase.ts)
firebase.initializeApp({
  apiKey: 'AIzaSyD0fovP-ExOhdQoSl8D6LoOyPPylbmT6v8',
  authDomain: 'lista-de-espera-pocus.firebaseapp.com',
  projectId: 'lista-de-espera-pocus',
  storageBucket: 'lista-de-espera-pocus.firebasestorage.app',
  messagingSenderId: '582822758606',
  appId: '1:582822758606:web:9a5fb4b45646b705e3289f',
  measurementId: 'G-7VYVBHR0MR'
});

const messaging = firebase.messaging();

// Mensagens em background: personalizar notificação se for mensagem só de dados
messaging.onBackgroundMessage(function (payload) {
  var title = payload.notification?.title || 'Integra POCUS';
  var options = {
    body: payload.notification?.body || 'Nova atividade na lista de espera.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'integra-pocus-push',
    requireInteraction: false,
    data: payload.data || {}
  };
  return self.registration.showNotification(title, options);
});
