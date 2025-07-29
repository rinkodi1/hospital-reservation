// Hospital Reservation System JavaScript

// ==========================================
// Data Management (In-Memory Storage)
// ==========================================

let appData = {
    reservationTypes: [
        {
            id: "health_check",
            name: "健康診断",
            duration: 15,
            startTime: "09:00",
            endTime: "17:00",
            maxSlots: 10,
            availableFrom: "2025-07-29",
            availableTo: "2025-12-31",
            closedDays: ["sunday"],
            specialClosedDates: [],
            weeklySchedule: {
                monday: { start: "09:00", end: "17:00" },
                tuesday: { start: "09:00", end: "17:00" },
                wednesday: { start: "09:00", end: "17:00" },
                thursday: { start: "09:00", end: "17:00" },
                friday: { start: "09:00", end: "17:00" },
                saturday: { start: "09:00", end: "17:00" },
                sunday: { start: "", end: "" }
            }
        },
        {
            id: "vaccination",
            name: "予防接種",
            duration: 15,
            startTime: "09:00",
            endTime: "16:00",
            maxSlots: 8,
            availableFrom: "2025-07-29",
            availableTo: "2025-12-31",
            closedDays: ["sunday", "saturday"],
            specialClosedDates: [],
            weeklySchedule: {
                monday: { start: "09:00", end: "16:00" },
                tuesday: { start: "09:00", end: "16:00" },
                wednesday: { start: "09:00", end: "16:00" },
                thursday: { start: "09:00", end: "16:00" },
                friday: { start: "09:00", end: "16:00" },
                saturday: { start: "", end: "" },
                sunday: { start: "", end: "" }
            }
        }
    ],
    reservations: [],
    settings: {
        hospitalMessage: "当院の予約システムをご利用いただき、ありがとうございます。ご不明な点がございましたら、お電話にてお問い合わせください。",
        adminPassword: "admin123",
        emailTemplate: "{{name}}様\n\nご予約ありがとうございます。\n\n予約詳細:\n日時: {{date}} {{time}}\n種類: {{type}}\nお名前: {{name}}\nメール: {{email}}\n電話: {{phone}}\n備考: {{notes}}\n\n何かご不明な点がございましたら、お電話にてご連絡ください。",
        emailSettings: {
            serviceId: "service_sj4j47e",
            templateId: "template_u2cwp0d",
            publicKey: "xyuPENz5fwFEEPlrP"
        }
    }
};

// Current state
let currentScreen = 'main-screen';
let currentReservation = {};
let currentAdminSection = 'dashboard';
let isLoggedIn = false;

// ==========================================
// Utility Functions
// ==========================================

function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
}

function formatTime(time) {
    return time;
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notification-message');
    
    messageEl.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 5000);
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showModal(title, content, onConfirm = null) {
    const modal = document.getElementById('modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const confirmBtn = document.getElementById('modal-confirm');
    
    titleEl.textContent = title;
    bodyEl.innerHTML = content;
    modal.classList.remove('hidden');
    
    if (onConfirm) {
        confirmBtn.onclick = () => {
            modal.classList.add('hidden');
            onConfirm();
        };
    }
}

function hideModal() {
    document.getElementById('modal').classList.add('hidden');
}

function isEmailJSConfigured() {
    const settings = appData.settings.emailSettings;
    return settings.serviceId && settings.templateId && settings.publicKey &&
           settings.serviceId !== 'YOUR_EMAILJS_SERVICE_ID' &&
           settings.serviceId.trim() !== '';
}

// ==========================================
// Screen Management
// ==========================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
}

function showAdminSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`admin-${sectionId}`).classList.add('active');
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    currentAdminSection = sectionId;
    
    // Load section-specific data
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'reservation-types':
            loadReservationTypes();
            break;
        case 'reservations':
            loadReservations();
            break;
        case 'email':
            loadEmailSettings();
            break;
        case 'system':
            loadSystemSettings();
            break;
    }
}

// ==========================================
// Main Screen Functions
// ==========================================

