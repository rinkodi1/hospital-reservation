// Hospital Reservation System JavaScript

class HospitalReservationSystem {
    constructor() {
        this.currentTab = 'dashboard';
        this.selectedTimeSlot = null;
        this.init();
    }

    init() {
        this.initializeData();
        this.bindEvents();
        this.loadPatientMessage();
        this.loadAppointmentTypes();
        this.updateDashboard();
    }

    initializeData() {
        // Initialize default data if not exists
        if (!localStorage.getItem('hospitalData')) {
            const defaultData = {
                settings: {
                    adminPassword: 'admin123',
                    patientMessage: '当院のオンライン予約システムへようこそ。ご予約をお取りください。',
                    emailTemplate: `ご予約ありがとうございます。

予約詳細:
名前: {{name}}
予約種類: {{type}}
日時: {{date}} {{time}}

ご不明な点がございましたら、お電話でお気軽にお問い合わせください。`,
                    emailjsServiceId: 'service_sj4j47e',
                    emailjsTemplateId: 'template_u2cwp0d',
                    emailjsPublicKey: 'xyuPENz5fwFEEPlrP'
                },
                appointmentTypes: [
                    {
                        id: 1,
                        name: '健康診断',
                        duration: 15,
                        capacity: 10,
                        startTime: '09:00',
                        endTime: '17:00',
                        availableFrom: '2025-01-01',
                        availableTo: '2025-12-31',
                        closedDays: ['日曜日'],
                        closedDates: [],
                        weeklyHours: {
                            '月曜日': {start: '09:00', end: '17:00'},
                            '火曜日': {start: '09:00', end: '17:00'},
                            '水曜日': {start: '09:00', end: '17:00'},
                            '木曜日': {start: '09:00', end: '17:00'},
                            '金曜日': {start: '09:00', end: '17:00'},
                            '土曜日': {start: '09:00', end: '12:00'},
                            '日曜日': {start: '', end: ''}
                        }
                    },
                    {
                        id: 2,
                        name: '予防接種',
                        duration: 15,
                        capacity: 5,
                        startTime: '14:00',
                        endTime: '16:00',
                        availableFrom: '2025-01-01',
                        availableTo: '2025-12-31',
                        closedDays: ['日曜日', '土曜日'],
                        closedDates: [],
                        weeklyHours: {
                            '月曜日': {start: '14:00', end: '16:00'},
                            '火曜日': {start: '14:00', end: '16:00'},
                            '水曜日': {start: '14:00', end: '16:00'},
                            '木曜日': {start: '14:00', end: '16:00'},
                            '金曜日': {start: '14:00', end: '16:00'},
                            '土曜日': {start: '', end: ''},
                            '日曜日': {start: '', end: ''}
                        }
                    }
                ],
                reservations: []
            };
            localStorage.setItem('hospitalData', JSON.stringify(defaultData));
        }
    }

    getData() {
        return JSON.parse(localStorage.getItem('hospitalData'));
    }

    saveData(data) {
        localStorage.setItem('hospitalData', JSON.stringify(data));
    }

