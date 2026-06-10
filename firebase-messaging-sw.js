/* AcuarioNexo · Firebase Cloud Messaging service worker */
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCOSMcEEHG97qgtSeetB03fDYk8r-0420c',
  authDomain: 'acuarionexo.firebaseapp.com',
  projectId: 'acuarionexo',
  storageBucket: 'acuarionexo.firebasestorage.app',
  messagingSenderId: '912663485955',
  appId: '1:912663485955:web:440ef36d43cecc37d4f836'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const title = notification.title || 'AcuarioNexo';
  const options = {
    body: notification.body || 'Tienes un aviso pendiente.',
    icon: '/icon-512.png',
    badge: '/icon-512.png',
    data: payload.data || {}
  };

  self.registration.showNotification(title, options);
});