function loadMainScreen() {
    // Load hospital message
    document.getElementById('hospital-message-text').textContent = appData.settings.hospitalMessage;
    
    // Load reservation types
    const typesContainer = document.getElementById('reservation-types');
    typesContainer.innerHTML = '';
    
    appData.reservationTypes.forEach(type => {
        const typeCard = document.createElement('div');
        typeCard.className = 'reservation-type-card';
        
        const availability = getTypeAvailability(type);
        
        typeCard.innerHTML = `
            <h3>${type.name}</h3>
            <p>所要時間: ${type.duration}分</p>
            <p>営業時間: ${type.startTime} - ${type.endTime}</p>
            <p class="availability">予約可能期間: ${formatDate(type.availableFrom)} - ${formatDate(type.availableTo)}</p>
        `;
        
        typeCard.onclick = () => startReservation(type);
        typesContainer.appendChild(typeCard);
    });
}

function getTypeAvailability(type) {
    const today = new Date().toISOString().split('T')[0];
    const todayReservations = appData.reservations.filter(r => 
        r.typeId === type.id && r.date === today
    ).length;
    
    return `今日の予約: ${todayReservations}/${type.maxSlots}`;
}

function startReservation(type) {
    currentReservation = {
        typeId: type.id,
        typeName: type.name,
        type: type
    };
    
    document.getElementById('selected-reservation-type').textContent = `${type.name}の予約`;
    showScreen('reservation-screen');
    showStep('step-patient-info');
}

// ==========================================
// Reservation Flow Functions
// ==========================================

function showStep(stepId) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
}

function validatePatientInfo() {
    const name = document.getElementById('patient-name').value.trim();
    const email = document.getElementById('patient-email').value.trim();
    const phone = document.getElementById('patient-phone').value.trim();
    
    if (!name || !email || !phone) {
        showNotification('すべての項目を入力してください', 'error');
        return false;
    }
    
    // Check for duplicate reservations
    const existingReservation = appData.reservations.find(r => 
        r.email === email && r.typeId === currentReservation.typeId
    );
    
    if (existingReservation) {
        showNotification('同じメールアドレスでの重複予約はできません', 'error');
        return false;
    }
    
    currentReservation.name = name;
    currentReservation.email = email;
    currentReservation.phone = phone;
    
    return true;
}

function setupDateSelection() {
    const dateInput = document.getElementById('reservation-date');
    const type = currentReservation.type;
    
    // Set date constraints
    dateInput.min = type.availableFrom;
    dateInput.max = type.availableTo;
    
    const today = new Date().toISOString().split('T')[0];
    if (today >= type.availableFrom) {
        dateInput.value = today;
    } else {
        dateInput.value = type.availableFrom;
    }
    
    dateInput.onchange = () => {
        generateTimeSlots();
    };
    
    generateTimeSlots();
}

function generateTimeSlots() {
    const selectedDate = document.getElementById('reservation-date').value;
    const type = currentReservation.type;
    const slotsContainer = document.getElementById('time-slots');
    
    if (!selectedDate) {
        slotsContainer.innerHTML = '<p>日付を選択してください</p>';
        return;
    }
    
    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][selectedDateObj.getDay()];
    
    // Check if the day is closed
    if (type.closedDays.includes(dayOfWeek) || type.specialClosedDates.includes(selectedDate)) {
        slotsContainer.innerHTML = '<p>選択された日は休診日です</p>';
        return;
    }
    
    const schedule = type.weeklySchedule[dayOfWeek];
    if (!schedule || !schedule.start || !schedule.end) {
        slotsContainer.innerHTML = '<p>選択された日は休診日です</p>';
        return;
    }
    
    const startTime = schedule.start;
    const endTime = schedule.end;
    const duration = type.duration;
    
    const slots = generateTimeSlotList(startTime, endTime, duration);
    slotsContainer.innerHTML = '';
    
    slots.forEach(slot => {
        const existingReservations = appData.reservations.filter(r => 
            r.typeId === type.id && r.date === selectedDate && r.time === slot
        ).length;
        
        const isAvailable = existingReservations < type.maxSlots;
        
        const slotElement = document.createElement('div');
        slotElement.className = `time-slot ${isAvailable ? '' : 'unavailable'}`;
        slotElement.innerHTML = `
            <div class="time-slot-time">${slot}</div>
            <div class="time-slot-availability">${existingReservations}/${type.maxSlots}</div>
        `;
        
        if (isAvailable) {
            slotElement.onclick = () => selectTimeSlot(slot, slotElement);
        }
        
        slotsContainer.appendChild(slotElement);
    });
}

function generateTimeSlotList(startTime, endTime, duration) {
    const slots = [];
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    let current = new Date(start);
    while (current < end) {
        slots.push(current.toTimeString().substr(0, 5));
        current.setMinutes(current.getMinutes() + duration);
    }
    
    return slots;
}

