// Service Worker for University Schedule App
const CACHE_NAME = 'university-schedule-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

// Activate event
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Push event for notifications
self.addEventListener('push', function(event) {
    const options = {
        body: event.data ? event.data.text() : 'تذكير من جامعتي',
        icon: 'https://public-frontend-cos.metadl.com/mgx/img/favicon.png',
        badge: 'https://public-frontend-cos.metadl.com/mgx/img/favicon.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'عرض البرنامج',
                icon: 'https://public-frontend-cos.metadl.com/mgx/img/favicon.png'
            },
            {
                action: 'close',
                title: 'إغلاق',
                icon: 'https://public-frontend-cos.metadl.com/mgx/img/favicon.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('جامعتي', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Background sync for offline functionality
self.addEventListener('sync', function(event) {
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Perform background sync tasks
            console.log('Background sync performed')
        );
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', function(event) {
    if (event.tag === 'daily-notification') {
        event.waitUntil(
            // Send daily notifications
            console.log('Periodic sync performed for daily notifications')
        );
    }
});