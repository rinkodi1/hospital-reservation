// 病院予約システム JavaScript
class HospitalReservationSystem {
    constructor() {
        this.currentStep = 1;
        this.selectedType = null;
        this.selectedDate = null;
        this.selectedTime = null;
        this.currentReservation = null;
        this.editingReservationId = null;
        this.editingTypeId = null;
        this.currentCalendarDate = new Date();
        
        this.init();
    }

    init() {
        this.initializeDefaultData();
        this.bindEvents();
        this.loadReservationTypes();
        this.updateNoticeMessage();
        this.setMinDate();
    }

    // デフォルトデータの初期化
    initializeDefaultData() {
        const defaultTypes = [
            {
                id: 'health-check',
                name: '健康診断',
                duration: 15,
                capacity: 10,
                availablePeriod: {
                    start: '2025-01-01',
                    end: '2025-12-31'
                },
                schedule: {
                    monday: { enabled: true, start: '09:00', end: '17:00' },
                    tuesday: { enabled: true, start: '09:00', end: '17:00' },
                    wednesday: { enabled: true, start: '09:00', end: '17:00' },
                    thursday: { enabled: true, start: '09:00', end: '17:00' },
                    friday: { enabled: true, start: '09:00', end: '17:00' },
                    saturday: { enabled: false, start: '09:00', end: '12:00' },
                    sunday: { enabled: false, start: '09:00', end: '12:00' }
                },
                holidayDates: ['2025-01-01', '2025-05-03', '2025-12-29', '2025-12-30', '2025-12-31']
            },
            {
                id: 'vaccination',
                name: '予防接種',
                duration: 15,
                capacity: 8,
                availablePeriod: {
                    start: '2025-01-01',
                    end: '2025-12-31'
                },
                schedule: {
                    monday: { enabled: true, start: '09:00', end: '16:00' },
                    tuesday: { enabled: true, start: '09:00', end: '16:00' },
                    wednesday: { enabled: true, start: '09:00', end: '16:00' },
                    thursday: { enabled: true, start: '09:00', end: '16:00' },
                    friday: { enabled: true, start: '09:00', end: '16:00' },
                    saturday: { enabled: false, start: '09:00', end: '12:00' },
                    sunday: { enabled: false, start: '09:00', end: '12:00' }
                },
                holidayDates: ['2025-01-01', '2025-05-03', '2025-12-29', '2025-12-30', '2025-12-31']
            }
        ];

        if (!this.getStorageItem('reservationTypes')) {
            this.setStorageItem('reservationTypes', defaultTypes);
        }

        if (!this.getStorageItem('reservations')) {
            this.setStorageItem('reservations', []);
        }

        if (!this.getStorageItem('adminPassword')) {
            this.setStorageItem('adminPassword', 'admin123');
        }

        if (!this.getStorageItem('noticeMessage')) {
            this.setStorageItem('noticeMessage', 'ご予約をお取りいただき、ありがとうございます。診察の際は保険証をお持ちください。');
        }

        if (!this.getStorageItem('emailSettings')) {
            this.setStorageItem('emailSettings', {
                brevoApiKey: '',
                senderEmail: '',
                senderName: '病院',
                subject: '予約確認のお知らせ',
                template: `{customerName} 様

この度は、当院にてご予約をいただき、誠にありがとうございます。
以下の内容でご予約を承りました。

【予約内容】
予約種類: {reservationType}
予約日時: {reservationDateTime}
備考: {notes}

ご不明な点がございましたら、お気軽にお電話にてお問い合わせください。

当日は保険証をお持ちください。
お待ちしております。

病院名
電話番号: XXX-XXXX-XXXX`
            });
        }
    }