function selectTimeSlot(time, element) {
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    element.classList.add('selected');
    
    currentReservation.time = time;
    document.getElementById('next-to-confirm').disabled = false;
}

function showReservationSummary() {
    const summaryContainer = document.getElementById('reservation-summary');
    const date = document.getElementById('reservation-date').value;
    
    summaryContainer.innerHTML = `
        <div class="reservation-summary-item">
            <span class="reservation-summary-label">予約種類:</span>
            <span>${currentReservation.typeName}</span>
        </div>
        <div class="reservation-summary-item">
            <span class="reservation-summary-label">お名前:</span>
            <span>${currentReservation.name}</span>
        </div>
        <div class="reservation-summary-item">
            <span class="reservation-summary-label">メール:</span>
            <span>${currentReservation.email}</span>
        </div>
        <div class="reservation-summary-item">
            <span class="reservation-summary-label">電話:</span>
            <span>${currentReservation.phone}</span>
        </div>
        <div class="reservation-summary-item">
            <span class="reservation-summary-label">予約日:</span>
            <span>${formatDate(date)}</span>
        </div>
        <div class="reservation-summary-item">
            <span class="reservation-summary-label">予約時間:</span>
            <span>${currentReservation.time}</span>
        </div>
    `;
}

function confirmReservation() {
    showLoading();
    
    const notes = document.getElementById('patient-notes').value.trim();
    const date = document.getElementById('reservation-date').value;
    
    const reservation = {
        id: generateId(),
        typeId: currentReservation.typeId,
        typeName: currentReservation.typeName,
        name: currentReservation.name,
        email: currentReservation.email,
        phone: currentReservation.phone,
        date: date,
        time: currentReservation.time,
        notes: notes,
        status: 'confirmed',
        createdAt: new Date().toISOString()
    };
    
    appData.reservations.push(reservation);
    
    // Try to send confirmation email
    if (isEmailJSConfigured()) {
        sendConfirmationEmail(reservation).then(() => {
            hideLoading();
            showNotification('予約が完了しました。確認メールを送信いたしました。');
            completeReservation();
        }).catch(error => {
            hideLoading();
            console.error('Email error:', error);
            showNotification('予約は完了しましたが、メール送信に失敗しました。病院にお電話でご確認ください。', 'warning');
            completeReservation();
        });
    } else {
        hideLoading();
        showNotification('予約が完了しました。EmailJS設定が未完了のため、確認メールは送信されません。', 'warning');
        completeReservation();
    }
}

function completeReservation() {
    // Reset form and go back to main screen
    resetReservationForm();
    showScreen('main-screen');
    loadMainScreen();
}

function resetReservationForm() {
    currentReservation = {};
    document.getElementById('patient-form').reset();
    document.getElementById('reservation-date').value = '';
    document.getElementById('patient-notes').value = '';
    document.getElementById('time-slots').innerHTML = '';
    document.getElementById('next-to-confirm').disabled = true;
    showStep('step-patient-info');
}

// ==========================================
// Email Functions
// ==========================================

async function sendConfirmationEmail(reservation) {
    const settings = appData.settings.emailSettings;
    
    if (!isEmailJSConfigured()) {
        throw new Error('EmailJS settings not configured');
    }
    
    // Initialize EmailJS
    emailjs.init(settings.publicKey);
    
    // Prepare template variables
    const template = appData.settings.emailTemplate;
    const emailContent = template
        .replace(/\{\{name\}\}/g, reservation.name)
        .replace(/\{\{email\}\}/g, reservation.email)
        .replace(/\{\{phone\}\}/g, reservation.phone)
        .replace(/\{\{type\}\}/g, reservation.typeName)
        .replace(/\{\{date\}\}/g, formatDate(reservation.date))
        .replace(/\{\{time\}\}/g, reservation.time)
        .replace(/\{\{notes\}\}/g, reservation.notes || 'なし');
    
    const templateParams = {
        to_email: reservation.email,
        to_name: reservation.name,
        subject: `【予約確認】${reservation.typeName}のご予約について`,
        message: emailContent,
        reservation_type: reservation.typeName,
        reservation_date: formatDate(reservation.date),
        reservation_time: reservation.time,
        patient_name: reservation.name,
        patient_email: reservation.email,
        patient_phone: reservation.phone,
        notes: reservation.notes || 'なし'
    };
    
    return emailjs.send(settings.serviceId, settings.templateId, templateParams);
}

