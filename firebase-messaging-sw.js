importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging.js");

firebase.initializeApp({
    apiKey: "AIzaSyAhkqqvn5_bD3hcUG4RGTSHcisv-Fh44D0",
    authDomain: "arx-test-d51f5.firebaseapp.com",
    projectId: "arx-test-d51f5",
    storageBucket: "arx-test-d51f5.firebasestorage.app",
    messagingSenderId: "586017596261",
    appId: "1:586017596261:web:84a71c13d5cfb2d548378c",
    measurementId: "G-3VQJ6WZL7V"
});

const messaging = firebase.messaging();

// استقبال الإشعارات في الخلفية
messaging.onBackgroundMessage((payload) => {
    console.log("📩 إشعار في الخلفية:", payload);
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/icon.png"
    });
});