    // ローカルストレージ操作
    getStorageItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error getting ${key} from storage:`, error);
            return null;
        }
    }

    setStorageItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting ${key} to storage:`, error);
        }
    }

    // イベントバインディング
    bindEvents() {
        // DOMContentLoadedイベントの確認
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.bindEventHandlers();
            });
        } else {
            this.bindEventHandlers();
        }
    }

    bindEventHandlers() {
        // 管理者ログイン
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal('adminLoginModal');
            });
        }

        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin();
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // ステップナビゲーション
        const backToStep1 = document.getElementById('backToStep1');
        if (backToStep1) {
            backToStep1.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToStep(1);
            });
        }

        const proceedToStep3 = document.getElementById('proceedToStep3');
        if (proceedToStep3) {
            proceedToStep3.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.validateDateSelection()) {
                    this.loadTimeSlots();
                    this.goToStep(3);
                }
            });
        }

        const backToStep2 = document.getElementById('backToStep2');
        if (backToStep2) {
            backToStep2.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToStep(2);
            });
        }

        const backToStep3 = document.getElementById('backToStep3');
        if (backToStep3) {
            backToStep3.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToStep(3);
            });
        }

        // 顧客フォーム
        const customerForm = document.getElementById('customerForm');
        if (customerForm) {
            customerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleReservationSubmit();
            });
        }

        const newReservation = document.getElementById('newReservation');
        if (newReservation) {
            newReservation.addEventListener('click', () => {
                this.resetForm();
            });
        }

        // 管理者タブ
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(e.target.dataset.tab);
            });
        });

        // モーダル閉じる
        document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-overlay')) {
                    const modal = e.target.closest('.modal');
                    if (modal) {
                        this.hideModal(modal.id);
                    }
                }
            });
        });

        // 管理者フォーム
        this.bindAdminEvents();
    }

    bindAdminEvents() {
        // パスワード変更
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordChange();
            });
        }

        // お知らせメッセージ更新
        const noticeForm = document.getElementById('noticeForm');
        if (noticeForm) {
            noticeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNoticeUpdate();
            });
        }

        // 予約種類追加
        const addTypeBtn = document.getElementById('addTypeBtn');
        if (addTypeBtn) {
            addTypeBtn.addEventListener('click', () => {
                this.showAddTypeModal();
            });
        }

        // 予約種類編集フォーム
        const editTypeForm = document.getElementById('editTypeForm');
        if (editTypeForm) {
            editTypeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTypeSave();
            });
        }

        // メール設定
        const brevoForm = document.getElementById('brevoForm');
        if (brevoForm) {
            brevoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEmailSettingsSave();
            });
        }

        const emailTemplateForm = document.getElementById('emailTemplateForm');
        if (emailTemplateForm) {
            emailTemplateForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEmailTemplateSave();
            });
        }

        const testConnection = document.getElementById('testConnection');
        if (testConnection) {
            testConnection.addEventListener('click', () => {
                this.testBrevoConnection();
            });
        }

        const sendTestEmail = document.getElementById('sendTestEmail');
        if (sendTestEmail) {
            sendTestEmail.addEventListener('click', () => {
                this.sendTestEmail();
            });
        }

        // データ管理
        const exportData = document.getElementById('exportData');
        if (exportData) {
            exportData.addEventListener('click', () => {
                this.exportData();
            });
        }

        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const importData = document.getElementById('importData');
                if (importData) {
                    importData.click();
                }
            });
        }

        const importData = document.getElementById('importData');
        if (importData) {
            importData.addEventListener('change', (e) => {
                this.importData(e);
            });
        }

        const printReservations = document.getElementById('printReservations');
        if (printReservations) {
            printReservations.addEventListener('click', () => {
                this.printReservations();
            });
        }

        // 予約編集
        const editReservationForm = document.getElementById('editReservationForm');
        if (editReservationForm) {
            editReservationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleReservationEdit();
            });
        }

        const deleteReservation = document.getElementById('deleteReservation');
        if (deleteReservation) {
            deleteReservation.addEventListener('click', () => {
                this.handleReservationDelete();
            });
        }

        // フィルター
        const filterType = document.getElementById('filterType');
        if (filterType) {
            filterType.addEventListener('change', () => {
                this.loadReservationsList();
            });
        }

        const filterDate = document.getElementById('filterDate');
        if (filterDate) {
            filterDate.addEventListener('change', () => {
                this.loadReservationsList();
            });
        }
    }

    // 日付の最小値設定
    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('reservationDate');
        if (dateInput) {
            dateInput.min = today;
            dateInput.value = '';
        }
    }

    // ステップ移動
    goToStep(step) {
        // 全ステップを非表示
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        
        // 指定されたステップを表示
        const targetStep = document.getElementById(`step${step}`);
        if (targetStep) {
            targetStep.classList.add('active');
            this.currentStep = step;

            // ステップごとの情報表示
            if (step === 2 && this.selectedType) {
                const selectedTypeName = document.getElementById('selectedTypeName');
                if (selectedTypeName) {
                    selectedTypeName.textContent = this.selectedType.name;
                }
            } else if (step === 3 && this.selectedType && this.selectedDate) {
                const selectedTypeStep3 = document.getElementById('selectedTypeStep3');
                const selectedDateStep3 = document.getElementById('selectedDateStep3');
                if (selectedTypeStep3) selectedTypeStep3.textContent = this.selectedType.name;
                if (selectedDateStep3) selectedDateStep3.textContent = this.formatDate(this.selectedDate);
            } else if (step === 4 && this.selectedType && this.selectedDate && this.selectedTime) {
                const selectedTypeStep4 = document.getElementById('selectedTypeStep4');
                const selectedDateTimeStep4 = document.getElementById('selectedDateTimeStep4');
                if (selectedTypeStep4) selectedTypeStep4.textContent = this.selectedType.name;
                if (selectedDateTimeStep4) {
                    selectedDateTimeStep4.textContent = `${this.formatDate(this.selectedDate)} ${this.selectedTime}`;
                }
            }
        }
    }

    // 予約種類読み込み
    loadReservationTypes() {
        const types = this.getStorageItem('reservationTypes') || [];
        const container = document.getElementById('reservationTypes');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        types.forEach(type => {
            const card = document.createElement('div');
            card.className = 'reservation-type-card';
            card.dataset.typeId = type.id;
            
            card.innerHTML = `
                <h3>${type.name}</h3>
                <p>所要時間: ${type.duration}分</p>
                <p>定員: ${type.capacity}名</p>
            `;
            
            card.addEventListener('click', () => {
                document.querySelectorAll('.reservation-type-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedType = type;
                setTimeout(() => {
                    this.goToStep(2);
                }, 200);
            });
            
            container.appendChild(card);
        });
    }

    // 日付選択の検証
    validateDateSelection() {
        const dateInput = document.getElementById('reservationDate');
        if (!dateInput) return false;
        
        const selectedDate = dateInput.value;
        
        if (!selectedDate) {
            this.showMessage('予約日を選択してください。', 'error');
            return false;
        }

        const date = new Date(selectedDate);
        const dayName = this.getDayName(date.getDay());
        
        // 営業日チェック
        if (!this.selectedType.schedule[dayName].enabled) {
            this.showMessage('選択した日は休業日です。', 'error');
            return false;
        }

        // 休日チェック
        if (this.selectedType.holidayDates.includes(selectedDate)) {
            this.showMessage('選択した日は休日です。', 'error');
            return false;
        }

        // 予約可能期間チェック
        if (selectedDate < this.selectedType.availablePeriod.start || 
            selectedDate > this.selectedType.availablePeriod.end) {
            this.showMessage('選択した日は予約可能期間外です。', 'error');
            return false;
        }

        this.selectedDate = selectedDate;
        return true;
    }

    // 時間枠読み込み
    loadTimeSlots() {
        const container = document.getElementById('timeSlots');
        if (!container) return;
        
        const date = new Date(this.selectedDate);
        const dayName = this.getDayName(date.getDay());
        const schedule = this.selectedType.schedule[dayName];
        
        container.innerHTML = '';
        
        const slots = this.generateTimeSlots(schedule.start, schedule.end, this.selectedType.duration);
        const reservations = this.getStorageItem('reservations') || [];
        
        slots.forEach(slot => {
            const reservedCount = reservations.filter(r => 
                r.type === this.selectedType.id && 
                r.date === this.selectedDate && 
                r.time === slot
            ).length;
            
            const available = this.selectedType.capacity - reservedCount;
            const isFull = available <= 0;
            
            const slotElement = document.createElement('div');
            slotElement.className = `time-slot ${isFull ? 'full' : ''}`;
            
            slotElement.innerHTML = `
                <div class="time-slot-time">${slot}</div>
                <div class="time-slot-availability ${isFull ? 'full' : 'available'}">
                    ${isFull ? '満員' : `空き ${available}/${this.selectedType.capacity}`}
                </div>
            `;
            
            if (!isFull) {
                slotElement.addEventListener('click', () => {
                    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                    slotElement.classList.add('selected');
                    this.selectedTime = slot;
                    setTimeout(() => {
                        this.goToStep(4);
                    }, 200);
                });
            }
            
            container.appendChild(slotElement);
        });
    }

    // 時間枠生成
    generateTimeSlots(startTime, endTime, duration) {
        const slots = [];
        const start = new Date(`2000-01-01 ${startTime}`);
        const end = new Date(`2000-01-01 ${endTime}`);
        
        let current = new Date(start);
        
        while (current < end) {
            slots.push(current.toTimeString().slice(0, 5));
            current.setMinutes(current.getMinutes() + duration);
        }
        
        return slots;
    }

    // 予約送信処理
    async handleReservationSubmit() {
        const nameEl = document.getElementById('customerName');
        const emailEl = document.getElementById('customerEmail');
        const phoneEl = document.getElementById('customerPhone');
        const notesEl = document.getElementById('customerNotes');

        if (!nameEl || !emailEl || !phoneEl) {
            this.showMessage('フォームの読み込みエラーが発生しました。', 'error');
            return;
        }

        const name = nameEl.value.trim();
        const email = emailEl.value.trim();
        const phone = phoneEl.value.trim();
        const notes = notesEl ? notesEl.value.trim() : '';

        if (!name || !email || !phone) {
            this.showMessage('必須項目を入力してください。', 'error');
            return;
        }

        // 重複予約チェック
        const existingReservations = this.getStorageItem('reservations') || [];
        const duplicateReservation = existingReservations.find(r => r.email === email);
        
        if (duplicateReservation) {
            this.showMessage('このメールアドレスで既に予約があります。', 'error');
            return;
        }

        const reservation = {
            id: this.generateId(),
            type: this.selectedType.id,
            typeName: this.selectedType.name,
            date: this.selectedDate,
            time: this.selectedTime,
            name: name,
            email: email,
            phone: phone,
            notes: notes,
            createdAt: new Date().toISOString()
        };

        // 予約保存
        existingReservations.push(reservation);
        this.setStorageItem('reservations', existingReservations);

        // メール送信
        await this.sendConfirmationEmail(reservation);

        // 完了画面表示
        this.showReservationSummary(reservation);
        this.goToStep(5);
    }

    // 確認メール送信
    async sendConfirmationEmail(reservation) {
        const emailSettings = this.getStorageItem('emailSettings');
        
        if (!emailSettings.brevoApiKey || !emailSettings.senderEmail) {
            console.log('Email settings not configured');
            return;
        }

        try {
            const template = emailSettings.template
                .replace('{customerName}', reservation.name)
                .replace('{reservationType}', reservation.typeName)
                .replace('{reservationDateTime}', `${this.formatDate(reservation.date)} ${reservation.time}`)
                .replace('{notes}', reservation.notes || 'なし');

            const emailData = {
                sender: {
                    name: emailSettings.senderName,
                    email: emailSettings.senderEmail
                },
                to: [{
                    email: reservation.email,
                    name: reservation.name
                }],
                subject: emailSettings.subject,
                textContent: template
            };

            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': emailSettings.brevoApiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });

            if (response.ok) {
                console.log('Confirmation email sent successfully');
            } else {
                console.error('Failed to send confirmation email');
            }
        } catch (error) {
            console.error('Error sending confirmation email:', error);
        }
    }

    // 予約サマリー表示
    showReservationSummary(reservation) {
        const container = document.getElementById('reservationSummary');
        if (!container) return;
        
        container.innerHTML = `
            <div class="summary-item">
                <span>予約種類:</span>
                <span>${reservation.typeName}</span>
            </div>
            <div class="summary-item">
                <span>予約日時:</span>
                <span>${this.formatDate(reservation.date)} ${reservation.time}</span>
            </div>
            <div class="summary-item">
                <span>お名前:</span>
                <span>${reservation.name}</span>
            </div>
            <div class="summary-item">
                <span>メールアドレス:</span>
                <span>${reservation.email}</span>
            </div>
            <div class="summary-item">
                <span>電話番号:</span>
                <span>${reservation.phone}</span>
            </div>
            ${reservation.notes ? `
            <div class="summary-item">
                <span>備考:</span>
                <span>${reservation.notes}</span>
            </div>
            ` : ''}
        `;
    }

    // フォームリセット
    resetForm() {
        this.currentStep = 1;
        this.selectedType = null;
        this.selectedDate = null;
        this.selectedTime = null;
        
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        const step1 = document.getElementById('step1');
        if (step1) {
            step1.classList.add('active');
        }
        
        const customerForm = document.getElementById('customerForm');
        if (customerForm) {
            customerForm.reset();
        }
        
        document.querySelectorAll('.reservation-type-card').forEach(c => c.classList.remove('selected'));
        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        
        // 日付入力をリセット
        const dateInput = document.getElementById('reservationDate');
        if (dateInput) {
            dateInput.value = '';
        }
    }

    // 管理者ログイン
    handleAdminLogin() {
        const passwordEl = document.getElementById('adminPassword');
        if (!passwordEl) return;
        
        const password = passwordEl.value;
        const storedPassword = this.getStorageItem('adminPassword');
        
        if (password === storedPassword) {
            this.hideModal('adminLoginModal');
            this.showAdminPanel();
            passwordEl.value = '';
        } else {
            this.showMessage('パスワードが正しくありません。', 'error');
        }
    }

    // 管理者画面表示
    showAdminPanel() {
        const mainContent = document.querySelector('.main-content');
        const noticeSection = document.querySelector('.notice-section');
        const header = document.querySelector('.header');
        const adminPanel = document.getElementById('adminPanel');
        
        if (mainContent) mainContent.style.display = 'none';
        if (noticeSection) noticeSection.style.display = 'none';
        if (header) header.style.display = 'none';
        if (adminPanel) adminPanel.classList.add('active');
        
        this.loadAdminData();
    }

    // ログアウト
    handleLogout() {
        const mainContent = document.querySelector('.main-content');
        const noticeSection = document.querySelector('.notice-section');
        const header = document.querySelector('.header');
        const adminPanel = document.getElementById('adminPanel');
        
        if (mainContent) mainContent.style.display = 'block';
        if (noticeSection) noticeSection.style.display = 'block';
        if (header) header.style.display = 'block';
        if (adminPanel) adminPanel.classList.remove('active');
        
        this.switchTab('dashboard');
    }

    // モーダル操作
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // メッセージ表示
    showMessage(message, type = 'info') {
        // 既存のメッセージを削除
        document.querySelectorAll('.message').forEach(msg => msg.remove());

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;

        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(messageElement, container.firstChild);

            // 3秒後に自動削除
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 3000);
        }
    }

    // お知らせメッセージ更新
    updateNoticeMessage() {
        const message = this.getStorageItem('noticeMessage');
        const noticeEl = document.getElementById('noticeMessage');
        if (noticeEl && message) {
            noticeEl.innerHTML = `<p>${message}</p>`;
        }
    }

    // ユーティリティ関数
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }

    getDayName(dayIndex) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[dayIndex];
    }

    getDayNameJP(dayName) {
        const dayNames = {
            sunday: '日',
            monday: '月',
            tuesday: '火',
            wednesday: '水',
            thursday: '木',
            friday: '金',
            saturday: '土'
        };
        return dayNames[dayName];
    }

    generateId() {
        return 'res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getWeekRange(date) {
        const start = new Date(date);
        start.setDate(date.getDate() - date.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    }

    getMonthRange(date) {
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    }

    // 管理者機能（簡略版）
    loadAdminData() {
        this.loadDashboard();
        this.loadReservationsList();
        this.loadReservationTypesList();
        this.loadEmailSettings();
        this.loadSystemSettings();
    }

    loadDashboard() {
        const reservations = this.getStorageItem('reservations') || [];
        const today = new Date().toISOString().split('T')[0];
        
        const todayCount = reservations.filter(r => r.date === today).length;
        
        const todayEl = document.getElementById('todayReservations');
        const weekEl = document.getElementById('weekReservations');
        const monthEl = document.getElementById('monthReservations');
        
        if (todayEl) todayEl.textContent = todayCount;
        if (weekEl) weekEl.textContent = '0';
        if (monthEl) monthEl.textContent = reservations.length;

        this.loadCalendar();
    }

    loadCalendar() {
        const container = document.getElementById('adminCalendar');
        if (!container) return;
        
        container.innerHTML = `
            <div class="calendar-header">
                <div class="calendar-nav">
                    <button class="btn btn--outline" onclick="window.reservationSystem.changeCalendarMonth(-1)">&lt;</button>
                    <span>${this.currentCalendarDate.getFullYear()}年${this.currentCalendarDate.getMonth() + 1}月</span>
                    <button class="btn btn--outline" onclick="window.reservationSystem.changeCalendarMonth(1)">&gt;</button>
                </div>
            </div>
            <div class="calendar-grid">
                <div class="calendar-day-header">日</div>
                <div class="calendar-day-header">月</div>
                <div class="calendar-day-header">火</div>
                <div class="calendar-day-header">水</div>
                <div class="calendar-day-header">木</div>
                <div class="calendar-day-header">金</div>
                <div class="calendar-day-header">土</div>
            </div>
        `;
    }

    changeCalendarMonth(direction) {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + direction);
        this.loadCalendar();
    }

    loadReservationsList() {
        const container = document.getElementById('reservationsList');
        if (!container) return;
        
        container.innerHTML = '<div class="empty-state"><h3>予約管理画面</h3><p>予約データが表示されます</p></div>';
    }

    loadReservationTypesList() {
        const container = document.getElementById('reservationTypesList');
        if (!container) return;
        
        container.innerHTML = '<div class="empty-state"><h3>予約種類管理画面</h3><p>予約種類データが表示されます</p></div>';
    }

    loadEmailSettings() {
        // メール設定の読み込み（簡略版）
    }

    loadSystemSettings() {
        const noticeMessage = this.getStorageItem('noticeMessage');
        const noticeTextArea = document.getElementById('noticeTextArea');
        if (noticeTextArea && noticeMessage) {
            noticeTextArea.value = noticeMessage;
        }
    }

    switchTab(tabName) {
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
        const targetContent = document.getElementById(`${tabName}Tab`);
        
        if (targetTab) targetTab.classList.add('active');
        if (targetContent) targetContent.classList.add('active');
    }

    handleNoticeUpdate() {
        const noticeTextArea = document.getElementById('noticeTextArea');
        if (!noticeTextArea) return;
        
        const message = noticeTextArea.value;
        this.setStorageItem('noticeMessage', message);
        this.updateNoticeMessage();
        this.showMessage('お知らせメッセージを更新しました。', 'success');
    }

    handlePasswordChange() {
        this.showMessage('パスワード変更機能は実装中です。', 'info');
    }

    showAddTypeModal() {
        this.showMessage('予約種類追加機能は実装中です。', 'info');
    }

    handleEmailSettingsSave() {
        this.showMessage('メール設定保存機能は実装中です。', 'info');
    }

    handleEmailTemplateSave() {
        this.showMessage('メールテンプレート保存機能は実装中です。', 'info');
    }

    testBrevoConnection() {
        this.showMessage('Brevo接続テスト機能は実装中です。', 'info');
    }

    sendTestEmail() {
        this.showMessage('テストメール送信機能は実装中です。', 'info');
    }

    exportData() {
        this.showMessage('データエクスポート機能は実装中です。', 'info');
    }

    importData(event) {
        this.showMessage('データインポート機能は実装中です。', 'info');
    }

    printReservations() {
        window.print();
    }

    editReservation(reservationId) {
        this.showMessage('予約編集機能は実装中です。', 'info');
    }

    handleReservationEdit() {
        this.showMessage('予約編集機能は実装中です。', 'info');
    }

    handleReservationDelete() {
        this.showMessage('予約削除機能は実装中です。', 'info');
    }

    editType(typeId) {
        this.showMessage('予約種類編集機能は実装中です。', 'info');
    }

    deleteType(typeId) {
        this.showMessage('予約種類削除機能は実装中です。', 'info');
    }

    handleTypeSave() {
        this.showMessage('予約種類保存機能は実装中です。', 'info');
    }
}

// システム初期化
document.addEventListener('DOMContentLoaded', () => {
    window.reservationSystem = new HospitalReservationSystem();
});

// グローバル関数（HTMLから呼び出すため）
function changeCalendarMonth(direction) {
    if (window.reservationSystem) {
        window.reservationSystem.changeCalendarMonth(direction);
    }
}
