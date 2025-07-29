// Hospital Reservation System JavaScript
class HospitalReservationSystem {
    constructor() {
        this.initializeData();
        this.initializeEventListeners();
        this.loadPatientInterface();
    }

    // Initialize default data structure
    initializeData() {
        if (!localStorage.getItem('hospitalReservationData')) {
            const defaultData = {
                settings: {
                    adminPassword: "admin123",
                    welcomeMessage: "当病院の予約システムへようこそ。ご希望の予約種類と日時をお選びください。",
                    emailConfig: {
                        apiKey: "",
                        fromEmail: "",
                        fromName: "病院予約システム"
                    },
                    emailTemplate: "ご予約ありがとうございます。\n\n予約詳細:\n日時: {date} {time}\n種類: {type}\nお名前: {name}\n\nご質問がございましたら、お電話にてお問い合わせください。",
                    emailSubject: "予約完了のお知らせ"
                },
                reservationTypes: [
                    {
                        id: 1,
                        name: "健康診断",
                        interval: 15,
                        capacity: 10,
                        dateRange: {
                            start: "2025-01-01",
                            end: "2025-12-31"
                        },
                        holidays: {
                            weekdays: [],
                            specificDates: []
                        },
                        weeklyHours: {
                            monday: {start: "09:00", end: "17:00"},
                            tuesday: {start: "09:00", end: "17:00"},
                            wednesday: {start: "09:00", end: "17:00"},
                            thursday: {start: "09:00", end: "17:00"},
                            friday: {start: "09:00", end: "17:00"},
                            saturday: {start: "09:00", end: "12:00"},
                            sunday: {start: "", end: ""}
                        }
                    },
                    {
                        id: 2,
                        name: "予防接種",
                        interval: 15,
                        capacity: 8,
                        dateRange: {
                            start: "2025-01-01",
                            end: "2025-12-31"
                        },
                        holidays: {
                            weekdays: [0, 6],
                            specificDates: []
                        },
                        weeklyHours: {
                            monday: {start: "09:00", end: "16:00"},
                            tuesday: {start: "09:00", end: "16:00"},
                            wednesday: {start: "09:00", end: "16:00"},
                            thursday: {start: "09:00", end: "16:00"},
                            friday: {start: "09:00", end: "16:00"},
                            saturday: {start: "", end: ""},
                            sunday: {start: "", end: ""}
                        }
                    }
                ],
                reservations: []
            };
            localStorage.setItem('hospitalReservationData', JSON.stringify(defaultData));
        }
    }

    // Get data from localStorage
    getData() {
        return JSON.parse(localStorage.getItem('hospitalReservationData'));
    }