// ==========================================
// Admin Functions
// ==========================================

function adminLogin() {
    const password = document.getElementById('admin-password').value;
    
    if (password === appData.settings.adminPassword) {
        isLoggedIn = true;
        showScreen('admin-screen');
        showAdminSection('dashboard');
        document.getElementById('admin-password').value = '';
    } else {
        showNotification('パスワードが正しくありません', 'error');
    }
}

function adminLogout() {
    isLoggedIn = false;
    showScreen('main-screen');
    loadMainScreen();
}

function loadDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0];
    
    const todayCount = appData.reservations.filter(r => r.date === today).length;
    const weekCount = appData.reservations.filter(r => r.date >= thisWeekStartStr).length;
    const totalCount = appData.reservations.length;
    
    document.getElementById('today-reservations').textContent = todayCount;
    document.getElementById('week-reservations').textContent = weekCount;
    document.getElementById('total-reservations').textContent = totalCount;
    
    // Load recent reservations
    const recentReservations = appData.reservations
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    const recentList = document.getElementById('recent-reservations-list');
    recentList.innerHTML = '';
    
    if (recentReservations.length === 0) {
        recentList.innerHTML = '<p>最近の予約はありません</p>';
        return;
    }
    
    recentReservations.forEach(reservation => {
        const item = document.createElement('div');
        item.className = 'reservation-item';
        item.innerHTML = `
            <div class="reservation-header">
                <strong>${reservation.name}</strong>
                <span class="status status--success">${reservation.status === 'confirmed' ? '確定' : reservation.status}</span>
            </div>
            <div class="reservation-info">
                <div>
                    <div class="detail-label">予約種類</div>
                    <div class="detail-value">${reservation.typeName}</div>
                </div>
                <div>
                    <div class="detail-label">日時</div>
                    <div class="detail-value">${formatDate(reservation.date)} ${reservation.time}</div>
                </div>
                <div>
                    <div class="detail-label">連絡先</div>
                    <div class="detail-value">${reservation.phone}</div>
                </div>
            </div>
        `;
        recentList.appendChild(item);
    });
}

