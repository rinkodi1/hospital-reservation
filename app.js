// Hospital Reservation System - JavaScript

class HospitalReservationSystem {
    constructor() {
        this.currentScreen = 'main-screen';
        this.currentStep = 1;
        this.currentReservation = {};
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.selectedDate = null;
        this.selectedType = null;
        this.selectedTime = null;
        this.editingReservationId = null;
        this.editingTypeId = null;
        
        this.init();
    }

    init() {
        this.initializeData();
        this.loadHospitalMessage();
        this.bindEvents();
        this.showScreen('main-screen');
    }

    // Data Management
    initializeData() {
        // Initialize sample reservations if not exists
        if (!localStorage.getItem('hospitalReservations')) {
            const sampleReservations = [
                {
                    id: 'res_001',
                    name: '田中太郎',
                    email: 'tanaka@example.com',
                    phone: '090-1234-5678',
                    type: 'health_checkup',
                    date: '2025-07-28',
                    time: '10:00',
                    notes: '初回健康診断です',
                    created_at: '2025-07-27T10:00:00Z'
                },
                {
                    id: 'res_002',
                    name: '佐藤花子',
                    email: 'sato@example.com',
                    phone: '090-9876-5432',
                    type: 'vaccination',
                    date: '2025-07-29',
                    time: '14:30',
                    notes: 'インフルエンザワクチン希望',
                    created_at: '2025-07-27T11:30:00Z'
                }
            ];
            localStorage.setItem('hospitalReservations', JSON.stringify(sampleReservations));
        }
        
        if (!localStorage.getItem('hospitalReservationTypes')) {
            const defaultTypes = [
                {
                    id: 'health_checkup',
                    name: '健康診断',
                    interval: 15,
                    capacity: 10,
                    start_time: '09:00',
                    end_time: '17:00',
                    available_from: '2025-01-01',
                    available_to: '2025-12-31',
                    excluded_weekdays: [0],
                    excluded_dates: ['2025-01-01', '2025-01-02', '2025-01-03'],
                    weekday_hours: {
                        1: {start: '09:00', end: '17:00'},
                        2: {start: '09:00', end: '17:00'},
                        3: {start: '09:00', end: '17:00'},
                        4: {start: '09:00', end: '17:00'},
                        5: {start: '09:00', end: '17:00'},
                        6: {start: '09:00', end: '12:00'}
                    }
                },
                {
                    id: 'vaccination',
                    name: '予防接種',
                    interval: 15,
                    capacity: 10,
                    start_time: '09:00',
                    end_time: '17:00',
                    available_from: '2025-01-01',
                    available_to: '2025-12-31',
                    excluded_weekdays: [0],
                    excluded_dates: ['2025-01-01', '2025-01-02', '2025-01-03'],
                    weekday_hours: {
                        1: {start: '09:00', end: '17:00'},
                        2: {start: '09:00', end: '17:00'},
                        3: {start: '09:00', end: '17:00'},
                        4: {start: '09:00', end: '17:00'},
                        5: {start: '09:00', end: '17:00'},
                        6: {start: '09:00', end: '12:00'}
                    }
                }
            ];
            localStorage.setItem('hospitalReservationTypes', JSON.stringify(defaultTypes));
        }

        if (!localStorage.getItem('hospitalSettings')) {
            const defaultSettings = {
                adminPassword: 'admin123',
                hospitalInfo: {
                    name: 'さくら総合病院',
                    phone: '03-1234-5678',
                    address: '東京都中央区○○1-2-3'
                },
                hospitalMessage: 'お気軽にご予約ください。ご不明な点がございましたらお電話でお問い合わせください。',
                emailTemplate: {
                    subject: '予約確認のお知らせ - {{hospitalName}}',
                    body: '{{patientName}}様\n\nご予約いただきありがとうございます。\n\n【予約詳細】\n予約種類：{{reservationType}}\n予約日時：{{date}} {{timeSlot}}\n\n何かご不明な点がございましたら、お気軽にお電話ください。\n\nさくら総合病院\nTEL: 03-1234-5678'
                },
                emailjsConfig: {
                    serviceId: '',
                    templateId: '',
                    publicKey: ''
                },
                googleCalendar: {
                    apiKey: '',
                    calendarId: '',
                    enabled: false
                }
            };
            localStorage.setItem('hospitalSettings', JSON.stringify(defaultSettings));
        }
    }

    getReservations() {
        return JSON.parse(localStorage.getItem('hospitalReservations') || '[]');
    }

    saveReservations(reservations) {
        localStorage.setItem('hospitalReservations', JSON.stringify(reservations));
    }

    getReservationTypes() {
        return JSON.parse(localStorage.getItem('hospitalReservationTypes') || '[]');
    }

    saveReservationTypes(types) {
        localStorage.setItem('hospitalReservationTypes', JSON.stringify(types));
    }

    getSettings() {
        return JSON.parse(localStorage.getItem('hospitalSettings') || '{}');
    }

    saveSettings(settings) {
        localStorage.setItem('hospitalSettings', JSON.stringify(settings));
    }

