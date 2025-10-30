import { useEffect } from 'react';
import { notificationsAPI } from '../services/api';

export const usePushNotifications = (userId: string | null, userRole: string | null) => {
  useEffect(() => {
    if (!userId || !userRole) return;

    // Register service worker
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          
          // Wait for service worker to be ready
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  subscribeToPushNotifications(userId, userRole, registration);
                }
              });
            }
          });
          
          // Request push notification permission
          if (Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                // Subscribe to push notifications
                subscribeToPushNotifications(userId, userRole, registration);
              }
            });
          } else if (Notification.permission === 'granted') {
            // Already granted, subscribe
            subscribeToPushNotifications(userId, userRole, registration);
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, [userId, userRole]);
};

const subscribeToPushNotifications = async (
  userId: string,
  userRole: string,
  registration: ServiceWorkerRegistration
) => {
  try {
    // Wait for service worker to be ready
    await registration.update();
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    
    if (!existingSubscription) {
      // Check if VAPID key is available
      const vapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn('VAPID public key not configured. Push notifications will not work.');
        return;
      }
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource
      });

      // Send subscription to backend
      const response = await fetch('/api/Notifications/push-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          userRole,
          subscription: subscription.toJSON()
        })
      });

      if (response.ok) {
        console.log('Push notification subscription successful');
      } else {
        console.error('Failed to send subscription to backend');
      }
    } else {
      console.log('Already subscribed to push notifications');
    }
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
  }
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