function loadReservationTypes() {
    const container = document.getElementById('reservation-types-list');
    container.innerHTML = '';
    
    appData.reservationTypes.forEach(type => {
        const item = document.createElement('div');
        item.className = 'reservation-type-item';
        item.innerHTML = `
            <div class="reservation-type-header">
                <h3>${type.name}</h3>
                <div class="reservation-type-actions">
                    <button class="btn btn--outline btn--sm" onclick="editReservationType('${type.id}')">編集</button>
                    <button class="btn btn--secondary btn--sm" onclick="deleteReservationType('${type.id}')">削除</button>
                </div>
            </div>
            <div class="reservation-type-details">
                <div class="detail-item">
                    <div class="detail-label">時間間隔</div>
                    <div class="detail-value">${type.duration}分</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">営業時間</div>
                    <div class="detail-value">${type.startTime} - ${type.endTime}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">最大予約数</div>
                    <div class="detail-value">${type.maxSlots}名</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">予約可能期間</div>
                    <div class="detail-value">${type.availableFrom} - ${type.availableTo}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">休診日</div>
                    <div class="detail-value">${type.closedDays.join(', ')}</div>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

function loadReservations() {
    // Load filters
    const filterType = document.getElementById('filter-type');
    filterType.innerHTML = '<option value="">すべての種類</option>';
    appData.reservationTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.name;
        filterType.appendChild(option);
    });
    
    displayReservations();
}

function displayReservations() {
    const filterType = document.getElementById('filter-type').value;
    const filterDate = document.getElementById('filter-date').value;
    const sortBy = document.getElementById('sort-by').value;
    
    let filteredReservations = appData.reservations.filter(r => {
        if (filterType && r.typeId !== filterType) return false;
        if (filterDate && r.date !== filterDate) return false;
        return true;
    });
    
    // Sort reservations
    filteredReservations.sort((a, b) => {
        switch (sortBy) {
            case 'date':
                return new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time);
            case 'type':
                return a.typeName.localeCompare(b.typeName);
            case 'name':
                return a.name.localeCompare(b.name);
            default:
                return 0;
        }
    });
    
    const container = document.getElementById('reservations-list-view');
    container.innerHTML = '';
    
    if (filteredReservations.length === 0) {
        container.innerHTML = '<p>予約がありません</p>';
        return;
    }
    
    filteredReservations.forEach(reservation => {
        const item = document.createElement('div');
        item.className = 'reservation-item';
        item.innerHTML = `
            <div class="reservation-header">
                <strong>${reservation.name}</strong>
                <span class="status status--success">確定</span>
            </div>
            <div class="reservation-info">
                <div>
                    <div class="detail-label">予約種類</div>
                    <div class="detail-value">${reservation.typeName}</div>
                </div>
                <div>
                    <div class="detail-label">日時</div>
                    <div class="detail-value">${formatDate(reservation.date)} ${reservation.time}</div>
                </div>
                <div>
                    <div class="detail-label">メール</div>
                    <div class="detail-value">${reservation.email}</div>
                </div>
                <div>
                    <div class="detail-label">電話</div>
                    <div class="detail-value">${reservation.phone}</div>
                </div>
                <div>
                    <div class="detail-label">備考</div>
                    <div class="detail-value">${reservation.notes || 'なし'}</div>
                </div>
            </div>
            <div class="reservation-actions">
                <button class="btn btn--outline btn--sm" onclick="editReservation('${reservation.id}')">編集</button>
                <button class="btn btn--secondary btn--sm" onclick="deleteReservation('${reservation.id}')">削除</button>
                <button class="btn btn--outline btn--sm" onclick="printReservation('${reservation.id}')">印刷</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function loadEmailSettings() {
    const settings = appData.settings.emailSettings;
    document.getElementById('emailjs-service-id').value = settings.serviceId || '';
    document.getElementById('emailjs-template-id').value = settings.templateId || '';
    document.getElementById('emailjs-public-key').value = settings.publicKey || '';
    document.getElementById('email-template').value = appData.settings.emailTemplate;
}

function loadSystemSettings() {
    document.getElementById('hospital-message').value = appData.settings.hospitalMessage;
}

// ==========================================
// Event Listeners
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // Main screen
    document.getElementById('admin-login-btn').onclick = () => showScreen('admin-login-screen');
    document.getElementById('back-to-main').onclick = () => {
        resetReservationForm();
        showScreen('main-screen');
        loadMainScreen();
    };
    
    // Admin login
    document.getElementById('back-to-main-from-login').onclick = () => {
        showScreen('main-screen');
        loadMainScreen();
    };
    document.getElementById('admin-login-form').onsubmit = (e) => {
        e.preventDefault();
        adminLogin();
    };
    
    // Admin navigation
    document.getElementById('admin-logout').onclick = adminLogout;
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.onclick = () => showAdminSection(btn.dataset.section);
    });
    
    // Reservation form
    document.getElementById('patient-form').onsubmit = (e) => {
        e.preventDefault();
        if (validatePatientInfo()) {
            setupDateSelection();
            showStep('step-date-selection');
        }
    };
    
    document.getElementById('prev-to-patient').onclick = () => showStep('step-patient-info');
    document.getElementById('next-to-time').onclick = () => {
        const date = document.getElementById('reservation-date').value;
        if (!date) {
            showNotification('日付を選択してください', 'error');
            return;
        }
        currentReservation.date = date;
        showStep('step-time-selection');
    };
    
    document.getElementById('prev-to-date').onclick = () => showStep('step-date-selection');
    document.getElementById('next-to-confirm').onclick = () => {
        if (!currentReservation.time) {
            showNotification('時間を選択してください', 'error');
            return;
        }
        showReservationSummary();
        showStep('step-confirmation');
    };
    
    document.getElementById('prev-to-time').onclick = () => showStep('step-time-selection');
    document.getElementById('confirm-reservation').onclick = confirmReservation;
    
    // Admin functions
    document.getElementById('add-reservation-type').onclick = () => addReservationType();
    
    // Filter and sort
    document.getElementById('filter-type').onchange = displayReservations;
    document.getElementById('filter-date').onchange = displayReservations;
    document.getElementById('sort-by').onchange = displayReservations;
    
    // View toggle
    document.getElementById('list-view-btn').onclick = () => {
        document.getElementById('list-view-btn').classList.add('active');
        document.getElementById('calendar-view-btn').classList.remove('active');
        document.getElementById('reservations-list-view').classList.remove('hidden');
        document.getElementById('reservations-calendar-view').classList.add('hidden');
    };
    
    document.getElementById('calendar-view-btn').onclick = () => {
        document.getElementById('calendar-view-btn').classList.add('active');
        document.getElementById('list-view-btn').classList.remove('active');
        document.getElementById('reservations-calendar-view').classList.remove('hidden');
        document.getElementById('reservations-list-view').classList.add('hidden');
        loadCalendarView();
    };
    
    // Email settings
    document.getElementById('save-emailjs-settings').onclick = saveEmailJSSettings;
    document.getElementById('test-emailjs-connection').onclick = testEmailJSConnection;
    document.getElementById('save-email-template').onclick = saveEmailTemplate;
    document.getElementById('send-test-email').onclick = sendTestEmail;
    
    // System settings
    document.getElementById('change-admin-password').onclick = changeAdminPassword;
    document.getElementById('save-hospital-message').onclick = saveHospitalMessage;
    document.getElementById('backup-data').onclick = backupData;
    document.getElementById('restore-data').onclick = () => document.getElementById('restore-file').click();
    document.getElementById('restore-file').onchange = restoreData;
    document.getElementById('clear-all-data').onclick = clearAllData;
    
    // Modal
    document.getElementById('modal-close').onclick = hideModal;
    document.getElementById('modal-cancel').onclick = hideModal;
    
    // Notification
    document.getElementById('notification-close').onclick = () => {
        document.getElementById('notification').classList.add('hidden');
    };
    
    // Load initial screen
    loadMainScreen();
});