    // Event Binding
    bindEvents() {
        // Main screen events
        const adminLoginBtn = document.getElementById('admin-login-btn');
        const startReservationBtn = document.getElementById('start-reservation-btn');
        
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', () => {
                this.showScreen('admin-login-screen');
            });
        }

        if (startReservationBtn) {
            startReservationBtn.addEventListener('click', () => {
                this.startReservation();
            });
        }

        // Back to main
        const backToMainBtn = document.getElementById('back-to-main');
        if (backToMainBtn) {
            backToMainBtn.addEventListener('click', () => {
                this.showScreen('main-screen');
            });
        }

        // Step navigation
        this.bindStepNavigation();
        
        // Calendar navigation
        this.bindCalendarNavigation();

        // Confirmation
        const confirmBtn = document.getElementById('confirm-reservation');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.confirmReservation();
            });
        }

        // Admin login events
        this.bindAdminLoginEvents();

        // Admin screen events
        this.bindAdminEvents();

        // Modal events
        this.bindModalEvents();

        // Filter events
        this.bindFilterEvents();
    }

    bindStepNavigation() {
        const stepButtons = [
            {id: 'next-to-step-2', handler: () => this.nextToStep2()},
            {id: 'back-to-step-1', handler: () => this.goToStep(1)},
            {id: 'next-to-step-3', handler: () => this.nextToStep3()},
            {id: 'back-to-step-2', handler: () => this.goToStep(2)},
            {id: 'next-to-step-4', handler: () => this.nextToStep4()},
            {id: 'back-to-step-3', handler: () => this.goToStep(3)},
            {id: 'next-to-step-5', handler: () => this.goToStep(5)},
            {id: 'back-to-step-4', handler: () => this.goToStep(4)},
            {id: 'next-to-step-6', handler: () => this.goToStep(6)},
            {id: 'back-to-step-5', handler: () => this.goToStep(5)}
        ];

        stepButtons.forEach(({id, handler}) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    handler();
                });
            }
        });
    }

    bindCalendarNavigation() {
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.changeMonth(-1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.changeMonth(1);
            });
        }
    }

    bindAdminLoginEvents() {
        const cancelBtn = document.getElementById('cancel-login');
        const submitBtn = document.getElementById('admin-login-submit');
        const passwordInput = document.getElementById('admin-password');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.showScreen('main-screen');
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.adminLogin();
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.adminLogin();
                }
            });
        }
    }

    bindAdminEvents() {
        const logoutBtn = document.getElementById('admin-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.showScreen('main-screen');
            });
        }

        // Admin tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchAdminTab(tab.dataset.tab);
            });
        });

        // Admin management events
        const addNewTypeBtn = document.getElementById('add-new-type');
        if (addNewTypeBtn) {
            addNewTypeBtn.addEventListener('click', () => {
                this.showTypeEditModal();
            });
        }

        // Settings events
        this.bindSettingsEvents();
    }

    bindSettingsEvents() {
        const settingsButtons = [
            {id: 'change-password', handler: () => this.changeAdminPassword()},
            {id: 'update-hospital-info', handler: () => this.updateHospitalInfo()},
            {id: 'update-hospital-message', handler: () => this.updateHospitalMessage()},
            {id: 'update-email-template', handler: () => this.updateEmailTemplate()},
            {id: 'save-emailjs-config', handler: () => this.saveEmailJSConfig()},
            {id: 'save-google-calendar-config', handler: () => this.saveGoogleCalendarConfig()},
            {id: 'test-google-calendar', handler: () => this.testGoogleCalendarConnection()}
        ];

        settingsButtons.forEach(({id, handler}) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    handler();
                });
            }
        });
    }

    bindModalEvents() {
        // Type edit modal
        const cancelTypeBtn = document.getElementById('cancel-type-edit');
        const saveTypeBtn = document.getElementById('save-type-edit');

        if (cancelTypeBtn) {
            cancelTypeBtn.addEventListener('click', () => {
                this.hideModal('type-edit-modal');
            });
        }

        if (saveTypeBtn) {
            saveTypeBtn.addEventListener('click', () => {
                this.saveTypeEdit();
            });
        }

        // Reservation edit modal
        const cancelReservationBtn = document.getElementById('cancel-reservation-edit');
        const saveReservationBtn = document.getElementById('save-reservation-edit');
        const deleteReservationBtn = document.getElementById('delete-reservation');

        if (cancelReservationBtn) {
            cancelReservationBtn.addEventListener('click', () => {
                this.hideModal('reservation-edit-modal');
            });
        }

        if (saveReservationBtn) {
            saveReservationBtn.addEventListener('click', () => {
                this.saveReservationEdit();
            });
        }

        if (deleteReservationBtn) {
            deleteReservationBtn.addEventListener('click', () => {
                this.deleteReservation();
            });
        }

        // Success modal
        const closeSuccessBtn = document.getElementById('close-success-modal');
        if (closeSuccessBtn) {
            closeSuccessBtn.addEventListener('click', () => {
                this.hideModal('success-modal');
                this.showScreen('main-screen');
            });
        }

        // Close modals when clicking overlay or close button
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) this.hideModal(modal.id);
            });
        });

        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) this.hideModal(modal.id);
            });
        });
    }

    bindFilterEvents() {
        const filterType = document.getElementById('filter-type');
        const filterDate = document.getElementById('filter-date');

        if (filterType) {
            filterType.addEventListener('change', () => {
                this.loadReservationsList();
            });
        }

        if (filterDate) {
            filterDate.addEventListener('change', () => {
                this.loadReservationsList();
            });
        }
    }

    // Screen Management
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        this.currentScreen = screenId;

        if (screenId === 'admin-screen') {
            this.loadAdminScreen();
        }
    }

    // Reservation Process
    startReservation() {
        this.currentReservation = {};
        this.selectedDate = null;
        this.selectedType = null;
        this.selectedTime = null;
        this.goToStep(1);
        this.showScreen('reservation-screen');
    }

    goToStep(step) {
        // Hide all steps
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });

        // Show current step
        const stepContent = document.getElementById(`step-${step}`);
        const stepIndicator = document.querySelector(`[data-step="${step}"]`);
        
        if (stepContent) stepContent.classList.add('active');
        if (stepIndicator) stepIndicator.classList.add('active');
        
        this.currentStep = step;

        // Load step content
        switch(step) {
            case 2:
                this.loadReservationTypes();
                break;
            case 3:
                this.loadCalendar();
                break;
            case 4:
                this.loadTimeSlots();
                break;
            case 6:
                this.loadReservationSummary();
                break;
        }
    }

    nextToStep2() {
        const name = document.getElementById('patient-name').value.trim();
        const email = document.getElementById('patient-email').value.trim();
        const phone = document.getElementById('patient-phone').value.trim();

        if (!name || !email || !phone) {
            alert('全ての項目を入力してください。');
            return;
        }

        // Check for duplicate email
        const reservations = this.getReservations();
        if (reservations.some(r => r.email === email)) {
            alert('このメールアドレスでは既に予約が存在します。重複予約はできません。');
            return;
        }

        this.currentReservation.name = name;
        this.currentReservation.email = email;
        this.currentReservation.phone = phone;

        this.goToStep(2);
    }

    nextToStep3() {
        if (!this.selectedType) {
            alert('予約種類を選択してください。');
            return;
        }
        this.currentReservation.type = this.selectedType;
        this.goToStep(3);
    }

    nextToStep4() {
        if (!this.selectedDate) {
            alert('予約日を選択してください。');
            return;
        }
        this.currentReservation.date = this.selectedDate;
        const displayElement = document.getElementById('selected-date-display');
        if (displayElement) {
            displayElement.textContent = new Date(this.selectedDate).toLocaleDateString('ja-JP');
        }
        this.goToStep(4);
    }

    loadReservationTypes() {
        const types = this.getReservationTypes();
        const container = document.getElementById('reservation-types-list');
        
        if (!container) return;
        
        container.innerHTML = types.map(type => `
            <div class="reservation-type-option" data-type-id="${type.id}">
                <h4>${type.name}</h4>
                <div class="type-details">
                    <p>時間：${type.start_time} - ${type.end_time}</p>
                    <p>定員：${type.capacity}名</p>
                    <p>時間間隔：${type.interval}分</p>
                </div>
            </div>
        `).join('');

        // Bind click events
        container.querySelectorAll('.reservation-type-option').forEach(option => {
            option.addEventListener('click', () => {
                container.querySelectorAll('.reservation-type-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
                this.selectedType = option.dataset.typeId;
                const nextBtn = document.getElementById('next-to-step-3');
                if (nextBtn) nextBtn.disabled = false;
            });
        });
    }

    loadCalendar() {
        const monthNames = [
            '1月', '2月', '3月', '4月', '5月', '6月',
            '7月', '8月', '9月', '10月', '11月', '12月'
        ];
        
        const monthYearElement = document.getElementById('current-month-year');
        if (monthYearElement) {
            monthYearElement.textContent = `${this.currentYear}年 ${monthNames[this.currentMonth]}`;
        }

        const grid = document.getElementById('calendar-grid');
        if (!grid) return;

        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const dayHeaders = ['日', '月', '火', '水', '木', '金', '土'];
        let calendarHTML = dayHeaders.map(day => 
            `<div class="calendar-day-header">${day}</div>`
        ).join('');

        // Previous month's trailing days
        const prevMonth = new Date(this.currentYear, this.currentMonth, 0);
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonth.getDate() - i;
            calendarHTML += `<div class="calendar-day other-month">${day}</div>`;
        }

        // Current month days
        const today = new Date();
        const selectedType = this.getReservationTypes().find(t => t.id === this.selectedType);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();
            
            let classes = ['calendar-day'];
            let clickable = true;

            // Check if today
            if (date.toDateString() === today.toDateString()) {
                classes.push('today');
            }

            // Check if date is available
            if (selectedType) {
                const availableFrom = new Date(selectedType.available_from);
                const availableTo = new Date(selectedType.available_to);
                
                if (date < availableFrom || date > availableTo) {
                    classes.push('unavailable');
                    clickable = false;
                }

                if (selectedType.excluded_weekdays.includes(dayOfWeek)) {
                    classes.push('unavailable');
                    clickable = false;
                }

                if (selectedType.excluded_dates.includes(dateStr)) {
                    classes.push('unavailable');
                    clickable = false;
                }

                // Check if date is in the past
                if (date < today) {
                    classes.push('unavailable');
                    clickable = false;
                }
            }

            calendarHTML += `
                <div class="${classes.join(' ')}" 
                     data-date="${dateStr}" 
                     ${clickable ? 'style="cursor: pointer;"' : ''}>
                    ${day}
                </div>
            `;
        }

        // Next month's leading days
        const totalCells = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;
        const remainingCells = totalCells - (startingDayOfWeek + daysInMonth);
        for (let day = 1; day <= remainingCells; day++) {
            calendarHTML += `<div class="calendar-day other-month">${day}</div>`;
        }

        grid.innerHTML = calendarHTML;

        // Bind click events for available days
        grid.querySelectorAll('.calendar-day:not(.unavailable):not(.other-month)').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                grid.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                dayEl.classList.add('selected');
                this.selectedDate = dayEl.dataset.date;
                const nextBtn = document.getElementById('next-to-step-4');
                if (nextBtn) nextBtn.disabled = false;
            });
        });
    }

    changeMonth(direction) {
        this.currentMonth += direction;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.loadCalendar();
    }

    loadTimeSlots() {
        const selectedType = this.getReservationTypes().find(t => t.id === this.selectedType);
        const container = document.getElementById('time-slots-container');
        
        if (!container || !selectedType || !this.selectedDate) {
            if (container) container.innerHTML = '<p>時間枠を読み込めませんでした。</p>';
            return;
        }

        const date = new Date(this.selectedDate);
        const dayOfWeek = date.getDay();
        const dayHours = selectedType.weekday_hours[dayOfWeek];
        
        if (!dayHours) {
            container.innerHTML = '<p>選択された日は営業日ではありません。</p>';
            return;
        }

        const startTime = this.parseTime(dayHours.start);
        const endTime = this.parseTime(dayHours.end);
        const interval = selectedType.interval;
        const capacity = selectedType.capacity;

        // Get existing reservations for this date and type
        const reservations = this.getReservations().filter(r => 
            r.date === this.selectedDate && r.type === this.selectedType
        );

        const timeSlots = [];
        for (let time = startTime; time < endTime; time += interval) {
            const timeStr = this.formatTime(time);
            const slotReservations = reservations.filter(r => r.time === timeStr);
            const currentCount = slotReservations.length;
            const isFull = currentCount >= capacity;

            timeSlots.push({
                time: timeStr,
                currentCount,
                capacity,
                isFull
            });
        }

        container.innerHTML = timeSlots.map(slot => `
            <div class="time-slot ${slot.isFull ? 'full' : ''}" 
                 data-time="${slot.time}" 
                 ${!slot.isFull ? 'style="cursor: pointer;"' : ''}>
                <div class="time-slot-time">${slot.time}</div>
                <div class="time-slot-capacity ${slot.isFull ? 'capacity-full' : 'capacity-available'}">
                    ${slot.currentCount}/${slot.capacity}名
                </div>
            </div>
        `).join('');

        // Bind click events for available slots
        container.querySelectorAll('.time-slot:not(.full)').forEach(slot => {
            slot.addEventListener('click', () => {
                container.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                this.selectedTime = slot.dataset.time;
                const nextBtn = document.getElementById('next-to-step-5');
                if (nextBtn) nextBtn.disabled = false;
            });
        });
    }

    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    loadReservationSummary() {
        this.currentReservation.time = this.selectedTime;
        const notesElement = document.getElementById('patient-notes');
        this.currentReservation.notes = notesElement ? notesElement.value.trim() : '';

        const selectedType = this.getReservationTypes().find(t => t.id === this.selectedType);
        const formattedDate = new Date(this.selectedDate).toLocaleDateString('ja-JP');

        const summaryElement = document.getElementById('reservation-summary');
        if (summaryElement) {
            summaryElement.innerHTML = `
                <div class="summary-item">
                    <span class="summary-label">お名前：</span>
                    <span>${this.currentReservation.name}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">メールアドレス：</span>
                    <span>${this.currentReservation.email}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">電話番号：</span>
                    <span>${this.currentReservation.phone}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">予約種類：</span>
                    <span>${selectedType ? selectedType.name : this.selectedType}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">予約日：</span>
                    <span>${formattedDate}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">予約時間：</span>
                    <span>${this.selectedTime}</span>
                </div>
                ${this.currentReservation.notes ? `
                <div class="summary-item">
                    <span class="summary-label">備考：</span>
                    <span>${this.currentReservation.notes}</span>
                </div>
                ` : ''}
            `;
        }
    }

    confirmReservation() {
        const reservations = this.getReservations();
        const newReservation = {
            id: Date.now().toString(),
            ...this.currentReservation,
            created_at: new Date().toISOString()
        };

        reservations.push(newReservation);
        this.saveReservations(reservations);

        // Send email
        this.sendReservationEmail(newReservation);

        // Add to Google Calendar if configured
        this.addToGoogleCalendar(newReservation);

        // Show success modal
        this.showModal('success-modal');
    }

    sendReservationEmail(reservation) {
        const settings = this.getSettings();
        const selectedType = this.getReservationTypes().find(t => t.id === reservation.type);
        
        if (!settings.emailjsConfig.serviceId || !settings.emailjsConfig.templateId) {
            console.log('EmailJS not configured');
            return;
        }

        const templateParams = {
            to_email: reservation.email,
            patient_name: reservation.name,
            hospital_name: settings.hospitalInfo.name,
            reservation_type: selectedType ? selectedType.name : reservation.type,
            reservation_date: new Date(reservation.date).toLocaleDateString('ja-JP'),
            reservation_time: reservation.time,
            patient_notes: reservation.notes || 'なし'
        };

        if (typeof emailjs !== 'undefined') {
            emailjs.send(
                settings.emailjsConfig.serviceId,
                settings.emailjsConfig.templateId,
                templateParams,
                settings.emailjsConfig.publicKey
            ).then(
                () => console.log('Email sent successfully'),
                (error) => console.log('Email failed to send:', error)
            );
        }
    }

    // Google Calendar Integration
    addToGoogleCalendar(reservation) {
        const settings = this.getSettings();
        
        if (!settings.googleCalendar.enabled || !settings.googleCalendar.apiKey || !settings.googleCalendar.calendarId) {
            console.log('Google Calendar not configured');
            return;
        }

        const selectedType = this.getReservationTypes().find(t => t.id === reservation.type);
        const startDateTime = new Date(`${reservation.date}T${reservation.time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 minutes

        const event = {
            summary: `${selectedType ? selectedType.name : reservation.type} - ${reservation.name}`,
            description: `患者: ${reservation.name}\nメール: ${reservation.email}\n電話: ${reservation.phone}\n備考: ${reservation.notes || 'なし'}`,
            start: {
                dateTime: startDateTime.toISOString()
            },
            end: {
                dateTime: endDateTime.toISOString()
            }
        };

        // This would be the actual Google Calendar API call
        // For demo purposes, we just log the event
        console.log('Would add to Google Calendar:', event);
    }

    testGoogleCalendarConnection() {
        const apiKey = document.getElementById('google-calendar-api-key').value.trim();
        const calendarId = document.getElementById('google-calendar-id').value.trim();

        if (!apiKey || !calendarId) {
            this.updateGoogleCalendarStatus('error', 'APIキーとカレンダーIDを入力してください');
            return;
        }

        this.updateGoogleCalendarStatus('info', '接続をテスト中...');

        // Simulate API test (in real implementation, you would call Google Calendar API)
        setTimeout(() => {
            // For demo purposes, we simulate a successful connection
            if (apiKey.length > 10 && calendarId.includes('@')) {
                this.updateGoogleCalendarStatus('success', '接続成功！Google Calendarと連携できます');
            } else {
                this.updateGoogleCalendarStatus('error', '接続に失敗しました。設定を確認してください');
            }
        }, 2000);
    }

    updateGoogleCalendarStatus(type, message) {
        const statusElement = document.getElementById('google-calendar-status');
        const statusText = document.getElementById('calendar-status-text');

        if (statusElement && statusText) {
            statusElement.className = `status status--${type}`;
            statusText.textContent = message;
        }
    }

    saveGoogleCalendarConfig() {
        const apiKey = document.getElementById('google-calendar-api-key').value.trim();
        const calendarId = document.getElementById('google-calendar-id').value.trim();

        const settings = this.getSettings();
        settings.googleCalendar = {
            apiKey: apiKey,
            calendarId: calendarId,
            enabled: !!(apiKey && calendarId)
        };

        this.saveSettings(settings);
        
        if (apiKey && calendarId) {
            this.updateGoogleCalendarStatus('success', '設定を保存しました');
            alert('Google Calendar連携設定を保存しました。');
        } else {
            this.updateGoogleCalendarStatus('info', '未設定');
            alert('Google Calendar連携設定を保存しました。');
        }
    }

    // Admin Functions
    adminLogin() {
        const passwordInput = document.getElementById('admin-password');
        const settings = this.getSettings();

        if (!passwordInput) return;

        const password = passwordInput.value;

        if (password === settings.adminPassword) {
            passwordInput.value = '';
            const errorElement = document.getElementById('login-error');
            if (errorElement) errorElement.style.display = 'none';
            this.showScreen('admin-screen');
        } else {
            const errorElement = document.getElementById('login-error');
            if (errorElement) {
                errorElement.textContent = 'パスワードが間違っています。';
                errorElement.style.display = 'block';
            }
        }
    }

    loadAdminScreen() {
        this.switchAdminTab('reservations');
        this.loadReservationsList();
        this.loadTypesList();
        this.loadSettings();
    }

    switchAdminTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) activeTab.classList.add('active');

        // Update content
        document.querySelectorAll('.admin-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(`admin-${tabName}`);
        if (activeContent) activeContent.classList.add('active');
    }

    loadReservationsList() {
        const reservations = this.getReservations();
        const types = this.getReservationTypes();
        const filterTypeElement = document.getElementById('filter-type');
        const filterDateElement = document.getElementById('filter-date');
        
        if (!filterTypeElement || !filterDateElement) return;

        const filterType = filterTypeElement.value;
        const filterDate = filterDateElement.value;

        // Update filter options
        filterTypeElement.innerHTML = '<option value="">全ての種類</option>' +
            types.map(type => `<option value="${type.id}">${type.name}</option>`).join('');

        // Filter reservations
        let filteredReservations = reservations;
        if (filterType) {
            filteredReservations = filteredReservations.filter(r => r.type === filterType);
        }
        if (filterDate) {
            filteredReservations = filteredReservations.filter(r => r.date === filterDate);
        }

        // Sort by date and time
        filteredReservations.sort((a, b) => {
            const dateCompare = new Date(a.date) - new Date(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.time.localeCompare(b.time);
        });

        const container = document.getElementById('reservations-list');
        if (!container) return;
        
        if (filteredReservations.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>該当する予約がありません。</p></div>';
            return;
        }

        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>日時</th>
                        <th>種類</th>
                        <th>患者名</th>
                        <th>メール</th>
                        <th>電話</th>
                        <th>備考</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredReservations.map(reservation => {
                        const type = types.find(t => t.id === reservation.type);
                        const formattedDate = new Date(reservation.date).toLocaleDateString('ja-JP');
                        return `
                            <tr>
                                <td>${formattedDate} ${reservation.time}</td>
                                <td>${type ? type.name : reservation.type}</td>
                                <td>${reservation.name}</td>
                                <td>${reservation.email}</td>
                                <td>${reservation.phone}</td>
                                <td>${reservation.notes || '-'}</td>
                                <td class="table-actions">
                                    <button class="btn btn--sm btn--outline" onclick="reservationSystem.editReservation('${reservation.id}')">
                                        編集
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    editReservation(reservationId) {
        const reservations = this.getReservations();
        const reservation = reservations.find(r => r.id === reservationId);
        
        if (!reservation) return;

        this.editingReservationId = reservationId;
        
        // Populate form
        const fields = [
            {id: 'edit-patient-name', value: reservation.name},
            {id: 'edit-patient-email', value: reservation.email},
            {id: 'edit-patient-phone', value: reservation.phone},
            {id: 'edit-reservation-date', value: reservation.date},
            {id: 'edit-reservation-time', value: reservation.time},
            {id: 'edit-patient-notes', value: reservation.notes || ''}
        ];

        fields.forEach(({id, value}) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });

        this.showModal('reservation-edit-modal');
    }

    saveReservationEdit() {
        const reservations = this.getReservations();
        const index = reservations.findIndex(r => r.id === this.editingReservationId);
        
        if (index === -1) return;

        const fields = [
            {id: 'edit-patient-name', key: 'name'},
            {id: 'edit-patient-email', key: 'email'},
            {id: 'edit-patient-phone', key: 'phone'},
            {id: 'edit-reservation-date', key: 'date'},
            {id: 'edit-reservation-time', key: 'time'},
            {id: 'edit-patient-notes', key: 'notes'}
        ];

        // Update reservation
        fields.forEach(({id, key}) => {
            const element = document.getElementById(id);
            if (element) {
                reservations[index][key] = element.value.trim();
            }
        });

        this.saveReservations(reservations);
        this.loadReservationsList();
        this.hideModal('reservation-edit-modal');
        alert('予約を更新しました。');
    }

    deleteReservation() {
        if (!confirm('この予約を削除してもよろしいですか？')) return;

        const reservations = this.getReservations();
        const filteredReservations = reservations.filter(r => r.id !== this.editingReservationId);
        
        this.saveReservations(filteredReservations);
        this.loadReservationsList();
        this.hideModal('reservation-edit-modal');
        alert('予約を削除しました。');
    }

    loadTypesList() {
        const types = this.getReservationTypes();
        const container = document.getElementById('types-list');

        if (!container) return;

        if (types.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-list"></i><p>予約種類がありません。</p></div>';
            return;
        }

        container.innerHTML = types.map(type => `
            <div class="type-item">
                <div class="type-header">
                    <h4>${type.name}</h4>
                    <div class="type-actions">
                        <button class="btn btn--sm btn--outline" onclick="reservationSystem.editType('${type.id}')">
                            編集
                        </button>
                        <button class="btn btn--sm btn--outline" style="color: var(--color-error);" onclick="reservationSystem.deleteType('${type.id}')">
                            削除
                        </button>
                    </div>
                </div>
                <div class="type-details-grid">
                    <div class="type-detail">
                        <div class="type-detail-label">時間間隔</div>
                        <div class="type-detail-value">${type.interval}分</div>
                    </div>
                    <div class="type-detail">
                        <div class="type-detail-label">定員</div>
                        <div class="type-detail-value">${type.capacity}名</div>
                    </div>
                    <div class="type-detail">
                        <div class="type-detail-label">営業時間</div>
                        <div class="type-detail-value">${type.start_time} - ${type.end_time}</div>
                    </div>
                    <div class="type-detail">
                        <div class="type-detail-label">予約可能期間</div>
                        <div class="type-detail-value">${type.available_from} ～ ${type.available_to}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showTypeEditModal(typeId = null) {
        this.editingTypeId = typeId;
        
        const modalTitle = document.getElementById('type-modal-title');
        const fields = [
            {id: 'type-name', defaultValue: ''},
            {id: 'type-interval', defaultValue: 15},
            {id: 'type-capacity', defaultValue: 10},
            {id: 'type-start-time', defaultValue: '09:00'},
            {id: 'type-end-time', defaultValue: '17:00'},
            {id: 'type-available-from', defaultValue: new Date().toISOString().split('T')[0]},
            {id: 'type-available-to', defaultValue: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]}
        ];
        
        if (typeId) {
            // Edit mode
            const types = this.getReservationTypes();
            const type = types.find(t => t.id === typeId);
            
            if (modalTitle) modalTitle.textContent = '予約種類の編集';
            
            if (type) {
                document.getElementById('type-name').value = type.name;
                document.getElementById('type-interval').value = type.interval;
                document.getElementById('type-capacity').value = type.capacity;
                document.getElementById('type-start-time').value = type.start_time;
                document.getElementById('type-end-time').value = type.end_time;
                document.getElementById('type-available-from').value = type.available_from;
                document.getElementById('type-available-to').value = type.available_to;
                
                // Set excluded weekdays
                document.querySelectorAll('.weekday-checkboxes input').forEach(checkbox => {
                    checkbox.checked = type.excluded_weekdays.includes(parseInt(checkbox.value));
                });
            }
        } else {
            // Add mode
            if (modalTitle) modalTitle.textContent = '新しい予約種類の追加';
            
            fields.forEach(({id, defaultValue}) => {
                const element = document.getElementById(id);
                if (element) element.value = defaultValue;
            });
            
            // Clear excluded weekdays - default: exclude Sunday
            document.querySelectorAll('.weekday-checkboxes input').forEach(checkbox => {
                checkbox.checked = [0].includes(parseInt(checkbox.value));
            });
        }

        this.showModal('type-edit-modal');
    }

    editType(typeId) {
        this.showTypeEditModal(typeId);
    }

    saveTypeEdit() {
        const fields = [
            {id: 'type-name', required: true},
            {id: 'type-interval', required: true, type: 'number'},
            {id: 'type-capacity', required: true, type: 'number'},
            {id: 'type-start-time', required: true},
            {id: 'type-end-time', required: true}
        ];

        const values = {};
        let hasError = false;

        fields.forEach(({id, required, type}) => {
            const element = document.getElementById(id);
            if (element) {
                const value = type === 'number' ? parseInt(element.value) : element.value.trim();
                if (required && (!value || (type === 'number' && isNaN(value)))) {
                    hasError = true;
                }
                values[id.replace('type-', '')] = value;
            }
        });

        if (hasError) {
            alert('全ての必須項目を正しく入力してください。');
            return;
        }

        const availableFromElement = document.getElementById('type-available-from');
        const availableToElement = document.getElementById('type-available-to');
        
        if (availableFromElement) values['available-from'] = availableFromElement.value;
        if (availableToElement) values['available-to'] = availableToElement.value;

        const excludedWeekdays = Array.from(document.querySelectorAll('.weekday-checkboxes input:checked'))
            .map(checkbox => parseInt(checkbox.value));

        const types = this.getReservationTypes();
        
        if (this.editingTypeId) {
            // Edit existing type
            const index = types.findIndex(t => t.id === this.editingTypeId);
            if (index !== -1) {
                types[index] = {
                    ...types[index],
                    name: values.name,
                    interval: values.interval,
                    capacity: values.capacity,
                    start_time: values['start-time'],
                    end_time: values['end-time'],
                    available_from: values['available-from'],
                    available_to: values['available-to'],
                    excluded_weekdays: excludedWeekdays
                };
            }
        } else {
            // Add new type
            const newType = {
                id: Date.now().toString(),
                name: values.name,
                interval: values.interval,
                capacity: values.capacity,
                start_time: values['start-time'],
                end_time: values['end-time'],
                available_from: values['available-from'],
                available_to: values['available-to'],
                excluded_weekdays: excludedWeekdays,
                excluded_dates: [],
                weekday_hours: {
                    1: {start: values['start-time'], end: values['end-time']},
                    2: {start: values['start-time'], end: values['end-time']},
                    3: {start: values['start-time'], end: values['end-time']},
                    4: {start: values['start-time'], end: values['end-time']},
                    5: {start: values['start-time'], end: values['end-time']},
                    6: {start: values['start-time'], end: values['end-time']}
                }
            };
            types.push(newType);
        }

        this.saveReservationTypes(types);
        this.loadTypesList();
        this.hideModal('type-edit-modal');
        alert(this.editingTypeId ? '予約種類を更新しました。' : '新しい予約種類を追加しました。');
    }

    deleteType(typeId) {
        if (!confirm('この予約種類を削除してもよろしいですか？関連する予約も削除されます。')) return;

        const types = this.getReservationTypes().filter(t => t.id !== typeId);
        const reservations = this.getReservations().filter(r => r.type !== typeId);
        
        this.saveReservationTypes(types);
        this.saveReservations(reservations);
        this.loadTypesList();
        this.loadReservationsList();
        alert('予約種類を削除しました。');
    }

    loadSettings() {
        const settings = this.getSettings();
        
        const settingsFields = [
            {id: 'hospital-name-input', value: settings.hospitalInfo?.name || 'さくら総合病院'},
            {id: 'hospital-phone-input', value: settings.hospitalInfo?.phone || '03-1234-5678'},
            {id: 'hospital-address-input', value: settings.hospitalInfo?.address || '東京都中央区○○1-2-3'},
            {id: 'hospital-message-input', value: settings.hospitalMessage || ''},
            {id: 'email-subject', value: settings.emailTemplate?.subject || ''},
            {id: 'email-body', value: settings.emailTemplate?.body || ''},
            {id: 'emailjs-service-id', value: settings.emailjsConfig?.serviceId || ''},
            {id: 'emailjs-template-id', value: settings.emailjsConfig?.templateId || ''},
            {id: 'emailjs-public-key', value: settings.emailjsConfig?.publicKey || ''},
            {id: 'google-calendar-api-key', value: settings.googleCalendar?.apiKey || ''},
            {id: 'google-calendar-id', value: settings.googleCalendar?.calendarId || ''}
        ];

        settingsFields.forEach(({id, value}) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });

        // Update Google Calendar status
        if (settings.googleCalendar?.enabled) {
            this.updateGoogleCalendarStatus('success', '設定済み - 連携が有効です');
        } else {
            this.updateGoogleCalendarStatus('info', '未設定');
        }
    }

    changeAdminPassword() {
        const passwordElement = document.getElementById('new-admin-password');
        
        if (!passwordElement) return;

        const newPassword = passwordElement.value.trim();
        
        if (!newPassword) {
            alert('新しいパスワードを入力してください。');
            return;
        }

        if (newPassword.length < 6) {
            alert('パスワードは6文字以上で入力してください。');
            return;
        }

        const settings = this.getSettings();
        settings.adminPassword = newPassword;
        this.saveSettings(settings);
        
        passwordElement.value = '';
        alert('パスワードを変更しました。');
    }

    updateHospitalInfo() {
        const nameElement = document.getElementById('hospital-name-input');
        const phoneElement = document.getElementById('hospital-phone-input');
        const addressElement = document.getElementById('hospital-address-input');
        
        if (!nameElement || !phoneElement || !addressElement) return;

        const settings = this.getSettings();
        settings.hospitalInfo = {
            name: nameElement.value.trim(),
            phone: phoneElement.value.trim(),
            address: addressElement.value.trim()
        };
        this.saveSettings(settings);
        
        alert('病院情報を更新しました。');
    }

    updateHospitalMessage() {
        const messageElement = document.getElementById('hospital-message-input');
        
        if (!messageElement) return;

        const message = messageElement.value.trim();
        
        const settings = this.getSettings();
        settings.hospitalMessage = message;
        this.saveSettings(settings);
        
        this.loadHospitalMessage();
        alert('病院メッセージを更新しました。');
    }

    loadHospitalMessage() {
        const settings = this.getSettings();
        const messageElement = document.getElementById('hospital-message-text');
        
        if (messageElement) {
            messageElement.textContent = settings.hospitalMessage || 'メッセージが設定されていません。';
        }
    }

    updateEmailTemplate() {
        const subjectElement = document.getElementById('email-subject');
        const bodyElement = document.getElementById('email-body');
        
        if (!subjectElement || !bodyElement) return;

        const subject = subjectElement.value.trim();
        const body = bodyElement.value.trim();
        
        const settings = this.getSettings();
        settings.emailTemplate = { subject, body };
        this.saveSettings(settings);
        
        alert('メールテンプレートを更新しました。');
    }

    saveEmailJSConfig() {
        const configFields = [
            {id: 'emailjs-service-id', key: 'serviceId'},
            {id: 'emailjs-template-id', key: 'templateId'},
            {id: 'emailjs-public-key', key: 'publicKey'}
        ];

        const config = {};
        configFields.forEach(({id, key}) => {
            const element = document.getElementById(id);
            if (element) config[key] = element.value.trim();
        });
        
        const settings = this.getSettings();
        settings.emailjsConfig = config;
        this.saveSettings(settings);
        
        // Initialize EmailJS
        if (config.publicKey && typeof emailjs !== 'undefined') {
            emailjs.init(config.publicKey);
        }
        
        alert('EmailJS設定を保存しました。');
    }

    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    }
}

// Initialize the system when DOM is loaded
window.reservationSystem = new HospitalReservationSystem();
