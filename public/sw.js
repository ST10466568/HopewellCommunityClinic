// Service Worker for Push Notifications
// Save this file as public/sw.js

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data?.text()}"`);

  const data = event.data ? JSON.parse(event.data.text()) : {};
  const title = data.title || 'Hopewell Clinic';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.data || {},
    requireInteraction: false,
    tag: data.notificationId || 'notification',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received.');

  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || '/';

  event.waitUntil(
    clients.openWindow(url)
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed.');
  
  // Optionally mark notification as read
  if (event.notification.data?.notificationId) {
    // Could send a request to mark as read
    fetch(`/api/Notifications/${event.notification.data.notificationId}/read`, {
      method: 'PUT',
      credentials: 'include'
    }).catch(err => console.error('Error marking notification as read:', err));
  }
});