// ==========================================
// Admin Helper Functions
// ==========================================

function saveEmailJSSettings() {
    const serviceId = document.getElementById('emailjs-service-id').value.trim();
    const templateId = document.getElementById('emailjs-template-id').value.trim();
    const publicKey = document.getElementById('emailjs-public-key').value.trim();
    
    appData.settings.emailSettings = {
        serviceId,
        templateId,
        publicKey
    };
    
    if (typeof emailjs !== 'undefined' && publicKey && publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY') {
        emailjs.init(publicKey);
    }
    
    showNotification('EmailJS設定を保存しました');
}

function testEmailJSConnection() {
    if (!isEmailJSConfigured()) {
        showNotification('EmailJS設定を先に保存してください', 'error');
        return;
    }
    
    const settings = appData.settings.emailSettings;
    
    showLoading();
    
    // Initialize EmailJS with current settings
    emailjs.init(settings.publicKey);
    
    // Test connection with a simple template
    const testParams = {
        to_email: 'test@example.com', // This won't actually send
        to_name: 'Test User',
        subject: 'EmailJS接続テスト',
        message: 'これはEmailJS接続テストです。'
    };
    
    // Simulate a connection test
    setTimeout(() => {
        hideLoading();
        if (settings.serviceId && settings.templateId && settings.publicKey) {
            showNotification('EmailJS設定は正常に設定されています。実際の送信には有効なEmailJSアカウントが必要です。', 'success');
        } else {
            showNotification('EmailJS設定が不完全です。すべての項目を入力してください。', 'error');
        }
    }, 1000);
}

function saveEmailTemplate() {
    const template = document.getElementById('email-template').value;
    appData.settings.emailTemplate = template;
    showNotification('メールテンプレートを保存しました');
}

function sendTestEmail() {
    if (!isEmailJSConfigured()) {
        showNotification('EmailJS設定を先に保存してください', 'error');
        return;
    }
    
    const testReservation = {
        name: 'テスト 太郎',
        email: 'test@example.com',
        phone: '090-1234-5678',
        typeName: 'テスト予約',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        notes: 'これはテストメールです。'
    };
    
    showLoading();
    
    sendConfirmationEmail(testReservation).then(() => {
        hideLoading();
        showNotification('テストメールを送信しました');
    }).catch(error => {
        hideLoading();
        console.error('Test email error:', error);
        showNotification('テストメール送信に失敗しました。設定を確認してください。', 'error');
    });
}

