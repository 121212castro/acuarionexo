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

messaging.onBackgroundMessage(function (payload) {
  const title = payload?.notification?.title || 'AcuarioNexo';
  const body = payload?.notification?.body || payload?.data?.title || 'Aviso pendiente';
  self.registration.showNotification(title, {
    body,
    tag: payload?.data?.task_id || body,
    data: payload?.data || {}
  });
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/acuarionexo/?avisos=1'));
});
