// tslint:disable-next-line:no-reference
/// <reference path="./service-worker.d.ts" />

importScripts('https://www.gstatic.com/firebasejs/5.5.6/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/5.5.6/firebase-messaging.js');

importScripts('/service-worker.js');

const sw = self as ServiceWorkerGlobalScope;

// TODO remove the hardcoding of environment dependent variables
firebase.initializeApp({
  messagingSenderId: '813975081296',
});

const messaging = firebase.messaging();

// This is only run when message is purely data
messaging.setBackgroundMessageHandler(() => {
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Hello darkness my old friend.',
    icon: '/static/logo.png',
  };

  return sw.registration.showNotification(notificationTitle, notificationOptions);
});

sw.addEventListener('push', event => {
  if (event.data) {
    const data = event.data!.json();
    console.log('Push notification received', data);
    console.log(event.data.json());
    event.waitUntil(
      sw.registration.showNotification(data.title || 'Fallback title', {
        body: data.body || 'Fallback body',
        image: data.image || '/logo.png',
        icon: '/favicon.ico',
      }),
    );
  }
});

sw.addEventListener('notificationclick', event => {
  event.waitUntil(
    sw.clients
      .matchAll({
        includeUncontrolled: true,
      })
      .then(
        (allClients): any => {
          let chatClient;

          // Let's see if we already have a chat window open:
          for (const client of allClients) {
            const url = new URL(client.url);

            if (url.pathname.includes('/')) {
              client.focus();
              chatClient = client;
              break;
            }
          }

          // If we didn't find an existing chat window,
          // open a new one:
          if (!chatClient) {
            return clients.openWindow('/chat/');
          }

          // Message the client:
          return chatClient.postMessage('New chat messages!');
        },
      ),
  );
});

// A simple, no-op service worker that takes immediate control.
// from: https://stackoverflow.com/a/38980776

self.addEventListener('install', () => {
  // Skip over the "waiting" lifecycle state, to ensure that our
  // new service worker is activated immediately, even if there's
  // another tab open controlled by our older service worker code.
  sw.skipWaiting();
});

sw.addEventListener('activate', () => {
  // Get a list of all the current open windows/tabs under
  // our service worker's control, and force them to reload.
  // This can "unbreak" any open windows/tabs as soon as the new
  // service worker activates, rather than users having to manually reload.
  sw.clients.matchAll({ type: 'window' }).then(windowClients => {
    windowClients.forEach(windowClient => {
      windowClient.navigate(windowClient.url).catch(e => console.error(e));
    });
  });
});