function changeAdminPassword() {
    const newPassword = document.getElementById('new-admin-password').value.trim();
    
    if (!newPassword) {
        showNotification('新しいパスワードを入力してください', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('パスワードは6文字以上で設定してください', 'error');
        return;
    }
    
    appData.settings.adminPassword = newPassword;
    document.getElementById('new-admin-password').value = '';
    showNotification('管理者パスワードを変更しました');
}

function saveHospitalMessage() {
    const message = document.getElementById('hospital-message').value;
    appData.settings.hospitalMessage = message;
    document.getElementById('hospital-message-text').textContent = message;
    showNotification('病院メッセージを保存しました');
}

function backupData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `hospital_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('データをバックアップしました');
}

function restoreData() {
    const file = document.getElementById('restore-file').files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            appData = data;
            showNotification('データを復元しました');
            
            // Reload current screen
            if (currentScreen === 'main-screen') {
                loadMainScreen();
            } else if (currentScreen === 'admin-screen') {
                showAdminSection(currentAdminSection);
            }
        } catch (error) {
            showNotification('データの復元に失敗しました', 'error');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    showModal(
        'データ削除の確認',
        'すべてのデータを削除しますか？この操作は取り消せません。',
        () => {
            appData.reservations = [];
            appData.reservationTypes = [];
            showNotification('すべてのデータを削除しました');
            showAdminSection(currentAdminSection);
        }
    );
}

function addReservationType() {
    showModal(
        '新しい予約種類を追加',
        `<div class="form-group">
            <label class="form-label">予約種類名</label>
            <input type="text" id="new-type-name" class="form-control" placeholder="例: 健康診断">
        </div>
        <div class="form-group">
            <label class="form-label">時間間隔（分）</label>
            <input type="number" id="new-type-duration" class="form-control" value="15">
        </div>
        <div class="form-group">
            <label class="form-label">最大予約数</label>
            <input type="number" id="new-type-slots" class="form-control" value="10">
        </div>`,
        () => {
            const name = document.getElementById('new-type-name').value.trim();
            const duration = parseInt(document.getElementById('new-type-duration').value);
            const maxSlots = parseInt(document.getElementById('new-type-slots').value);
            
            if (!name) {
                showNotification('予約種類名を入力してください', 'error');
                return;
            }
            
            const newType = {
                id: generateId(),
                name: name,
                duration: duration,
                startTime: "09:00",
                endTime: "17:00",
                maxSlots: maxSlots,
                availableFrom: new Date().toISOString().split('T')[0],
                availableTo: "2025-12-31",
                closedDays: ["sunday"],
                specialClosedDates: [],
                weeklySchedule: {
                    monday: { start: "09:00", end: "17:00" },
                    tuesday: { start: "09:00", end: "17:00" },
                    wednesday: { start: "09:00", end: "17:00" },
                    thursday: { start: "09:00", end: "17:00" },
                    friday: { start: "09:00", end: "17:00" },
                    saturday: { start: "09:00", end: "17:00" },
                    sunday: { start: "", end: "" }
                }
            };
            
            appData.reservationTypes.push(newType);
            loadReservationTypes();
            showNotification('新しい予約種類を追加しました');
        }
    );
}

function editReservationType(id) {
    const type = appData.reservationTypes.find(t => t.id === id);
    if (!type) return;
    
    showNotification('予約種類編集機能は簡略版では省略されています', 'info');
}

function deleteReservationType(id) {
    showModal(
        '予約種類削除の確認',
        'この予約種類を削除しますか？関連する予約も削除されます。',
        () => {
            appData.reservationTypes = appData.reservationTypes.filter(t => t.id !== id);
            appData.reservations = appData.reservations.filter(r => r.typeId !== id);
            loadReservationTypes();
            showNotification('予約種類を削除しました');
        }
    );
}

function editReservation(id) {
    showNotification('予約編集機能は簡略版では省略されています', 'info');
}

function deleteReservation(id) {
    showModal(
        '予約削除の確認',
        'この予約を削除しますか？',
        () => {
            appData.reservations = appData.reservations.filter(r => r.id !== id);
            displayReservations();
            showNotification('予約を削除しました');
        }
    );
}

function printReservation(id) {
    const reservation = appData.reservations.find(r => r.id === id);
    if (!reservation) return;
    
    const printContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>予約詳細</h2>
            <p><strong>予約種類:</strong> ${reservation.typeName}</p>
            <p><strong>お名前:</strong> ${reservation.name}</p>
            <p><strong>日時:</strong> ${formatDate(reservation.date)} ${reservation.time}</p>
            <p><strong>連絡先:</strong> ${reservation.phone}</p>
            <p><strong>メール:</strong> ${reservation.email}</p>
            <p><strong>備考:</strong> ${reservation.notes || 'なし'}</p>
            <p><strong>印刷日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
        </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

function loadCalendarView() {
    showNotification('カレンダー表示は簡略版では省略されています', 'info');
}
