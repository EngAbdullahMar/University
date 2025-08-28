// University Schedule Management System
class UniversitySchedule {
    constructor() {
        this.lectures = JSON.parse(localStorage.getItem('lectures')) || [];
        this.notificationSettings = JSON.parse(localStorage.getItem('notificationSettings')) || {
            enabled: true,
            dailyTime: '06:00'
        };
        this.currentEditingId = null;
        
        this.init();
        this.registerServiceWorker();
    }

    init() {
        this.bindEvents();
        this.renderSchedule();
        this.setupNotifications();
        this.checkNotificationPermission();
    }

    // Service Worker Registration
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // Event Binding
    bindEvents() {
        // Add lecture button
        document.getElementById('addLectureBtn').addEventListener('click', () => {
            this.showAddForm();
        });

        // Cancel button
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideAddForm();
        });

        // Lecture form submission
        document.getElementById('lectureForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addLecture();
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportSchedule();
        });

        // Notification settings
        document.getElementById('notificationBtn').addEventListener('click', () => {
            this.showNotificationSettings();
        });

        document.getElementById('saveNotificationBtn').addEventListener('click', () => {
            this.saveNotificationSettings();
        });

        document.getElementById('requestPermissionBtn').addEventListener('click', () => {
            this.requestNotificationPermission();
        });

        document.getElementById('closeNotificationBtn').addEventListener('click', () => {
            this.hideNotificationSettings();
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchLectures(e.target.value);
        });

        // Modal events
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.hideEditModal();
            }
        });

        document.querySelector('.close').addEventListener('click', () => {
            this.hideEditModal();
        });

        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateLecture();
        });

        document.getElementById('deleteBtn').addEventListener('click', () => {
            this.deleteLecture();
        });
    }

    // Show/Hide Forms
    showAddForm() {
        document.getElementById('addLectureForm').classList.remove('hidden');
        document.getElementById('weeklySchedule').classList.add('hidden');
        document.getElementById('noLecturesMsg').classList.add('hidden');
    }

    hideAddForm() {
        document.getElementById('addLectureForm').classList.add('hidden');
        document.getElementById('lectureForm').reset();
        this.renderSchedule();
    }

    showNotificationSettings() {
        document.getElementById('notificationSettings').classList.remove('hidden');
        document.getElementById('weeklySchedule').classList.add('hidden');
        document.getElementById('noLecturesMsg').classList.add('hidden');
        
        // Load current settings
        document.getElementById('dailyNotificationTime').value = this.notificationSettings.dailyTime;
        document.getElementById('enableNotifications').checked = this.notificationSettings.enabled;
    }

    hideNotificationSettings() {
        document.getElementById('notificationSettings').classList.add('hidden');
        this.renderSchedule();
    }

    // Add New Lecture
    addLecture() {
        const lecture = {
            id: Date.now().toString(),
            name: document.getElementById('lectureName').value,
            type: document.getElementById('lectureType').value,
            doctor: document.getElementById('doctorName').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            location: document.getElementById('location').value,
            day: document.getElementById('day').value
        };

        // Validate required fields
        if (!lecture.name || !lecture.type || !lecture.startTime || !lecture.endTime || !lecture.location || !lecture.day) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        // Validate time
        if (lecture.startTime >= lecture.endTime) {
            alert('وقت البداية يجب أن يكون قبل وقت النهاية');
            return;
        }

        this.lectures.push(lecture);
        this.saveLectures();
        this.hideAddForm();
        this.scheduleNotifications();
        
        // Show success message
        this.showSuccessMessage('تم إضافة المحاضرة بنجاح');
    }

    // Update Lecture
    updateLecture() {
        const lectureId = document.getElementById('editLectureId').value;
        const lectureIndex = this.lectures.findIndex(l => l.id === lectureId);
        
        if (lectureIndex === -1) return;

        const updatedLecture = {
            id: lectureId,
            name: document.getElementById('editLectureName').value,
            type: document.getElementById('editLectureType').value,
            doctor: document.getElementById('editDoctorName').value,
            startTime: document.getElementById('editStartTime').value,
            endTime: document.getElementById('editEndTime').value,
            location: document.getElementById('editLocation').value,
            day: document.getElementById('editDay').value
        };

        // Validate time
        if (updatedLecture.startTime >= updatedLecture.endTime) {
            alert('وقت البداية يجب أن يكون قبل وقت النهاية');
            return;
        }

        this.lectures[lectureIndex] = updatedLecture;
        this.saveLectures();
        this.hideEditModal();
        this.renderSchedule();
        this.scheduleNotifications();
        
        this.showSuccessMessage('تم تحديث المحاضرة بنجاح');
    }

    // Delete Lecture
    deleteLecture() {
        if (confirm('هل أنت متأكد من حذف هذه المحاضرة؟')) {
            const lectureId = document.getElementById('editLectureId').value;
            this.lectures = this.lectures.filter(l => l.id !== lectureId);
            this.saveLectures();
            this.hideEditModal();
            this.renderSchedule();
            this.scheduleNotifications();
            
            this.showSuccessMessage('تم حذف المحاضرة بنجاح');
        }
    }

    // Render Schedule
    renderSchedule() {
        const scheduleGrid = document.getElementById('scheduleGrid');
        const noLecturesMsg = document.getElementById('noLecturesMsg');
        const weeklySchedule = document.getElementById('weeklySchedule');

        if (this.lectures.length === 0) {
            weeklySchedule.classList.add('hidden');
            noLecturesMsg.classList.remove('hidden');
            return;
        }

        weeklySchedule.classList.remove('hidden');
        noLecturesMsg.classList.add('hidden');

        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        
        scheduleGrid.innerHTML = '';
        
        days.forEach(day => {
            const dayLectures = this.lectures.filter(lecture => lecture.day === day);
            
            if (dayLectures.length > 0) {
                // Sort lectures by start time
                dayLectures.sort((a, b) => a.startTime.localeCompare(b.startTime));
                
                const dayColumn = document.createElement('div');
                dayColumn.className = 'day-column';
                
                dayColumn.innerHTML = `
                    <div class="day-header">${day}</div>
                    ${dayLectures.map(lecture => this.createLectureCard(lecture)).join('')}
                `;
                
                scheduleGrid.appendChild(dayColumn);
            }
        });
    }

    // Create Lecture Card
    createLectureCard(lecture) {
        const typeClass = lecture.type === 'عملي' ? 'practical' : '';
        return `
            <div class="lecture-card" onclick="schedule.showEditModal('${lecture.id}')">
                <div class="lecture-name">${lecture.name}</div>
                <div class="lecture-details">
                    <div class="lecture-detail">
                        <i class="fas fa-clock"></i>
                        ${this.formatTime(lecture.startTime)} - ${this.formatTime(lecture.endTime)}
                    </div>
                    <div class="lecture-detail">
                        <span class="lecture-type ${typeClass}">${lecture.type}</span>
                    </div>
                    ${lecture.doctor ? `<div class="lecture-detail">
                        <i class="fas fa-user-tie"></i>
                        ${lecture.doctor}
                    </div>` : ''}
                    <div class="lecture-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        ${lecture.location}
                    </div>
                </div>
            </div>
        `;
    }

    // Format Time
    formatTime(time) {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'مساءً' : 'صباحاً';
        const formattedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${formattedHour}:${minutes} ${ampm}`;
    }

    // Show/Hide Edit Modal
    showEditModal(lectureId) {
        const lecture = this.lectures.find(l => l.id === lectureId);
        if (!lecture) return;

        document.getElementById('editLectureId').value = lecture.id;
        document.getElementById('editLectureName').value = lecture.name;
        document.getElementById('editLectureType').value = lecture.type;
        document.getElementById('editDoctorName').value = lecture.doctor;
        document.getElementById('editStartTime').value = lecture.startTime;
        document.getElementById('editEndTime').value = lecture.endTime;
        document.getElementById('editLocation').value = lecture.location;
        document.getElementById('editDay').value = lecture.day;

        document.getElementById('editModal').classList.add('show');
    }

    hideEditModal() {
        document.getElementById('editModal').classList.remove('show');
    }

    // Search Functionality
    searchLectures(query) {
        if (!query.trim()) {
            this.renderSchedule();
            return;
        }

        const filteredLectures = this.lectures.filter(lecture => 
            lecture.name.toLowerCase().includes(query.toLowerCase()) ||
            lecture.doctor.toLowerCase().includes(query.toLowerCase()) ||
            lecture.location.toLowerCase().includes(query.toLowerCase()) ||
            lecture.type.toLowerCase().includes(query.toLowerCase()) ||
            lecture.day.toLowerCase().includes(query.toLowerCase())
        );

        this.renderFilteredSchedule(filteredLectures, query);
    }

    renderFilteredSchedule(filteredLectures, query) {
        const scheduleGrid = document.getElementById('scheduleGrid');
        const noLecturesMsg = document.getElementById('noLecturesMsg');
        const weeklySchedule = document.getElementById('weeklySchedule');

        if (filteredLectures.length === 0) {
            weeklySchedule.classList.add('hidden');
            noLecturesMsg.classList.remove('hidden');
            noLecturesMsg.innerHTML = `
                <i class="fas fa-search"></i>
                <h3>لا توجد نتائج للبحث</h3>
                <p>لا توجد محاضرات تطابق "${query}"</p>
            `;
            return;
        }

        weeklySchedule.classList.remove('hidden');
        noLecturesMsg.classList.add('hidden');

        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        
        scheduleGrid.innerHTML = '';
        
        days.forEach(day => {
            const dayLectures = filteredLectures.filter(lecture => lecture.day === day);
            
            if (dayLectures.length > 0) {
                dayLectures.sort((a, b) => a.startTime.localeCompare(b.startTime));
                
                const dayColumn = document.createElement('div');
                dayColumn.className = 'day-column';
                
                dayColumn.innerHTML = `
                    <div class="day-header">${day}</div>
                    ${dayLectures.map(lecture => this.createLectureCard(lecture)).join('')}
                `;
                
                scheduleGrid.appendChild(dayColumn);
            }
        });
    }

    // Export Schedule
    exportSchedule() {
        const exportBtn = document.getElementById('exportBtn');
        exportBtn.classList.add('exporting');
        exportBtn.disabled = true;

        setTimeout(() => {
            const scheduleData = {
                lectures: this.lectures,
                exportDate: new Date().toLocaleDateString('ar-SA'),
                totalLectures: this.lectures.length
            };

            const jsonString = JSON.stringify(scheduleData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `جدول_المحاضرات_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            exportBtn.classList.remove('exporting');
            exportBtn.disabled = false;
            
            this.showSuccessMessage('تم تصدير البرنامج بنجاح');
        }, 1000);
    }

    // Notification Functions
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            alert('هذا المتصفح لا يدعم الإشعارات');
            return;
        }

        const permission = await Notification.requestPermission();
        this.updatePermissionStatus(permission);
        
        if (permission === 'granted') {
            this.showSuccessMessage('تم منح إذن الإشعارات بنجاح');
            this.scheduleNotifications();
        }
    }

    checkNotificationPermission() {
        if ('Notification' in window) {
            this.updatePermissionStatus(Notification.permission);
        }
    }

    updatePermissionStatus(permission) {
        const requestBtn = document.getElementById('requestPermissionBtn');
        let statusText = '';
        let statusClass = '';

        switch (permission) {
            case 'granted':
                statusText = 'تم منح الإذن - الإشعارات مفعلة';
                statusClass = 'permission-granted';
                requestBtn.style.display = 'none';
                break;
            case 'denied':
                statusText = 'تم رفض الإذن - يرجى تفعيل الإشعارات من إعدادات المتصفح';
                statusClass = 'permission-denied';
                requestBtn.style.display = 'inline-flex';
                break;
            default:
                statusText = 'يرجى منح الإذن للإشعارات';
                statusClass = 'permission-default';
                requestBtn.style.display = 'inline-flex';
        }

        let statusDiv = document.getElementById('permissionStatus');
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'permissionStatus';
            statusDiv.className = 'permission-status';
            document.getElementById('requestPermissionBtn').parentNode.appendChild(statusDiv);
        }
        
        statusDiv.textContent = statusText;
        statusDiv.className = `permission-status ${statusClass}`;
    }

    saveNotificationSettings() {
        this.notificationSettings = {
            enabled: document.getElementById('enableNotifications').checked,
            dailyTime: document.getElementById('dailyNotificationTime').value
        };
        
        localStorage.setItem('notificationSettings', JSON.stringify(this.notificationSettings));
        this.scheduleNotifications();
        this.showSuccessMessage('تم حفظ إعدادات الإشعارات');
    }

    scheduleNotifications() {
        if (!this.notificationSettings.enabled || Notification.permission !== 'granted') {
            return;
        }

        // Schedule daily notifications
        this.scheduleDailyNotifications();
        
        // Schedule pre-lecture notifications
        this.schedulePreLectureNotifications();
    }

    scheduleDailyNotifications() {
        const dailyTime = this.notificationSettings.dailyTime;
        const [hours, minutes] = dailyTime.split(':');
        
        const now = new Date();
        const notificationTime = new Date();
        notificationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (notificationTime <= now) {
            notificationTime.setDate(notificationTime.getDate() + 1);
        }
        
        const timeUntilNotification = notificationTime.getTime() - now.getTime();
        
        setTimeout(() => {
            this.sendDailyNotification();
            // Schedule for next day
            setInterval(() => {
                this.sendDailyNotification();
            }, 24 * 60 * 60 * 1000);
        }, timeUntilNotification);
    }

    sendDailyNotification() {
        const today = new Date().toLocaleDateString('ar-SA', { weekday: 'long' });
        const todayLectures = this.lectures.filter(lecture => lecture.day === today);
        
        const title = 'جامعتي - برنامج اليوم';
        const body = todayLectures.length > 0 
            ? `لديك ${todayLectures.length} محاضرة اليوم`
            : 'لا توجد محاضرات اليوم';
        
        new Notification(title, {
            body: body,
            icon: 'https://public-frontend-cos.metadl.com/mgx/img/favicon.png',
            badge: 'https://public-frontend-cos.metadl.com/mgx/img/favicon.png'
        });
    }

    schedulePreLectureNotifications() {
        this.lectures.forEach(lecture => {
            this.schedulePreLectureNotification(lecture);
        });
    }

    schedulePreLectureNotification(lecture) {
        const dayNames = {
            'الأحد': 0, 'الاثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3,
            'الخميس': 4, 'الجمعة': 5, 'السبت': 6
        };
        
        const lectureDay = dayNames[lecture.day];
        const [hours, minutes] = lecture.startTime.split(':');
        
        const now = new Date();
        const lectureTime = new Date();
        
        // Find next occurrence of this day
        const daysUntilLecture = (lectureDay + 7 - now.getDay()) % 7;
        lectureTime.setDate(now.getDate() + daysUntilLecture);
        lectureTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // If it's today but the time has passed, schedule for next week
        if (daysUntilLecture === 0 && lectureTime <= now) {
            lectureTime.setDate(lectureTime.getDate() + 7);
        }
        
        // Schedule notification 30 minutes before
        const notificationTime = new Date(lectureTime.getTime() - 30 * 60 * 1000);
        const timeUntilNotification = notificationTime.getTime() - now.getTime();
        
        if (timeUntilNotification > 0) {
            setTimeout(() => {
                const title = 'تذكير محاضرة';
                const body = `${lecture.name} - ${this.formatTime(lecture.startTime)}\n${lecture.location}${lecture.doctor ? `\nد. ${lecture.doctor}` : ''}`;
                
                new Notification(title, {
                    body: body,
                    icon: 'https://public-frontend-cos.metadl.com/mgx/img/favicon.png',
                    badge: 'https://public-frontend-cos.metadl.com/mgx/img/favicon.png'
                });
            }, timeUntilNotification);
        }
    }

    setupNotifications() {
        if ('Notification' in window && Notification.permission === 'granted') {
            this.scheduleNotifications();
        }
    }

    // Save lectures to localStorage
    saveLectures() {
        localStorage.setItem('lectures', JSON.stringify(this.lectures));
    }

    // Show success message
    showSuccessMessage(message) {
        // Create and show toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: bold;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize the application
let schedule;
document.addEventListener('DOMContentLoaded', function() {
    schedule = new UniversitySchedule();
    console.log('University Schedule App initialized');
});


// ---------------- Firebase Cloud Messaging ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging.js";

// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAhkqqvn5_bD3hcUG4RGTSHcisv-Fh44D0",
    authDomain: "arx-test-d51f5.firebaseapp.com",
    projectId: "arx-test-d51f5",
    storageBucket: "arx-test-d51f5.firebasestorage.app",
    messagingSenderId: "586017596261",
    appId: "1:586017596261:web:84a71c13d5cfb2d548378c",
    measurementId: "G-3VQJ6WZL7V"
};

// تهيئة Firebase
const appFirebase = initializeApp(firebaseConfig);
const messaging = getMessaging(appFirebase);

// زر تفعيل الإشعارات
document.getElementById("enable-notifications").addEventListener("click", async () => {
    try {
        const token = await getToken(messaging, {
            vapidKey: "BMmGET1D9b2uhgP8ZtElvIfgrmUoBF2Pbm606QdOvYTxifBE6gdpOFoeFgs1jP-dTUoexah3BKFtWPmxYqxkx60"
        });
        if (token) {
            console.log("✅ تم الحصول على التوكن:", token);
            alert("تم تفعيل إشعارات Firebase بنجاح!");
        } else {
            console.warn("⚠️ لم يتم السماح بالإشعارات");
        }
    } catch (err) {
        console.error("❌ خطأ أثناء جلب التوكن:", err);
    }
});

// استقبال الإشعارات عند فتح الصفحة
onMessage(messaging, (payload) => {
    console.log("📩 إشعار جديد:", payload);
    new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/icon.png"
    });
});
// ----------------------------------------------------------