    // Save data to localStorage
    saveData(data) {
        localStorage.setItem('hospitalReservationData', JSON.stringify(data));
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Admin login
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAdminLoginModal();
            });
        }

        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin();
            });
        }

        // Navigation
        const backToPatientBtn = document.getElementById('backToPatientBtn');
        if (backToPatientBtn) {
            backToPatientBtn.addEventListener('click', () => {
                this.showPatientInterface();
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.showPatientInterface();
            });
        }

        // Booking form
        const reservationType = document.getElementById('reservationType');
        if (reservationType) {
            reservationType.addEventListener('change', (e) => {
                this.handleReservationTypeChange(e.target.value);
            });
        }

        const reservationDate = document.getElementById('reservationDate');
        if (reservationDate) {
            reservationDate.addEventListener('change', (e) => {
                this.handleDateChange(e.target.value);
            });
        }

        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBookingSubmit();
            });
        }

        // Admin forms - will be initialized when admin interface loads
        this.initializeAdminEventListeners();

        // Tab navigation
        const adminTabs = document.querySelectorAll('#adminTabs a[data-bs-toggle="tab"]');
        adminTabs.forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                const targetId = e.target.getAttribute('href').substring(1);
                this.loadAdminTabContent(targetId);
            });
        });
    }

    // Initialize admin-specific event listeners
    initializeAdminEventListeners() {
        // Reservation type form
        const reservationTypeForm = document.getElementById('reservationTypeForm');
        if (reservationTypeForm) {
            reservationTypeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleReservationTypeSubmit();
            });
        }

        // Password change form  
        const passwordChangeForm = document.getElementById('passwordChangeForm');
        if (passwordChangeForm) {
            passwordChangeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordChange();
            });
        }

        // Welcome message form
        const welcomeMessageForm = document.getElementById('welcomeMessageForm');
        if (welcomeMessageForm) {
            welcomeMessageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleWelcomeMessageChange();
            });
        }

        // Email forms
        const emailConfigForm = document.getElementById('emailConfigForm');
        if (emailConfigForm) {
            emailConfigForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEmailConfigSave();
            });
        }

        const emailTemplateForm = document.getElementById('emailTemplateForm');
        if (emailTemplateForm) {
            emailTemplateForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEmailTemplateSave();
            });
        }

        // Data management buttons
        const exportDataBtn = document.getElementById('exportData');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        const importDataBtn = document.getElementById('importData');
        if (importDataBtn) {
            importDataBtn.addEventListener('click', () => {
                this.importData();
            });
        }

        const clearAllDataBtn = document.getElementById('clearAllData');
        if (clearAllDataBtn) {
            clearAllDataBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }

        // Reservation management
        const reservationFilter = document.getElementById('reservationFilter');
        if (reservationFilter) {
            reservationFilter.addEventListener('change', (e) => {
                this.filterReservations(e.target.value);
            });
        }

        const reservationSearch = document.getElementById('reservationSearch');
        if (reservationSearch) {
            reservationSearch.addEventListener('input', (e) => {
                this.searchReservations(e.target.value);
            });
        }

        const printReservationsBtn = document.getElementById('printReservations');
        if (printReservationsBtn) {
            printReservationsBtn.addEventListener('click', () => {
                this.printReservations();
            });
        }

        const viewCalendarBtn = document.getElementById('viewCalendar');
        if (viewCalendarBtn) {
            viewCalendarBtn.addEventListener('click', () => {
                this.showCalendarView();
            });
        }

        // Test buttons
        const testConnectionBtn = document.getElementById('testConnection');
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', () => {
                this.testEmailConnection();
            });
        }

        const sendTestEmailBtn = document.getElementById('sendTestEmail');
        if (sendTestEmailBtn) {
            sendTestEmailBtn.addEventListener('click', () => {
                this.sendTestEmail();
            });
        }
    }

    // Show admin login modal
    showAdminLoginModal() {
        const modal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
        modal.show();
    }

    // Load patient interface
    loadPatientInterface() {
        const data = this.getData();
        const welcomeMessageEl = document.getElementById('welcomeMessage');
        if (welcomeMessageEl) {
            welcomeMessageEl.textContent = data.settings.welcomeMessage;
        }
        this.loadReservationTypes();
    }

    // Load reservation types dropdown
    loadReservationTypes() {
        const data = this.getData();
        const select = document.getElementById('reservationType');
        if (!select) return;
        
        select.innerHTML = '<option value="">予約種類を選択</option>';
        
        data.reservationTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            select.appendChild(option);
        });
    }

    // Handle reservation type change
    handleReservationTypeChange(typeId) {
        const dateSelection = document.getElementById('dateSelection');
        const timeSelection = document.getElementById('timeSelection');
        const patientInfo = document.getElementById('patientInfo');
        const submitSection = document.getElementById('submitSection');

        if (typeId) {
            dateSelection.style.display = 'block';
            this.setupDateInput(typeId);
        } else {
            dateSelection.style.display = 'none';
            timeSelection.style.display = 'none';
            patientInfo.style.display = 'none';
            submitSection.style.display = 'none';
        }
    }

    // Setup date input constraints
    setupDateInput(typeId) {
        const data = this.getData();
        const type = data.reservationTypes.find(t => t.id == typeId);
        const dateInput = document.getElementById('reservationDate');
        
        if (type && dateInput) {
            dateInput.min = type.dateRange.start;
            dateInput.max = type.dateRange.end;
            
            // Set minimum date to today if start date is in the past
            const today = new Date().toISOString().split('T')[0];
            if (type.dateRange.start < today) {
                dateInput.min = today;
            }
        }
    }

    // Handle date change
    handleDateChange(date) {
        const timeSelection = document.getElementById('timeSelection');
        const patientInfo = document.getElementById('patientInfo');
        const submitSection = document.getElementById('submitSection');

        if (date) {
            const typeId = document.getElementById('reservationType').value;
            this.loadTimeSlots(typeId, date);
            timeSelection.style.display = 'block';
        } else {
            timeSelection.style.display = 'none';
            patientInfo.style.display = 'none';
            submitSection.style.display = 'none';
        }
    }

    // Load available time slots
    loadTimeSlots(typeId, date) {
        const data = this.getData();
        const type = data.reservationTypes.find(t => t.id == typeId);
        const selectedDate = new Date(date);
        const dayOfWeek = selectedDate.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        
        const container = document.getElementById('timeSlots');
        if (!container) return;
        
        container.innerHTML = '';

        // Check if the day is a holiday
        if (type.holidays.weekdays.includes(dayOfWeek) || 
            type.holidays.specificDates.includes(date)) {
            container.innerHTML = '<p class="text-muted">この日は休診日です。</p>';
            return;
        }

        // Get operating hours for the day
        const dayHours = type.weeklyHours[dayName];
        if (!dayHours.start || !dayHours.end) {
            container.innerHTML = '<p class="text-muted">この日は休診日です。</p>';
            return;
        }

        // Generate time slots
        const startTime = this.parseTime(dayHours.start);
        const endTime = this.parseTime(dayHours.end);
        const interval = type.interval;
        
        const existingReservations = data.reservations.filter(r => 
            r.type == typeId && r.date === date
        );

        for (let time = startTime; time < endTime; time += interval) {
            const timeStr = this.formatTime(time);
            const reservationCount = existingReservations.filter(r => r.time === timeStr).length;
            const isAvailable = reservationCount < type.capacity;
            
            const slot = document.createElement('div');
            slot.className = `time-slot ${!isAvailable ? 'full' : ''}`;
            slot.innerHTML = `
                <div class="time-slot-time">${timeStr}</div>
                <div class="time-slot-availability">${reservationCount}/${type.capacity}</div>
            `;
            
            if (isAvailable) {
                slot.addEventListener('click', () => {
                    this.selectTimeSlot(slot, timeStr);
                });
            }
            
            container.appendChild(slot);
        }
    }

    // Select time slot
    selectTimeSlot(slotElement, time) {
        // Remove previous selection
        document.querySelectorAll('.time-slot.selected').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Select current slot
        slotElement.classList.add('selected');
        const selectedTimeInput = document.getElementById('selectedTime');
        if (selectedTimeInput) {
            selectedTimeInput.value = time;
        }
        
        // Show patient info form
        const patientInfo = document.getElementById('patientInfo');
        const submitSection = document.getElementById('submitSection');
        if (patientInfo) patientInfo.style.display = 'block';
        if (submitSection) submitSection.style.display = 'block';
    }

    // Handle booking submission
    handleBookingSubmit() {
        const typeId = document.getElementById('reservationType').value;
        const date = document.getElementById('reservationDate').value;
        const time = document.getElementById('selectedTime').value;
        const name = document.getElementById('patientName').value;
        const email = document.getElementById('patientEmail').value;
        const phone = document.getElementById('patientPhone').value;
        const message = document.getElementById('patientMessage').value;

        // Validate required fields
        if (!typeId || !date || !time || !name || !email || !phone) {
            this.showAlert('すべての必須項目を入力してください。', 'warning');
            return;
        }

        // Check for duplicate booking (same email+phone on same day)
        const data = this.getData();
        const duplicate = data.reservations.find(r => 
            r.email === email && r.phone === phone && r.date === date
        );

        if (duplicate) {
            this.showAlert('同じメールアドレスと電話番号での重複予約はできません。', 'danger');
            return;
        }

        // Create reservation
        const reservation = {
            id: Date.now(),
            type: parseInt(typeId),
            date: date,
            time: time,
            name: name,
            email: email,  
            phone: phone,
            message: message,
            createdAt: new Date().toISOString()
        };

        // Save reservation
        data.reservations.push(reservation);
        this.saveData(data);

        // Show confirmation
        this.showBookingConfirmation(reservation);

        // Send confirmation email (simulated)
        this.sendConfirmationEmail(reservation);

        // Reset form
        this.resetBookingForm();
    }

    // Reset booking form
    resetBookingForm() {
        const form = document.getElementById('bookingForm');
        if (form) {
            form.reset();
        }
        
        const sections = ['dateSelection', 'timeSelection', 'patientInfo', 'submitSection'];
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'none';
            }
        });
    }

    // Show booking confirmation
    showBookingConfirmation(reservation) {
        const data = this.getData();
        const type = data.reservationTypes.find(t => t.id === reservation.type);
        
        const details = `
            <div class="alert alert-success">
                <h5><i class="bi bi-check-circle me-2"></i>予約が完了しました</h5>
                <hr>
                <p><strong>予約種類:</strong> ${type.name}</p>
                <p><strong>日時:</strong> ${reservation.date} ${reservation.time}</p>
                <p><strong>お名前:</strong> ${reservation.name}</p>
                <p><strong>メールアドレス:</strong> ${reservation.email}</p>
                <p><strong>電話番号:</strong> ${reservation.phone}</p>
                ${reservation.message ? `<p><strong>ご要望:</strong> ${reservation.message}</p>` : ''}
                <hr>
                <p class="mb-0">確認メールを送信いたします。</p>
            </div>
        `;
        
        const confirmationDetails = document.getElementById('confirmationDetails');
        if (confirmationDetails) {
            confirmationDetails.innerHTML = details;
            const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
            modal.show();
        }
    }

    // Simulate email sending
    sendConfirmationEmail(reservation) {
        const data = this.getData();
        const type = data.reservationTypes.find(t => t.id === reservation.type);
        
        // This would normally send an actual email via SendGrid
        console.log('Confirmation email sent to:', reservation.email);
        console.log('Email content:', this.generateEmailContent(reservation, type, data.settings));
        
        // Show success message
        setTimeout(() => {
            this.showAlert('確認メールを送信しました。', 'success');
        }, 1000);
    }

    // Generate email content
    generateEmailContent(reservation, type, settings) {
        let template = settings.emailTemplate;
        template = template.replace('{name}', reservation.name);
        template = template.replace('{date}', reservation.date);
        template = template.replace('{time}', reservation.time);
        template = template.replace('{type}', type.name);
        template = template.replace('{message}', reservation.message || '');
        return template;
    }

    // Handle admin login
    handleAdminLogin() {
        const passwordInput = document.getElementById('adminPassword');
        if (!passwordInput) return;
        
        const password = passwordInput.value;
        const data = this.getData();
        
        if (password === data.settings.adminPassword) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('adminLoginModal'));
            if (modal) {
                modal.hide();
            }
            this.showAdminInterface();
        } else {
            this.showAlert('パスワードが正しくありません。', 'danger');
        }
        
        // Clear password field
        passwordInput.value = '';
    }

    // Show admin interface
    showAdminInterface() {
        const patientInterface = document.getElementById('patientInterface');
        const adminInterface = document.getElementById('adminInterface');
        
        if (patientInterface) {
            patientInterface.style.display = 'none';
        }  
        if (adminInterface) {
            adminInterface.style.display = 'block';
        }
        
        this.loadAdminDashboard();
    }

    // Show patient interface
    showPatientInterface() {
        const adminInterface = document.getElementById('adminInterface');
        const patientInterface = document.getElementById('patientInterface');
        
        if (adminInterface) {
            adminInterface.style.display = 'none';
        }
        if (patientInterface) {
            patientInterface.style.display = 'block';
        }
        
        this.loadPatientInterface();
    }

    // Load admin dashboard
    loadAdminDashboard() {
        const data = this.getData();
        const today = new Date().toISOString().split('T')[0];
        
        // Update statistics
        const totalReservationsEl = document.getElementById('totalReservations');
        const todayReservationsEl = document.getElementById('todayReservations');
        const reservationTypesEl = document.getElementById('reservationTypes');
        const upcomingReservationsEl = document.getElementById('upcomingReservations');
        
        if (totalReservationsEl) {
            totalReservationsEl.textContent = data.reservations.length;
        }
        if (todayReservationsEl) {
            todayReservationsEl.textContent = data.reservations.filter(r => r.date === today).length;
        }
        if (reservationTypesEl) {
            reservationTypesEl.textContent = data.reservationTypes.length;
        }
        if (upcomingReservationsEl) {
            upcomingReservationsEl.textContent = data.reservations.filter(r => r.date >= today).length;
        }

        // Show recent reservations
        this.loadRecentReservations();
    }

    // Load recent reservations
    loadRecentReservations() {
        const data = this.getData();
        const recent = data.reservations
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        const container = document.getElementById('recentReservations');
        if (!container) return;
        
        if (recent.length === 0) {
            container.innerHTML = '<p class="text-muted">予約がありません。</p>';
            return;
        }

        let html = '<div class="table-responsive"><table class="table custom-table">';
        html += '<thead><tr><th>予約日時</th><th>種類</th><th>患者名</th><th>作成日時</th></tr></thead><tbody>';
        
        recent.forEach(reservation => {
            const type = data.reservationTypes.find(t => t.id === reservation.type);
            const createdAt = new Date(reservation.createdAt).toLocaleString('ja-JP');
            html += `
                <tr>
                    <td>${reservation.date} ${reservation.time}</td>
                    <td>${type ? type.name : '不明'}</td>
                    <td>${reservation.name}</td>
                    <td>${createdAt}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    }

    // Load admin tab content
    loadAdminTabContent(tabId) {
        switch(tabId) {
            case 'dashboard':
                this.loadAdminDashboard();
                break;
            case 'reservationTypes':
                this.loadReservationTypesAdmin();
                break;
            case 'reservationManagement':
                this.loadReservationManagement();
                break;
            case 'emailSettings':
                this.loadEmailSettings();
                break;
            case 'systemSettings':
                this.loadSystemSettings();
                break;
        }
    }

    // Load reservation types admin
    loadReservationTypesAdmin() {
        const data = this.getData();
        const container = document.getElementById('reservationTypesList');
        if (!container) return;
        
        if (data.reservationTypes.length === 0) {
            container.innerHTML = '<p class="text-muted">予約種類が登録されていません。</p>';
            return;
        }

        let html = '';
        data.reservationTypes.forEach(type => {
            html += `
                <div class="reservation-type-card card mb-3">
                    <div class="reservation-type-header">
                        <h6 class="mb-0">${type.name}</h6>
                        <div>
                            <button class="btn btn--outline btn--sm me-2" onclick="hospitalSystem.editReservationType(${type.id})">
                                <i class="bi bi-pencil"></i> 編集
                            </button>
                            <button class="btn btn-danger btn--sm" onclick="hospitalSystem.deleteReservationType(${type.id})">
                                <i class="bi bi-trash"></i> 削除
                            </button>
                        </div>
                    </div>
                    <div class="reservation-type-body">
                        <div class="type-info-grid">
                            <div class="type-info-item">
                                <i class="bi bi-clock type-info-icon"></i>
                                <div>
                                    <small>時間間隔</small><br>
                                    <strong>${type.interval}分</strong>
                                </div>
                            </div>
                            <div class="type-info-item">
                                <i class="bi bi-people type-info-icon"></i>
                                <div>
                                    <small>定員</small><br>
                                    <strong>${type.capacity}名</strong>
                                </div>
                            </div>
                            <div class="type-info-item">
                                <i class="bi bi-calendar-range type-info-icon"></i>
                                <div>
                                    <small>予約期間</small><br>
                                    <strong>${type.dateRange.start} ~ ${type.dateRange.end}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        this.setupWeeklyHoursForm();
    }

    // Setup weekly hours form
    setupWeeklyHoursForm() {
        const container = document.getElementById('weeklyHoursSettings');
        if (!container) return;
        
        const days = [
            {key: 'monday', name: '月曜日'},
            {key: 'tuesday', name: '火曜日'},
            {key: 'wednesday', name: '水曜日'},
            {key: 'thursday', name: '木曜日'},  
            {key: 'friday', name: '金曜日'},
            {key: 'saturday', name: '土曜日'},
            {key: 'sunday', name: '日曜日'}
        ];

        let html = '';
        days.forEach(day => {
            html += `
                <div class="weekly-hours-grid">
                    <div class="weekly-hours-day">${day.name}</div>
                    <input type="time" id="start_${day.key}" class="form-control" placeholder="開始時間">
                    <input type="time" id="end_${day.key}" class="form-control" placeholder="終了時間">
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // Other methods remain largely the same but with null checks added...
    // For brevity, I'll include key methods and add null checks throughout

    // Edit reservation type
    editReservationType(typeId) {
        const data = this.getData();
        const type = data.reservationTypes.find(t => t.id === typeId);
        
        if (type) {
            // Fill form with existing data
            const editingTypeIdEl = document.getElementById('editingTypeId');
            const typeNameEl = document.getElementById('typeName');
            const typeIntervalEl = document.getElementById('typeInterval');
            const typeCapacityEl = document.getElementById('typeCapacity');
            const typeStartDateEl = document.getElementById('typeStartDate');
            const typeEndDateEl = document.getElementById('typeEndDate');
            
            if (editingTypeIdEl) editingTypeIdEl.value = type.id;
            if (typeNameEl) typeNameEl.value = type.name;
            if (typeIntervalEl) typeIntervalEl.value = type.interval;
            if (typeCapacityEl) typeCapacityEl.value = type.capacity;
            if (typeStartDateEl) typeStartDateEl.value = type.dateRange.start;
            if (typeEndDateEl) typeEndDateEl.value = type.dateRange.end;
            
            // Fill weekly hours
            Object.keys(type.weeklyHours).forEach(day => {
                const startEl = document.getElementById(`start_${day}`);
                const endEl = document.getElementById(`end_${day}`);
                if (startEl) startEl.value = type.weeklyHours[day].start;
                if (endEl) endEl.value = type.weeklyHours[day].end;
            });
            
            const modal = new bootstrap.Modal(document.getElementById('reservationTypeModal'));
            modal.show();
        }
    }

    // Delete reservation type
    deleteReservationType(typeId) {
        if (confirm('この予約種類を削除してもよろしいですか？関連する予約もすべて削除されます。')) {
            const data = this.getData();
            data.reservationTypes = data.reservationTypes.filter(t => t.id !== typeId);
            data.reservations = data.reservations.filter(r => r.type !== typeId);
            this.saveData(data);
            this.loadReservationTypesAdmin();
            this.loadReservationTypes(); // Update patient dropdown
            this.showAlert('予約種類を削除しました。', 'success');
        }
    }

    // Handle reservation type form submission
    handleReservationTypeSubmit() {
        const data = this.getData();
        const editingIdEl = document.getElementById('editingTypeId');
        const editingId = editingIdEl ? editingIdEl.value : '';
        const isEditing = editingId !== '';
        
        const typeNameEl = document.getElementById('typeName');
        const typeIntervalEl = document.getElementById('typeInterval');
        const typeCapacityEl = document.getElementById('typeCapacity');
        const typeStartDateEl = document.getElementById('typeStartDate');
        const typeEndDateEl = document.getElementById('typeEndDate');
        
        if (!typeNameEl || !typeIntervalEl || !typeCapacityEl || !typeStartDateEl || !typeEndDateEl) {
            this.showAlert('フォームの必須項目を入力してください。', 'warning');
            return;
        }

        const typeData = {
            id: isEditing ? parseInt(editingId) : Date.now(),
            name: typeNameEl.value,
            interval: parseInt(typeIntervalEl.value),
            capacity: parseInt(typeCapacityEl.value),
            dateRange: {
                start: typeStartDateEl.value,
                end: typeEndDateEl.value
            },
            holidays: {
                weekdays: [],
                specificDates: []
            },
            weeklyHours: {}
        };

        // Collect weekly hours
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(day => {
            const startEl = document.getElementById(`start_${day}`);
            const endEl = document.getElementById(`end_${day}`);
            typeData.weeklyHours[day] = {
                start: startEl ? startEl.value : '',
                end: endEl ? endEl.value : ''
            };
        });

        if (isEditing) {
            const index = data.reservationTypes.findIndex(t => t.id === parseInt(editingId));
            if (index !== -1) {
                data.reservationTypes[index] = typeData;
            }
        } else {
            data.reservationTypes.push(typeData);
        }

        this.saveData(data);
        const modal = bootstrap.Modal.getInstance(document.getElementById('reservationTypeModal'));
        if (modal) {
            modal.hide();
        }
        this.loadReservationTypesAdmin();
        this.loadReservationTypes(); // Update patient interface dropdown
        this.showAlert(isEditing ? '予約種類を更新しました。' : '予約種類を追加しました。', 'success');
        
        // Clear form
        const form = document.getElementById('reservationTypeForm');
        if (form) {
            form.reset();
        }
        if (editingIdEl) {
            editingIdEl.value = '';
        }
    }

    // Simplified versions of other methods with null checks...
    loadReservationManagement() {
        this.filterReservations('all');
    }

    filterReservations(filter) {
        const data = this.getData();
        let filtered = [...data.reservations];
        const today = new Date();
        
        switch(filter) {
            case 'today':
                const todayStr = today.toISOString().split('T')[0];
                filtered = filtered.filter(r => r.date === todayStr);
                break;
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                filtered = filtered.filter(r => {
                    const rDate = new Date(r.date);
                    return rDate >= weekStart && rDate <= weekEnd;
                });
                break;
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                filtered = filtered.filter(r => {
                    const rDate = new Date(r.date);
                    return rDate >= monthStart && rDate <= monthEnd;
                });
                break;
        }
        
        this.displayReservations(filtered);
    }

    searchReservations(query) {
        const data = this.getData();
        const filtered = data.reservations.filter(r => 
            r.name.toLowerCase().includes(query.toLowerCase()) ||
            r.email.toLowerCase().includes(query.toLowerCase())
        );
        this.displayReservations(filtered);
    }

    displayReservations(reservations) {
        const data = this.getData();
        const container = document.getElementById('reservationsList');
        if (!container) return;
        
        if (reservations.length === 0) {
            container.innerHTML = '<p class="text-muted">予約がありません。</p>';
            return;
        }

        // Sort by date and time
        reservations.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA - dateB;
        });

        let html = '<div class="table-responsive"><table class="table custom-table">';
        html += `
            <thead>
                <tr>
                    <th>予約日時</th>
                    <th>種類</th>
                    <th>患者名</th>
                    <th>連絡先</th>
                    <th>備考</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        reservations.forEach(reservation => {
            const type = data.reservationTypes.find(t => t.id === reservation.type);
            html += `
                <tr>
                    <td>${reservation.date}<br><small>${reservation.time}</small></td>
                    <td><span class="badge badge-primary">${type ? type.name : '不明'}</span></td>
                    <td>${reservation.name}</td>
                    <td>
                        <small>${reservation.email}</small><br>
                        <small>${reservation.phone}</small>
                    </td>
                    <td>${reservation.message ? `<small>${reservation.message}</small>` : '-'}</td>
                    <td>
                        <button class="btn btn--outline btn--sm me-1" 
                                onclick="hospitalSystem.editReservation(${reservation.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger btn--sm" 
                                onclick="hospitalSystem.deleteReservation(${reservation.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    }

    deleteReservation(reservationId) {
        if (confirm('この予約を削除してもよろしいですか？')) {
            const data = this.getData();
            data.reservations = data.reservations.filter(r => r.id !== reservationId);
            this.saveData(data);
            this.loadReservationManagement();
            this.showAlert('予約を削除しました。', 'success');
        }
    }

    // Load email settings
    loadEmailSettings() {
        const data = this.getData();
        const emailApiKeyEl = document.getElementById('emailApiKey');
        const emailFromEmailEl = document.getElementById('emailFromEmail');
        const emailFromNameEl = document.getElementById('emailFromName');
        const emailSubjectEl = document.getElementById('emailSubject');
        const emailTemplateEl = document.getElementById('emailTemplate');
        
        if (emailApiKeyEl) emailApiKeyEl.value = data.settings.emailConfig.apiKey;
        if (emailFromEmailEl) emailFromEmailEl.value = data.settings.emailConfig.fromEmail;
        if (emailFromNameEl) emailFromNameEl.value = data.settings.emailConfig.fromName;
        if (emailSubjectEl) emailSubjectEl.value = data.settings.emailSubject;
        if (emailTemplateEl) emailTemplateEl.value = data.settings.emailTemplate;
    }

    // Handle email config save
    handleEmailConfigSave() {
        const data = this.getData();
        const emailApiKeyEl = document.getElementById('emailApiKey');
        const emailFromEmailEl = document.getElementById('emailFromEmail');
        const emailFromNameEl = document.getElementById('emailFromName');
        
        data.settings.emailConfig = {
            apiKey: emailApiKeyEl ? emailApiKeyEl.value : '',
            fromEmail: emailFromEmailEl ? emailFromEmailEl.value : '',
            fromName: emailFromNameEl ? emailFromNameEl.value : ''
        };
        this.saveData(data);
        this.showAlert('メール設定を保存しました。', 'success');
    }

    // Handle email template save
    handleEmailTemplateSave() {  
        const data = this.getData();
        const emailSubjectEl = document.getElementById('emailSubject');
        const emailTemplateEl = document.getElementById('emailTemplate');
        
        data.settings.emailSubject = emailSubjectEl ? emailSubjectEl.value : '';
        data.settings.emailTemplate = emailTemplateEl ? emailTemplateEl.value : '';
        this.saveData(data);
        this.showAlert('メールテンプレートを保存しました。', 'success');
    }

    // Test email connection
    testEmailConnection() {
        const emailApiKeyEl = document.getElementById('emailApiKey');
        const apiKey = emailApiKeyEl ? emailApiKeyEl.value : '';
        if (!apiKey) {
            this.showAlert('APIキーを入力してください。', 'warning');
            return;
        }
        
        // Simulate connection test
        setTimeout(() => {
            this.showAlert('SendGrid接続テストが完了しました。（シミュレーション）', 'info');
        }, 1000);
    }

    // Send test email
    sendTestEmail() {
        const emailFromEmailEl = document.getElementById('emailFromEmail');
        const email = emailFromEmailEl ? emailFromEmailEl.value : '';
        if (!email) {
            this.showAlert('送信者メールアドレスを入力してください。', 'warning');
            return;
        }
        
        // Simulate test email
        setTimeout(() => {
            this.showAlert(`テストメールを ${email} に送信しました。（シミュレーション）`, 'info');
        }, 1000);
    }

    // Load system settings
    loadSystemSettings() {
        const data = this.getData();
        const welcomeMessageTextEl = document.getElementById('welcomeMessageText');
        if (welcomeMessageTextEl) {
            welcomeMessageTextEl.value = data.settings.welcomeMessage;
        }
    }

    // Handle password change
    handlePasswordChange() {
        const data = this.getData();
        const currentPasswordEl = document.getElementById('currentPassword');
        const newPasswordEl = document.getElementById('newPassword');
        const confirmPasswordEl = document.getElementById('confirmPassword');
        
        if (!currentPasswordEl || !newPasswordEl || !confirmPasswordEl) {
            this.showAlert('パスワード変更フォームに問題があります。', 'danger');
            return;
        }
        
        const currentPassword = currentPasswordEl.value;
        const newPassword = newPasswordEl.value;
        const confirmPassword = confirmPasswordEl.value;
        
        if (currentPassword !== data.settings.adminPassword) {
            this.showAlert('現在のパスワードが正しくありません。', 'danger');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showAlert('新しいパスワードが一致しません。', 'danger');
            return;
        }
        
        if (newPassword.length < 4) {
            this.showAlert('パスワードは4文字以上で入力してください。', 'danger');
            return;
        }
        
        data.settings.adminPassword = newPassword;
        this.saveData(data);
        this.showAlert('パスワードを変更しました。', 'success');
        
        const form = document.getElementById('passwordChangeForm');
        if (form) {
            form.reset();
        }
    }

    // Handle welcome message change
    handleWelcomeMessageChange() {
        const data = this.getData();
        const welcomeMessageTextEl = document.getElementById('welcomeMessageText');
        
        if (!welcomeMessageTextEl) {
            this.showAlert('ウェルカムメッセージフォームに問題があります。', 'danger');
            return;
        }
        
        const newMessage = welcomeMessageTextEl.value;
        data.settings.welcomeMessage = newMessage;
        this.saveData(data);
        
        const welcomeMessageEl = document.getElementById('welcomeMessage');
        if (welcomeMessageEl) {
            welcomeMessageEl.textContent = newMessage;
        }
        
        this.showAlert('ウェルカムメッセージを更新しました。', 'success');
    }

    // Data management methods with error handling
    exportData() {
        try {
            const data = this.getData();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `hospital_reservation_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showAlert('データをエクスポートしました。', 'success');
        } catch (error) {
            this.showAlert('データのエクスポートに失敗しました。', 'danger');
        }
    }

    importData() {
        const fileInput = document.getElementById('importFile');
        if (!fileInput) {
            this.showAlert('ファイル入力フィールドが見つかりません。', 'danger');
            return;
        }
        
        const file = fileInput.files[0];
        if (!file) {
            this.showAlert('ファイルを選択してください。', 'warning');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate data structure
                if (!importedData.settings || !importedData.reservationTypes || !importedData.reservations) {
                    throw new Error('Invalid data format');
                }
                
                localStorage.setItem('hospitalReservationData', JSON.stringify(importedData));
                this.showAlert('データをインポートしました。ページを再読み込みしてください。', 'success');
                
                // Reload the page after a short delay
                setTimeout(() => {
                    location.reload();
                }, 2000);
                
            } catch (error) {
                this.showAlert('ファイルが正しくありません。', 'danger');
            }
        };
        reader.readAsText(file);
    }

    clearAllData() {
        if (confirm('すべてのデータを削除してもよろしいですか？この操作は取り消せません。')) {
            if (confirm('本当にすべてのデータを削除しますか？')) {
                localStorage.removeItem('hospitalReservationData');
                this.initializeData();
                this.showAlert('すべてのデータを削除しました。ページを再読み込みしてください。', 'info');
                setTimeout(() => {
                    location.reload();
                }, 2000);
            }
        }
    }

    // Print reservations
    printReservations() {
        const data = this.getData();
        const printWindow = window.open('', '_blank');
        const now = new Date().toLocaleString('ja-JP');
        
        let html = `
            <html>
                <head>
                    <title>予約一覧 - ${now}</title>
                    <style>
                        body { font-family: sans-serif; }
                        .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        .print-table { width: 100%; border-collapse: collapse; }
                        .print-table th, .print-table td { border: 1px solid #333; padding: 8px; text-align: left; }
                        .print-table th { background: #f5f5f5; }
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <h1>予約一覧</h1>
                        <p>作成日時: ${now}</p>
                    </div>
                    <table class="print-table">
                        <thead>
                            <tr>
                                <th>予約日時</th>
                                <th>種類</th>
                                <th>患者名</th>
                                <th>連絡先</th>
                                <th>備考</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // Sort reservations by date and time
        const sortedReservations = data.reservations.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA - dateB;
        });
        
        sortedReservations.forEach(reservation => {
            const type = data.reservationTypes.find(t => t.id === reservation.type);
            html += `
                <tr>
                    <td>${reservation.date} ${reservation.time}</td>
                    <td>${type ? type.name : '不明'}</td>
                    <td>${reservation.name}</td>
                    <td>${reservation.email}<br>${reservation.phone}</td>
                    <td>${reservation.message || '-'}</td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </body>
            </html>
        `;
        
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }

    // Show calendar view  
    showCalendarView() {
        this.generateCalendarView();
        const modal = new bootstrap.Modal(document.getElementById('calendarModal'));
        modal.show();
    }

    // Generate calendar view
    generateCalendarView() {
        const data = this.getData();
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const monthNames = [
            '1月', '2月', '3月', '4月', '5月', '6月',
            '7月', '8月', '9月', '10月', '11月', '12月'
        ];
        
        let html = `
            <div class="text-center mb-4">
                <h4>${year}年 ${monthNames[month]}</h4>
            </div>
            <div class="calendar-container">
                <div class="calendar-grid">
                    <div class="calendar-header">日</div>
                    <div class="calendar-header">月</div>
                    <div class="calendar-header">火</div>
                    <div class="calendar-header">水</div>
                    <div class="calendar-header">木</div>
                    <div class="calendar-header">金</div>
                    <div class="calendar-header">土</div>
        `;
        
        const currentDate = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayReservations = data.reservations.filter(r => r.date === dateStr);
            const isCurrentMonth = currentDate.getMonth() === month;
            
            html += `
                <div class="calendar-day ${dayReservations.length > 0 ? 'has-reservations' : ''}" 
                     style="${!isCurrentMonth ? 'opacity: 0.3;' : ''}">
                    <div class="calendar-day-number">${currentDate.getDate()}</div>
                    ${dayReservations.length > 0 ? 
                        `<div class="calendar-reservation-count">${dayReservations.length}</div>` : 
                        ''}
                    <div class="calendar-reservations">
                        ${dayReservations.slice(0, 2).map(r => {
                            const type = data.reservationTypes.find(t => t.id === r.type);
                            return `<div style="font-size: 10px;">${r.time} ${type ? type.name : ''}</div>`;
                        }).join('')}
                        ${dayReservations.length > 2 ? `<div style="font-size: 10px;">+${dayReservations.length - 2}</div>` : ''}
                    </div>
                </div>
            `;
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        html += '</div></div>';
        const calendarView = document.getElementById('calendarView');
        if (calendarView) {
            calendarView.innerHTML = html;
        }
    }

    // Utility functions
    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    showAlert(message, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
}

// Initialize the system when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hospitalSystem = new HospitalReservationSystem();
});