    bindEvents() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
            return;
        }

        // Patient form events
        const reservationForm = document.getElementById('reservationForm');
        if (reservationForm) {
            reservationForm.addEventListener('submit', (e) => this.handleReservationSubmit(e));
        }

        const appointmentTypeSelect = document.getElementById('appointmentType');
        if (appointmentTypeSelect) {
            appointmentTypeSelect.addEventListener('change', () => this.handleAppointmentTypeChange());
        }

        const appointmentDateInput = document.getElementById('appointmentDate');
        if (appointmentDateInput) {
            appointmentDateInput.addEventListener('change', () => this.loadTimeSlots());
        }

        // Admin login events
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', () => this.showAdminLogin());
        }

        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }

        const cancelLoginBtn = document.getElementById('cancelLogin');
        if (cancelLoginBtn) {
            cancelLoginBtn.addEventListener('click', () => this.hideAdminLogin());
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Settings events
        const passwordChangeForm = document.getElementById('passwordChangeForm');
        if (passwordChangeForm) {
            passwordChangeForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }

        const updatePatientMessageBtn = document.getElementById('updatePatientMessage');
        if (updatePatientMessageBtn) {
            updatePatientMessageBtn.addEventListener('click', () => this.updatePatientMessage());
        }

        const updateEmailTemplateBtn = document.getElementById('updateEmailTemplate');
        if (updateEmailTemplateBtn) {
            updateEmailTemplateBtn.addEventListener('click', () => this.updateEmailTemplate());
        }

        const saveEmailjsSettingsBtn = document.getElementById('saveEmailjsSettings');
        if (saveEmailjsSettingsBtn) {
            saveEmailjsSettingsBtn.addEventListener('click', () => this.saveEmailjsSettings());
        }

        const testEmailjsBtn = document.getElementById('testEmailjs');
        if (testEmailjsBtn) {
            testEmailjsBtn.addEventListener('click', () => this.testEmailjs());
        }

        // Appointment type events
        const addAppointmentTypeBtn = document.getElementById('addAppointmentType');
        if (addAppointmentTypeBtn) {
            addAppointmentTypeBtn.addEventListener('click', () => this.showAppointmentTypeModal());
        }

        const appointmentTypeForm = document.getElementById('appointmentTypeForm');
        if (appointmentTypeForm) {
            appointmentTypeForm.addEventListener('submit', (e) => this.handleAppointmentTypeSubmit(e));
        }

        const cancelAppointmentTypeBtn = document.getElementById('cancelAppointmentType');
        if (cancelAppointmentTypeBtn) {
            cancelAppointmentTypeBtn.addEventListener('click', () => this.hideAppointmentTypeModal());
        }

        // Reservation management events
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterReservations());
        }

        const sortBySelect = document.getElementById('sortBy');
        if (sortBySelect) {
            sortBySelect.addEventListener('change', () => this.sortReservations());
        }

        const toggleCalendarViewBtn = document.getElementById('toggleCalendarView');
        if (toggleCalendarViewBtn) {
            toggleCalendarViewBtn.addEventListener('click', () => this.toggleCalendarView());
        }

        const calendarMonthInput = document.getElementById('calendarMonth');
        if (calendarMonthInput) {
            calendarMonthInput.addEventListener('change', () => this.renderCalendar());
        }

        // Edit reservation events
        const editReservationForm = document.getElementById('editReservationForm');
        if (editReservationForm) {
            editReservationForm.addEventListener('submit', (e) => this.handleEditReservationSubmit(e));
        }

        const cancelEditBtn = document.getElementById('cancelEdit');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => this.hideEditReservationModal());
        }

        // Report events
        const generateReportBtn = document.getElementById('generateReport');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => this.generateReport());
        }

        const printReportBtn = document.getElementById('printReport');
        if (printReportBtn) {
            printReportBtn.addEventListener('click', () => this.printReport());
        }

        // Backup events
        const exportDataBtn = document.getElementById('exportData');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportData());
        }

        const importDataBtn = document.getElementById('importData');
        if (importDataBtn) {
            importDataBtn.addEventListener('click', () => this.importData());
        }

        const autoBackupBtn = document.getElementById('autoBackup');
        if (autoBackupBtn) {
            autoBackupBtn.addEventListener('click', () => this.autoBackup());
        }

        // Modal overlay clicks
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    }

    // Patient reservation methods
    loadPatientMessage() {
        const data = this.getData();
        const messageElement = document.getElementById('patientMessage');
        if (messageElement) {
            messageElement.textContent = data.settings.patientMessage;
        }
    }

    loadAppointmentTypes() {
        const data = this.getData();
        const select = document.getElementById('appointmentType');
        if (!select) return;
        
        select.innerHTML = '<option value="">選択してください</option>';
        
        data.appointmentTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            select.appendChild(option);
        });
    }

    handleAppointmentTypeChange() {
        const typeId = document.getElementById('appointmentType').value;
        const dateInput = document.getElementById('appointmentDate');
        
        if (typeId) {
            const data = this.getData();
            const type = data.appointmentTypes.find(t => t.id == typeId);
            
            // Set min and max dates
            dateInput.min = type.availableFrom;
            dateInput.max = type.availableTo;
            dateInput.disabled = false;
            
            // Set today as minimum date if availableFrom is in the past
            const today = new Date().toISOString().split('T')[0];
            if (type.availableFrom < today) {
                dateInput.min = today;
            }
            
            if (dateInput.value) {
                this.loadTimeSlots();
            }
        } else {
            dateInput.disabled = true;
            dateInput.value = '';
            document.getElementById('timeSlotGroup').style.display = 'none';
        }
    }

    loadTimeSlots() {
        const typeId = document.getElementById('appointmentType').value;
        const selectedDate = document.getElementById('appointmentDate').value;
        
        if (!typeId || !selectedDate) return;
        
        const data = this.getData();
        const type = data.appointmentTypes.find(t => t.id == typeId);
        const dayOfWeek = this.getDayOfWeek(selectedDate);
        
        // Check if the selected date is available
        if (type.closedDays.includes(dayOfWeek) || type.closedDates.includes(selectedDate)) {
            document.getElementById('timeSlotGroup').style.display = 'none';
            alert('選択された日は予約をお受けできません。');
            return;
        }
        
        const weeklyHour = type.weeklyHours[dayOfWeek];
        if (!weeklyHour || !weeklyHour.start || !weeklyHour.end) {
            document.getElementById('timeSlotGroup').style.display = 'none';
            alert('選択された日は営業しておりません。');
            return;
        }
        
        const timeSlots = this.generateTimeSlots(type, selectedDate, weeklyHour);
        this.renderTimeSlots(timeSlots);
        document.getElementById('timeSlotGroup').style.display = 'block';
    }

    generateTimeSlots(type, date, weeklyHour) {
        const slots = [];
        const startTime = this.parseTime(weeklyHour.start);
        const endTime = this.parseTime(weeklyHour.end);
        const duration = type.duration;
        
        const data = this.getData();
        const existingReservations = data.reservations.filter(r => 
            r.appointmentTypeId == type.id && r.date === date
        );
        
        let currentTime = startTime;
        while (currentTime < endTime) {
            const timeString = this.formatTime(currentTime);
            const reservationCount = existingReservations.filter(r => r.time === timeString).length;
            
            slots.push({
                time: timeString,
                available: reservationCount < type.capacity,
                count: reservationCount,
                capacity: type.capacity
            });
            
            currentTime += duration;
        }
        
        return slots;
    }

    renderTimeSlots(slots) {
        const container = document.getElementById('timeSlots');
        if (!container) return;
        
        container.innerHTML = '';
        
        slots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = `time-slot ${!slot.available ? 'unavailable' : ''}`;
            slotElement.innerHTML = `
                <div>${slot.time}</div>
                <div class="time-slot-info">${slot.count}/${slot.capacity}</div>
            `;
            
            if (slot.available) {
                slotElement.addEventListener('click', () => this.selectTimeSlot(slotElement, slot.time));
            }
            
            container.appendChild(slotElement);
        });
    }

    selectTimeSlot(element, time) {
        document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
        element.classList.add('selected');
        this.selectedTimeSlot = time;
    }

    async handleReservationSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('patientName').value,
            email: document.getElementById('patientEmail').value,
            phone: document.getElementById('patientPhone').value,
            appointmentTypeId: parseInt(document.getElementById('appointmentType').value),
            date: document.getElementById('appointmentDate').value,
            time: this.selectedTimeSlot,
            remarks: document.getElementById('remarks').value
        };
        
        if (!this.selectedTimeSlot) {
            alert('予約時間を選択してください。');
            return;
        }
        
        // Check for duplicate reservations
        const data = this.getData();
        const existingReservation = data.reservations.find(r => 
            r.email === formData.email && 
            r.appointmentTypeId === formData.appointmentTypeId &&
            r.date === formData.date
        );
        
        if (existingReservation) {
            alert('同じ種類の予約が既に存在します。重複予約はできません。');
            return;
        }
        
        // Create reservation
        const reservation = {
            id: Date.now(),
            ...formData,
            createdAt: new Date().toISOString()
        };
        
        data.reservations.push(reservation);
        this.saveData(data);
        
        // Send confirmation email
        await this.sendConfirmationEmail(reservation);
        
        alert('予約が完了しました。確認メールをお送りしました。');
        document.getElementById('reservationForm').reset();
        this.selectedTimeSlot = null;
        document.getElementById('timeSlotGroup').style.display = 'none';
        document.getElementById('appointmentDate').disabled = true;
    }

    async sendConfirmationEmail(reservation) {
        const data = this.getData();
        const settings = data.settings;
        
        if (!settings.emailjsServiceId || !settings.emailjsTemplateId || !settings.emailjsPublicKey) {
            console.warn('EmailJS not configured');
            return;
        }
        
        const appointmentType = data.appointmentTypes.find(t => t.id === reservation.appointmentTypeId);
        
        const emailContent = settings.emailTemplate
            .replace('{{name}}', reservation.name)
            .replace('{{type}}', appointmentType.name)
            .replace('{{date}}', reservation.date)
            .replace('{{time}}', reservation.time);
        
        try {
            if (typeof emailjs !== 'undefined') {
                await emailjs.send(
                    settings.emailjsServiceId,
                    settings.emailjsTemplateId,
                    {
                        to_email: reservation.email,
                        to_name: reservation.name,
                        message: emailContent,
                        subject: '予約確認 - ' + appointmentType.name
                    },
                    settings.emailjsPublicKey
                );
            }
        } catch (error) {
            console.error('Email sending failed:', error);
        }
    }

    // Admin authentication methods
    showAdminLogin() {
        const modal = document.getElementById('adminLoginModal');
        if (modal) {
            modal.classList.remove('hidden');
            const passwordInput = document.getElementById('adminPassword');
            if (passwordInput) {
                passwordInput.focus();
            }
        }
    }

    hideAdminLogin() {
        const modal = document.getElementById('adminLoginModal');
        if (modal) {
            modal.classList.add('hidden');
            const passwordInput = document.getElementById('adminPassword');
            if (passwordInput) {
                passwordInput.value = '';
            }
        }
    }

    handleAdminLogin(e) {
        e.preventDefault();
        const passwordInput = document.getElementById('adminPassword');
        if (!passwordInput) return;
        
        const password = passwordInput.value;
        const data = this.getData();
        
        if (password === data.settings.adminPassword) {
            this.hideAdminLogin();
            this.showAdminView();
        } else {
            alert('パスワードが間違っています。');
        }
    }

    showAdminView() {
        const patientView = document.getElementById('patientView');
        const adminView = document.getElementById('adminView');
        
        if (patientView) patientView.classList.add('hidden');
        if (adminView) adminView.classList.remove('hidden');
        
        this.loadAdminData();
    }

    handleLogout() {
        const adminView = document.getElementById('adminView');
        const patientView = document.getElementById('patientView');
        
        if (adminView) adminView.classList.add('hidden');
        if (patientView) patientView.classList.remove('hidden');
    }

    // Admin dashboard methods
    loadAdminData() {
        this.updateDashboard();
        this.loadReservationsTable();
        this.loadAppointmentTypesList();
        this.loadSettings();
        this.loadReportData();
    }

    updateDashboard() {
        const data = this.getData();
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = today.substring(0, 7);
        
        const todayReservations = data.reservations.filter(r => r.date === today).length;
        const monthReservations = data.reservations.filter(r => r.date.startsWith(thisMonth)).length;
        
        const todayElement = document.getElementById('todayReservations');
        const monthElement = document.getElementById('monthReservations');
        const typesElement = document.getElementById('appointmentTypesCount');
        
        if (todayElement) todayElement.textContent = todayReservations;
        if (monthElement) monthElement.textContent = monthReservations;
        if (typesElement) typesElement.textContent = data.appointmentTypes.length;
        
        this.loadRecentReservations();
    }

    loadRecentReservations() {
        const data = this.getData();
        const recent = data.reservations
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        const container = document.getElementById('recentReservationsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (recent.length === 0) {
            container.innerHTML = '<p>最近の予約はありません</p>';
            return;
        }
        
        recent.forEach(reservation => {
            const type = data.appointmentTypes.find(t => t.id === reservation.appointmentTypeId);
            const div = document.createElement('div');
            div.className = 'recent-reservation-item';
            div.innerHTML = `
                <div><strong>${reservation.name}</strong> - ${type ? type.name : '不明'}</div>
                <div>${reservation.date} ${reservation.time}</div>
            `;
            container.appendChild(div);
        });
    }

    // Tab switching
    switchTab(tabName) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(tabName);
        
        if (tabButton) tabButton.classList.add('active');
        if (tabContent) tabContent.classList.add('active');
        
        this.currentTab = tabName;
        
        if (tabName === 'reservations') {
            this.loadReservationsTable();
        } else if (tabName === 'appointment-types') {
            this.loadAppointmentTypesList();
        } else if (tabName === 'settings') {
            this.loadSettings();
        } else if (tabName === 'reports') {
            this.loadReportData();
        }
    }

    // Reservation management methods
    loadReservationsTable() {
        const data = this.getData();
        const tbody = document.querySelector('#reservationsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        data.reservations
            .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
            .forEach(reservation => {
                const type = data.appointmentTypes.find(t => t.id === reservation.appointmentTypeId);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${reservation.date}</td>
                    <td>${reservation.time}</td>
                    <td>${type ? type.name : '不明'}</td>
                    <td>${reservation.name}</td>
                    <td>${reservation.email}</td>
                    <td>${reservation.phone}</td>
                    <td>${reservation.remarks || '-'}</td>
                    <td>
                        <button class="action-btn action-btn--edit" onclick="reservationSystem.editReservation(${reservation.id})">編集</button>
                        <button class="action-btn action-btn--delete" onclick="reservationSystem.deleteReservation(${reservation.id})">削除</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
    }

    editReservation(id) {
        const data = this.getData();
        const reservation = data.reservations.find(r => r.id === id);
        if (!reservation) return;
        
        document.getElementById('editReservationId').value = reservation.id;
        document.getElementById('editName').value = reservation.name;
        document.getElementById('editEmail').value = reservation.email;
        document.getElementById('editPhone').value = reservation.phone;
        document.getElementById('editDate').value = reservation.date;
        document.getElementById('editTime').value = reservation.time;
        document.getElementById('editRemarks').value = reservation.remarks || '';
        
        document.getElementById('editReservationModal').classList.remove('hidden');
    }

    handleEditReservationSubmit(e) {
        e.preventDefault();
        
        const id = parseInt(document.getElementById('editReservationId').value);
        const data = this.getData();
        const reservationIndex = data.reservations.findIndex(r => r.id === id);
        
        if (reservationIndex === -1) return;
        
        data.reservations[reservationIndex] = {
            ...data.reservations[reservationIndex],
            name: document.getElementById('editName').value,
            email: document.getElementById('editEmail').value,
            phone: document.getElementById('editPhone').value,
            date: document.getElementById('editDate').value,
            time: document.getElementById('editTime').value,
            remarks: document.getElementById('editRemarks').value
        };
        
        this.saveData(data);
        this.hideEditReservationModal();
        this.loadReservationsTable();
        alert('予約を更新しました。');
    }

    hideEditReservationModal() {
        const modal = document.getElementById('editReservationModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    deleteReservation(id) {
        if (!confirm('この予約を削除しますか？')) return;
        
        const data = this.getData();
        data.reservations = data.reservations.filter(r => r.id !== id);
        this.saveData(data);
        this.loadReservationsTable();
        this.updateDashboard();
        alert('予約を削除しました。');
    }

    filterReservations() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;
        
        const searchTerm = searchInput.value.toLowerCase();
        const rows = document.querySelectorAll('#reservationsTable tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    sortReservations() {
        const sortBySelect = document.getElementById('sortBy');
        if (!sortBySelect) return;
        
        const sortBy = sortBySelect.value;
        const data = this.getData();
        
        let sortedReservations;
        switch (sortBy) {
            case 'name':
                sortedReservations = data.reservations.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'type':
                sortedReservations = data.reservations.sort((a, b) => a.appointmentTypeId - b.appointmentTypeId);
                break;
            default:
                sortedReservations = data.reservations.sort((a, b) => 
                    new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time)
                );
        }
        
        data.reservations = sortedReservations;
        this.saveData(data);
        this.loadReservationsTable();
    }

    toggleCalendarView() {
        const tableView = document.getElementById('reservationTableView');
        const calendarView = document.getElementById('reservationCalendarView');
        const button = document.getElementById('toggleCalendarView');
        
        if (!tableView || !calendarView || !button) return;
        
        if (tableView.classList.contains('hidden')) {
            tableView.classList.remove('hidden');
            calendarView.classList.add('hidden');
            button.textContent = 'カレンダー表示';
        } else {
            tableView.classList.add('hidden');
            calendarView.classList.remove('hidden');
            button.textContent = 'テーブル表示';
            this.renderCalendar();
        }
    }

    renderCalendar() {
        const monthInput = document.getElementById('calendarMonth');
        if (!monthInput) return;
        
        if (!monthInput.value) {
            const today = new Date();
            monthInput.value = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
        }
        
        // Calendar rendering logic would go here
        // For brevity, showing a simplified version
        const calendar = document.getElementById('calendar');
        if (calendar) {
            calendar.innerHTML = '<p>カレンダー表示は準備中です</p>';
        }
    }

    // Settings and other methods continue...
    // (Including all remaining methods from the original file)

    loadAppointmentTypesList() {
        const data = this.getData();
        const container = document.getElementById('appointmentTypesList');
        if (!container) return;
        
        container.innerHTML = '';
        
        data.appointmentTypes.forEach(type => {
            const card = document.createElement('div');
            card.className = 'appointment-type-card';
            card.innerHTML = `
                <div class="appointment-type-header">
                    <h3 class="appointment-type-name">${type.name}</h3>
                    <div class="appointment-type-actions">
                        <button class="btn btn--sm btn--secondary" onclick="reservationSystem.editAppointmentType(${type.id})">編集</button>
                        <button class="btn btn--sm btn--outline" onclick="reservationSystem.deleteAppointmentType(${type.id})">削除</button>
                    </div>
                </div>
                <div class="appointment-type-details">
                    <div class="detail-item">
                        <span class="detail-label">時間間隔</span>
                        <span class="detail-value">${type.duration}分</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">最大枠数</span>
                        <span class="detail-value">${type.capacity}名</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">営業時間</span>
                        <span class="detail-value">${type.startTime} - ${type.endTime}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    showAppointmentTypeModal(id = null) {
        const modal = document.getElementById('appointmentTypeModal');
        const title = document.getElementById('appointmentTypeModalTitle');
        if (!modal || !title) return;
        
        if (id) {
            const data = this.getData();
            const type = data.appointmentTypes.find(t => t.id === id);
            if (!type) return;
            
            title.textContent = '予約種類の編集';
            document.getElementById('appointmentTypeId').value = type.id;
            document.getElementById('appointmentTypeName').value = type.name;
            document.getElementById('appointmentTypeDuration').value = type.duration;
            document.getElementById('appointmentTypeCapacity').value = type.capacity;
            document.getElementById('appointmentTypeStartTime').value = type.startTime;
            document.getElementById('appointmentTypeEndTime').value = type.endTime;
            document.getElementById('appointmentTypeAvailableFrom').value = type.availableFrom;
            document.getElementById('appointmentTypeAvailableTo').value = type.availableTo;
        } else {
            title.textContent = '予約種類の追加';
            const form = document.getElementById('appointmentTypeForm');
            if (form) form.reset();
            document.getElementById('appointmentTypeId').value = '';
        }
        
        modal.classList.remove('hidden');
    }

    hideAppointmentTypeModal() {
        const modal = document.getElementById('appointmentTypeModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    handleAppointmentTypeSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('appointmentTypeName').value,
            duration: parseInt(document.getElementById('appointmentTypeDuration').value),
            capacity: parseInt(document.getElementById('appointmentTypeCapacity').value),
            startTime: document.getElementById('appointmentTypeStartTime').value,
            endTime: document.getElementById('appointmentTypeEndTime').value,
            availableFrom: document.getElementById('appointmentTypeAvailableFrom').value,
            availableTo: document.getElementById('appointmentTypeAvailableTo').value,
            closedDays: ['日曜日'],
            closedDates: [],
            weeklyHours: this.getDefaultWeeklyHours(
                document.getElementById('appointmentTypeStartTime').value,
                document.getElementById('appointmentTypeEndTime').value
            )
        };
        
        const data = this.getData();
        const id = document.getElementById('appointmentTypeId').value;
        
        if (id) {
            // Edit existing
            const index = data.appointmentTypes.findIndex(t => t.id == id);
            if (index !== -1) {
                data.appointmentTypes[index] = { ...data.appointmentTypes[index], ...formData };
            }
        } else {
            // Add new
            formData.id = Date.now();
            data.appointmentTypes.push(formData);
        }
        
        this.saveData(data);
        this.hideAppointmentTypeModal();
        this.loadAppointmentTypesList();
        this.loadAppointmentTypes(); // Refresh patient form dropdown
        alert(id ? '予約種類を更新しました。' : '予約種類を追加しました。');
    }

    editAppointmentType(id) {
        this.showAppointmentTypeModal(id);
    }

    deleteAppointmentType(id) {
        if (!confirm('この予約種類を削除しますか？関連する予約も削除されます。')) return;
        
        const data = this.getData();
        data.appointmentTypes = data.appointmentTypes.filter(t => t.id !== id);
        data.reservations = data.reservations.filter(r => r.appointmentTypeId !== id);
        
        this.saveData(data);
        this.loadAppointmentTypesList();
        this.loadAppointmentTypes();
        alert('予約種類を削除しました。');
    }

    getDefaultWeeklyHours(startTime, endTime) {
        return {
            '月曜日': {start: startTime, end: endTime},
            '火曜日': {start: startTime, end: endTime},
            '水曜日': {start: startTime, end: endTime},
            '木曜日': {start: startTime, end: endTime},
            '金曜日': {start: startTime, end: endTime},
            '土曜日': {start: startTime, end: endTime},
            '日曜日': {start: '', end: ''}
        };
    }

    // Settings management
    loadSettings() {
        const data = this.getData();
        const patientMessageInput = document.getElementById('patientMessageInput');
        const emailTemplateInput = document.getElementById('emailTemplateInput');
        const emailjsServiceId = document.getElementById('emailjsServiceId');
        const emailjsTemplateId = document.getElementById('emailjsTemplateId');
        const emailjsPublicKey = document.getElementById('emailjsPublicKey');
        
        if (patientMessageInput) patientMessageInput.value = data.settings.patientMessage;
        if (emailTemplateInput) emailTemplateInput.value = data.settings.emailTemplate;
        if (emailjsServiceId) emailjsServiceId.value = data.settings.emailjsServiceId;
        if (emailjsTemplateId) emailjsTemplateId.value = data.settings.emailjsTemplateId;
        if (emailjsPublicKey) emailjsPublicKey.value = data.settings.emailjsPublicKey;
    }

    handlePasswordChange(e) {
        e.preventDefault();
        const newPasswordInput = document.getElementById('newPassword');
        if (!newPasswordInput) return;
        
        const newPassword = newPasswordInput.value;
        
        if (!newPassword) {
            alert('新しいパスワードを入力してください。');
            return;
        }
        
        const data = this.getData();
        data.settings.adminPassword = newPassword;
        this.saveData(data);
        
        alert('パスワードを変更しました。');
        newPasswordInput.value = '';
    }

    updatePatientMessage() {
        const messageInput = document.getElementById('patientMessageInput');
        if (!messageInput) return;
        
        const message = messageInput.value;
        const data = this.getData();
        data.settings.patientMessage = message;
        this.saveData(data);
        
        const messageElement = document.getElementById('patientMessage');
        if (messageElement) {
            messageElement.textContent = message;
        }
        alert('患者へのメッセージを更新しました。');
    }

    updateEmailTemplate() {
        const templateInput = document.getElementById('emailTemplateInput');
        if (!templateInput) return;
        
        const template = templateInput.value;
        const data = this.getData();
        data.settings.emailTemplate = template;
        this.saveData(data);
        
        alert('メールテンプレートを更新しました。');
    }

    saveEmailjsSettings() {
        const data = this.getData();
        const serviceIdInput = document.getElementById('emailjsServiceId');
        const templateIdInput = document.getElementById('emailjsTemplateId');
        const publicKeyInput = document.getElementById('emailjsPublicKey');
        
        if (serviceIdInput) data.settings.emailjsServiceId = serviceIdInput.value;
        if (templateIdInput) data.settings.emailjsTemplateId = templateIdInput.value;
        if (publicKeyInput) data.settings.emailjsPublicKey = publicKeyInput.value;
        
        this.saveData(data);
        alert('EmailJS設定を保存しました。');
    }

    async testEmailjs() {
        const data = this.getData();
        const settings = data.settings;
        
        if (!settings.emailjsServiceId || !settings.emailjsTemplateId || !settings.emailjsPublicKey) {
            alert('EmailJS設定が不完全です。');
            return;
        }
        
        try {
            if (typeof emailjs !== 'undefined') {
                await emailjs.send(
                    settings.emailjsServiceId,
                    settings.emailjsTemplateId,
                    {
                        to_email: 'test@example.com',
                        to_name: 'テストユーザー',
                        message: 'これはテストメールです。',
                        subject: 'EmailJS接続テスト'
                    },
                    settings.emailjsPublicKey
                );
                alert('EmailJS接続テスト成功！');
            } else {
                alert('EmailJSライブラリが読み込まれていません。');
            }
        } catch (error) {
            alert('EmailJS接続テスト失敗: ' + error.message);
        }
    }

    // Reports and other methods
    loadReportData() {
        const data = this.getData();
        const select = document.getElementById('printAppointmentType');
        if (!select) return;
        
        select.innerHTML = '<option value="">全ての種類</option>';
        
        data.appointmentTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            select.appendChild(option);
        });
    }

    generateReport() {
        const typeIdInput = document.getElementById('printAppointmentType');
        const startDateInput = document.getElementById('printStartDate');
        const endDateInput = document.getElementById('printEndDate');
        
        if (!typeIdInput) return;
        
        const typeId = typeIdInput.value;
        const startDate = startDateInput ? startDateInput.value : '';
        const endDate = endDateInput ? endDateInput.value : '';
        
        const data = this.getData();
        let filteredReservations = data.reservations;
        
        if (typeId) {
            filteredReservations = filteredReservations.filter(r => r.appointmentTypeId == typeId);
        }
        
        if (startDate) {
            filteredReservations = filteredReservations.filter(r => r.date >= startDate);
        }
        
        if (endDate) {
            filteredReservations = filteredReservations.filter(r => r.date <= endDate);
        }
        
        // Sort by date and time
        filteredReservations.sort((a, b) => 
            new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time)
        );
        
        const container = document.getElementById('reportContent');
        if (!container) return;
        
        const now = new Date().toLocaleString('ja-JP');
        
        let html = `
            <div class="report-header">
                <h3>予約レポート</h3>
                <p>作成日時: ${now}</p>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>日付</th>
                        <th>時間</th>
                        <th>種類</th>
                        <th>名前</th>
                        <th>電話</th>
                        <th>備考</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        filteredReservations.forEach(reservation => {
            const type = data.appointmentTypes.find(t => t.id === reservation.appointmentTypeId);
            html += `
                <tr>
                    <td>${reservation.date}</td>
                    <td>${reservation.time}</td>
                    <td>${type ? type.name : '不明'}</td>
                    <td>${reservation.name}</td>
                    <td>${reservation.phone}</td>
                    <td>${reservation.remarks || '-'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    printReport() {
        const reportContent = document.getElementById('reportContent');
        if (!reportContent || !reportContent.innerHTML) {
            alert('まずレポートを生成してください。');
            return;
        }
        
        window.print();
    }

    // Backup and restore
    exportData() {
        const data = this.getData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `hospital-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    importData() {
        const fileInput = document.getElementById('importFile');
        if (!fileInput) return;
        
        const file = fileInput.files[0];
        
        if (!file) {
            alert('ファイルを選択してください。');
            return;
        }
        
        if (!confirm('現在のデータは上書きされます。続行しますか？')) {
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                localStorage.setItem('hospitalData', JSON.stringify(importedData));
                alert('データをインポートしました。ページを再読み込みします。');
                location.reload();
            } catch (error) {
                alert('ファイルの形式が正しくありません。');
            }
        };
        reader.readAsText(file);
    }

    autoBackup() {
        this.exportData();
    }

    // Utility methods
    getDayOfWeek(dateString) {
        const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
        const date = new Date(dateString);
        return days[date.getDay()];
    }

    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0');
    }
}

// Initialize the system when the page loads
let reservationSystem;
document.addEventListener('DOMContentLoaded', () => {
    reservationSystem = new HospitalReservationSystem();
});

// Initialize EmailJS if available
if (typeof emailjs !== 'undefined') {
    emailjs.init('YOUR_PUBLIC_KEY'); // This will be set through admin settings
}
