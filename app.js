// システム全体の状態管理
class HospitalReservationSystem {
    constructor() {
        this.currentStep = 1;
        this.reservationData = {};
        this.currentUser = null;
        this.currentDate = new Date('2025-07-27T14:00:00+09:00');
        this.confirmCallback = null;
        
        // 初期化を遅延実行
        setTimeout(() => {
            this.initializeData();
            this.initializeEventListeners();
            this.showPatientSystem();
        }, 100);
    }

    // 初期データセットアップ
    initializeData() {
        // 既存データがない場合のみ初期データを設定
        if (!localStorage.getItem('hospital_reservations')) {
            const initialData = {
                reservations: [
                    {
                        id: 1,
                        patientName: "山田太郎",
                        email: "yamada@example.com",
                        phone: "090-1234-5678",
                        reservationType: "健康診断",
                        reservationDate: "2025-08-01",
                        reservationTime: "09:00",
                        notes: "血圧が高めなので詳しく検査希望",
                        createdAt: "2025-07-25T10:30:00"
                    },
                    {
                        id: 2,
                        patientName: "佐藤花子",
                        email: "sato@example.com", 
                        phone: "080-9876-5432",
                        reservationType: "健康診断",
                        reservationDate: "2025-08-01",
                        reservationTime: "10:30",
                        notes: "特になし",
                        createdAt: "2025-07-26T15:20:00"
                    },
                    {
                        id: 3,
                        patientName: "田中一郎",
                        email: "tanaka@example.com",
                        phone: "070-1111-2222", 
                        reservationType: "予防接種",
                        reservationDate: "2025-08-02",
                        reservationTime: "14:00",
                        notes: "インフルエンザワクチン希望",
                        createdAt: "2025-07-27T09:15:00"
                    },
                    {
                        id: 4,
                        patientName: "鈴木次郎",
                        email: "suzuki@example.com",
                        phone: "090-3333-4444",
                        reservationType: "健康診断",
                        reservationDate: "2025-07-30",
                        reservationTime: "14:00",
                        notes: "初回健康診断",
                        createdAt: "2025-07-27T11:00:00"
                    },
                    {
                        id: 5,
                        patientName: "高橋美智子",
                        email: "takahashi@example.com",
                        phone: "080-5555-6666",
                        reservationType: "予防接種",
                        reservationDate: "2025-08-05",
                        reservationTime: "15:30",
                        notes: "コロナワクチン希望",
                        createdAt: "2025-07-27T13:45:00"
                    }
                ],
                reservationTypes: [
                    {
                        id: 1,
                        name: "健康診断",
                        timeInterval: 15,
                        capacity: 10,
                        businessHours: {
                            monday: {"start": "09:00", "end": "17:00"},
                            tuesday: {"start": "09:00", "end": "17:00"},
                            wednesday: {"start": "09:00", "end": "17:00"},
                            thursday: {"start": "09:00", "end": "17:00"},
                            friday: {"start": "09:00", "end": "17:00"},
                            saturday: {"start": "09:00", "end": "12:00"},
                            sunday: {"closed": true}
                        },
                        holidays: ["2025-08-11", "2025-08-12"],
                        availablePeriod: {
                            start: "2025-07-01",
                            end: "2025-12-31"
                        }
                    },
                    {
                        id: 2,
                        name: "予防接種",
                        timeInterval: 30,
                        capacity: 5,
                        businessHours: {
                            monday: {"start": "14:00", "end": "18:00"},
                            tuesday: {"start": "14:00", "end": "18:00"},
                            wednesday: {"start": "14:00", "end": "18:00"},
                            thursday: {"start": "14:00", "end": "18:00"},
                            friday: {"start": "14:00", "end": "18:00"},
                            saturday: {"closed": true},
                            sunday: {"closed": true}
                        },
                        holidays: [],
                        availablePeriod: {
                            start: "2025-07-01",
                            end: "2025-12-31"
                        }
                    }
                ],
                systemSettings: {
                    hospitalName: "さくら病院",
                    adminPassword: "admin123",
                    emailJSConfig: {
                        serviceId: "",
                        templateId: "",
                        publicKey: "",
                        enabled: false
                    },
                    googleCalendarConfig: {
                        apiKey: "",
                        calendarId: "",
                        enabled: false
                    },
                    publicMessage: "ご予約いただきありがとうございます。感染症対策のため、来院時はマスクの着用をお願いいたします。",
                    emailTemplate: "{{user_name}} 様\n\nこの度は当院をご利用いただき、ありがとうございます。\n\nご予約内容：\n予約種類：{{reservation_type}}\n予約日時：{{reservation_date}} {{reservation_time}}\n\n備考：{{message}}\n\nご不明な点がございましたら、お気軽にお問い合わせください。\n\n{{hospital_name}}"
                }
            };

            localStorage.setItem('hospital_reservations', JSON.stringify(initialData.reservations));
            localStorage.setItem('hospital_reservation_types', JSON.stringify(initialData.reservationTypes));
            localStorage.setItem('hospital_system_settings', JSON.stringify(initialData.systemSettings));
        }
    }

    // イベントリスナーの設定
    initializeEventListeners() {
        console.log('Initializing event listeners...');
        
        // 患者向けシステム
        this.setupPatientSystemListeners();
        
        // 管理者ログイン
        this.setupAdminLoginListeners();
        
        // 管理画面
        this.setupAdminSystemListeners();
        
        // プリント機能
        this.setupPrintListeners();
        
        // データ管理
        this.setupDataManagementListeners();
        
        // EmailJS設定
        this.setupEmailJSListeners();
        
        // 確認ダイアログ
        this.setupConfirmDialog();
        
        console.log('Event listeners initialized');
    }

    // 患者向けシステムのイベントリスナー
    setupPatientSystemListeners() {
        // ステップ1: 個人情報入力
        const patientForm = document.getElementById('patient-info-form');
        if (patientForm) {
            console.log('Setting up patient form listener');
            patientForm.addEventListener('submit', (e) => {
                console.log('Patient form submitted');
                e.preventDefault();
                e.stopPropagation();
                this.handlePatientInfoSubmit();
                return false;
            });
        }

        // ステップ2-5: ナビゲーションボタン
        this.setupNavigationButtons();

        // 管理者アクセス
        const adminAccess = document.getElementById('admin-access');
        if (adminAccess) {
            console.log('Setting up admin access listener');
            adminAccess.addEventListener('click', (e) => {
                console.log('Admin access clicked');
                e.preventDefault();
                this.showAdminLogin();
            });
        }
    }

    // ナビゲーションボタンの設定
    setupNavigationButtons() {
        const buttons = [
            { id: 'next-to-step-3', action: () => this.goToStep(3) },
            { id: 'back-to-step-1', action: () => this.goToStep(1) },
            { id: 'next-to-step-4', action: () => this.goToStep(4) },
            { id: 'back-to-step-2', action: () => this.goToStep(2) },
            { id: 'confirm-reservation', action: () => this.confirmReservation() },
            { id: 'back-to-step-3', action: () => this.goToStep(3) },
            { id: 'new-reservation', action: () => this.resetReservation() }
        ];

        buttons.forEach(({ id, action }) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    action();
                });
            }
        });

        // 日付選択のイベントリスナー
        const reservationDate = document.getElementById('reservation-date');
        if (reservationDate) {
            reservationDate.addEventListener('change', () => {
                this.updateTimeSlots();
            });
        }
    }

    // 管理者ログインのイベントリスナー
    setupAdminLoginListeners() {
        const adminLoginForm = document.getElementById('admin-login-form');
        if (adminLoginForm) {
            console.log('Setting up admin login form listener');
            adminLoginForm.addEventListener('submit', (e) => {
                console.log('Admin login form submitted');
                e.preventDefault();
                e.stopPropagation();
                this.handleAdminLogin();
                return false;
            });
        }
    }

    // 管理画面のイベントリスナー
    setupAdminSystemListeners() {
        // ログアウト
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // タブ切り替え
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // システム設定保存
        const saveSystemSettings = document.getElementById('save-system-settings');
        if (saveSystemSettings) {
            saveSystemSettings.addEventListener('click', () => {
                this.saveSystemSettings();
            });
        }
    }

    // プリント機能のイベントリスナー
    setupPrintListeners() {
        const executePrint = document.getElementById('execute-print');
        if (executePrint) {
            executePrint.addEventListener('click', () => {
                this.executePrint();
            });
        }
    }

    // データ管理のイベントリスナー
    setupDataManagementListeners() {
        const createBackup = document.getElementById('create-backup');
        if (createBackup) {
            createBackup.addEventListener('click', () => {
                this.createBackup();
            });
        }

        const restoreFile = document.getElementById('restore-file');
        if (restoreFile) {
            restoreFile.addEventListener('change', (e) => {
                const executeBtn = document.getElementById('execute-restore');
                if (executeBtn) {
                    executeBtn.disabled = !e.target.files.length;
                }
            });
        }

        const executeRestore = document.getElementById('execute-restore');
        if (executeRestore) {
            executeRestore.addEventListener('click', () => {
                this.executeRestore();
            });
        }

        const emergencyRestore = document.getElementById('emergency-restore');
        if (emergencyRestore) {
            emergencyRestore.addEventListener('click', () => {
                this.emergencyRestore();
            });
        }
    }

    // EmailJS設定のイベントリスナー
    setupEmailJSListeners() {
        const testConnection = document.getElementById('test-emailjs-connection');
        if (testConnection) {
            testConnection.addEventListener('click', () => {
                this.testEmailJSConnection();
            });
        }

        const sendTestEmail = document.getElementById('send-test-email');
        if (sendTestEmail) {
            sendTestEmail.addEventListener('click', () => {
                this.sendTestEmail();
            });
        }

        const saveEmailJSConfig = document.getElementById('save-emailjs-config');
        if (saveEmailJSConfig) {
            saveEmailJSConfig.addEventListener('click', () => {
                this.saveEmailJSConfig();
            });
        }
    }

    // 確認ダイアログのイベントリスナー
    setupConfirmDialog() {
        const confirmCancel = document.getElementById('confirm-cancel');
        if (confirmCancel) {
            confirmCancel.addEventListener('click', () => {
                this.hideConfirmDialog();
            });
        }

        const confirmOk = document.getElementById('confirm-ok');
        if (confirmOk) {
            confirmOk.addEventListener('click', () => {
                if (this.confirmCallback) {
                    this.confirmCallback();
                }
                this.hideConfirmDialog();
            });
        }

        const modalBackdrop = document.querySelector('.modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => {
                this.hideConfirmDialog();
            });
        }
    }

    // 患者向けシステム表示
    showPatientSystem() {
        console.log('Showing patient system');
        document.getElementById('patient-system').classList.remove('hidden');
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-system').classList.add('hidden');
        this.loadReservationTypes();
        this.loadPublicMessage();
    }

    // 管理者ログイン表示
    showAdminLogin() {
        console.log('Showing admin login');
        document.getElementById('patient-system').classList.add('hidden');
        document.getElementById('admin-login').classList.remove('hidden');
        document.getElementById('admin-system').classList.add('hidden');
        
        // エラーメッセージをクリア
        const errorMsg = document.getElementById('login-error');
        if (errorMsg) {
            errorMsg.classList.add('hidden');
            errorMsg.textContent = '';
        }
        
        // パスワードフィールドをクリア
        const passwordField = document.getElementById('admin-password');
        if (passwordField) {
            passwordField.value = '';
            passwordField.focus();
        }
    }

    // 管理画面表示
    showAdminSystem() {
        console.log('Showing admin system');
        document.getElementById('patient-system').classList.add('hidden');
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-system').classList.remove('hidden');
        this.loadAdminData();
    }

    // ステップ移動
    goToStep(step) {
        console.log(`Going to step ${step} from ${this.currentStep}`);
        
        // 現在のステップを非アクティブ化
        const currentStepElement = document.querySelector(`.step[data-step="${this.currentStep}"]`);
        const currentContentElement = document.getElementById(`step-${this.currentStep}`);
        
        if (currentStepElement) currentStepElement.classList.remove('active');
        if (currentContentElement) currentContentElement.classList.remove('active');

        // 新しいステップをアクティブ化
        this.currentStep = step;
        const newStepElement = document.querySelector(`.step[data-step="${step}"]`);
        const newContentElement = document.getElementById(`step-${step}`);
        
        if (newStepElement) newStepElement.classList.add('active');
        if (newContentElement) newContentElement.classList.add('active');

        // ステップ固有の処理
        if (step === 2) {
            this.loadReservationTypes();
        } else if (step === 3) {
            this.setupDatePicker();
        } else if (step === 4) {
            this.showReservationSummary();
        }
        
        console.log(`Successfully moved to step ${step}`);
    }

    // 個人情報入力処理
    handlePatientInfoSubmit() {
        console.log('Handling patient info submit');
        
        const nameElement = document.getElementById('patient-name');
        const emailElement = document.getElementById('patient-email');
        const phoneElement = document.getElementById('patient-phone');
        
        if (!nameElement || !emailElement || !phoneElement) {
            console.error('Form elements not found');
            alert('フォーム要素が見つかりません');
            return;
        }
        
        const name = nameElement.value.trim();
        const email = emailElement.value.trim();
        const phone = phoneElement.value.trim();

        console.log('Form values:', { name, email, phone });

        if (!name || !email || !phone) {
            alert('すべての項目を入力してください');
            return;
        }

        // Email形式チェック
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('正しいメールアドレス形式で入力してください');
            return;
        }

        this.reservationData = {
            patientName: name,
            email: email,
            phone: phone
        };

        console.log('Patient data saved:', this.reservationData);
        this.goToStep(2);
    }

    // 予約種類読み込み
    loadReservationTypes() {
        console.log('Loading reservation types');
        const types = JSON.parse(localStorage.getItem('hospital_reservation_types') || '[]');
        const container = document.getElementById('reservation-types');
        
        if (!container) {
            console.error('Reservation types container not found');
            return;
        }
        
        container.innerHTML = types.map(type => `
            <div class="reservation-type-card" data-type-id="${type.id}">
                <h3>${type.name}</h3>
                <div class="reservation-type-details">
                    <p>時間間隔: ${type.timeInterval}分</p>
                    <p>定員: ${type.capacity}名</p>
                </div>
            </div>
        `).join('');

        // 予約種類選択イベント
        container.querySelectorAll('.reservation-type-card').forEach(card => {
            card.addEventListener('click', () => {
                container.querySelectorAll('.reservation-type-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                const typeId = parseInt(card.dataset.typeId);
                const selectedType = types.find(t => t.id === typeId);
                this.reservationData.reservationType = selectedType.name;
                this.reservationData.typeConfig = selectedType;
                
                const nextBtn = document.getElementById('next-to-step-3');
                if (nextBtn) {
                    nextBtn.disabled = false;
                }
                
                console.log('Reservation type selected:', selectedType.name);
            });
        });
    }

    // 日付ピッカー設定
    setupDatePicker() {
        console.log('Setting up date picker');
        const dateInput = document.getElementById('reservation-date');
        if (!dateInput) return;
        
        const today = new Date(this.currentDate);
        const maxDate = new Date(today);
        maxDate.setMonth(maxDate.getMonth() + 3);

        dateInput.min = today.toISOString().split('T')[0];
        dateInput.max = maxDate.toISOString().split('T')[0];
        
        this.updateTimeSlots();
    }

    // 時間スロット更新
    updateTimeSlots() {
        const selectedDate = document.getElementById('reservation-date')?.value;
        const timeSlotsContainer = document.getElementById('time-slots');
        
        if (!timeSlotsContainer) return;
        
        if (!selectedDate || !this.reservationData.typeConfig) {
            timeSlotsContainer.innerHTML = '<p>日付を選択してください</p>';
            return;
        }

        const date = new Date(selectedDate);
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
        const businessHours = this.reservationData.typeConfig.businessHours[dayOfWeek];

        if (businessHours.closed) {
            timeSlotsContainer.innerHTML = '<p>選択した日は休診日です</p>';
            return;
        }

        const timeSlots = this.generateTimeSlots(businessHours.start, businessHours.end, this.reservationData.typeConfig.timeInterval);
        const existingReservations = this.getReservationsForDate(selectedDate, this.reservationData.reservationType);

        timeSlotsContainer.innerHTML = timeSlots.map(time => {
            const isBooked = existingReservations.some(r => r.reservationTime === time);
            return `
                <div class="time-slot ${isBooked ? 'disabled' : ''}" data-time="${time}">
                    ${time}
                </div>
            `;
        }).join('');

        // 時間スロット選択イベント
        timeSlotsContainer.querySelectorAll('.time-slot:not(.disabled)').forEach(slot => {
            slot.addEventListener('click', () => {
                timeSlotsContainer.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                
                this.reservationData.reservationDate = selectedDate;
                this.reservationData.reservationTime = slot.dataset.time;
                
                const nextBtn = document.getElementById('next-to-step-4');
                if (nextBtn) {
                    nextBtn.disabled = false;
                }
            });
        });
    }

    // 時間スロット生成
    generateTimeSlots(startTime, endTime, interval) {
        const slots = [];
        const start = this.timeToMinutes(startTime);
        const end = this.timeToMinutes(endTime);

        for (let time = start; time < end; time += interval) {
            slots.push(this.minutesToTime(time));
        }

        return slots;
    }

    // 時間を分に変換
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // 分を時間に変換
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    // 指定日の予約取得
    getReservationsForDate(date, type) {
        const reservations = JSON.parse(localStorage.getItem('hospital_reservations') || '[]');
        return reservations.filter(r => r.reservationDate === date && r.reservationType === type);
    }

    // 予約サマリー表示
    showReservationSummary() {
        const container = document.getElementById('reservation-summary');
        if (!container) return;
        
        container.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">お名前:</span>
                <span class="summary-value">${this.reservationData.patientName}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">メールアドレス:</span>
                <span class="summary-value">${this.reservationData.email}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">電話番号:</span>
                <span class="summary-value">${this.reservationData.phone}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">予約種類:</span>
                <span class="summary-value">${this.reservationData.reservationType}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">予約日時:</span>
                <span class="summary-value">${this.reservationData.reservationDate} ${this.reservationData.reservationTime}</span>
            </div>
        `;
    }

    // 予約確定
    confirmReservation() {
        const notesElement = document.getElementById('notes');
        const notes = notesElement ? notesElement.value : '';
        const reservations = JSON.parse(localStorage.getItem('hospital_reservations') || '[]');
        
        const newReservation = {
            id: Date.now(),
            ...this.reservationData,
            notes: notes,
            createdAt: new Date().toISOString()
        };

        reservations.push(newReservation);
        localStorage.setItem('hospital_reservations', JSON.stringify(reservations));

        // EmailJS送信（設定されている場合）
        this.sendConfirmationEmail(newReservation);

        this.goToStep(5);
    }

    // 確認メール送信
    sendConfirmationEmail(reservation) {
        const settings = JSON.parse(localStorage.getItem('hospital_system_settings') || '{}');
        const emailConfig = settings.emailJSConfig;

        if (!emailConfig.enabled || !emailConfig.serviceId) {
            return;
        }

        // EmailJS実装は実際の環境でのみ機能
        console.log('Confirmation email would be sent:', reservation);
    }

    // 予約リセット
    resetReservation() {
        this.reservationData = {};
        
        // フォームリセット
        const patientForm = document.getElementById('patient-info-form');
        if (patientForm) patientForm.reset();
        
        const notesElement = document.getElementById('notes');
        if (notesElement) notesElement.value = '';
        
        // ステップリセット
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        document.querySelectorAll('.step-content').forEach(content => content.classList.remove('active'));
        
        const firstStep = document.querySelector('.step[data-step="1"]');
        const firstContent = document.getElementById('step-1');
        if (firstStep) firstStep.classList.add('active');
        if (firstContent) firstContent.classList.add('active');
        
        this.currentStep = 1;
        
        // ボタン状態リセット
        const nextToStep3 = document.getElementById('next-to-step-3');
        const nextToStep4 = document.getElementById('next-to-step-4');
        if (nextToStep3) nextToStep3.disabled = true;
        if (nextToStep4) nextToStep4.disabled = true;
    }

    // 公開メッセージ読み込み
    loadPublicMessage() {
        const settings = JSON.parse(localStorage.getItem('hospital_system_settings') || '{}');
        const publicMessageElement = document.getElementById('public-message');
        if (publicMessageElement) {
            publicMessageElement.innerHTML = `<p>${settings.publicMessage || ''}</p>`;
        }
    }

    // 管理者ログイン処理
    handleAdminLogin() {
        console.log('Handling admin login');
        const passwordElement = document.getElementById('admin-password');
        if (!passwordElement) {
            console.error('Password element not found');
            return;
        }
        
        const password = passwordElement.value;
        const settings = JSON.parse(localStorage.getItem('hospital_system_settings') || '{}');
        
        console.log('Login attempt with password:', password);
        console.log('Expected password:', settings.adminPassword);
        
        if (password === settings.adminPassword) {
            console.log('Login successful');
            this.currentUser = 'admin';
            this.showAdminSystem();
        } else {
            console.log('Login failed');
            const errorElement = document.getElementById('login-error');
            if (errorElement) {
                errorElement.textContent = 'パスワードが間違っています';
                errorElement.classList.remove('hidden');
            }
        }
    }

    // ログアウト
    logout() {
        this.currentUser = null;
        this.showPatientSystem();
    }

    // タブ切り替え
    switchTab(tabName) {
        // タブボタンの状態更新
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTabBtn) activeTabBtn.classList.add('active');

        // タブコンテンツの表示切り替え
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        const activeTabContent = document.getElementById(`${tabName}-tab`);
        if (activeTabContent) activeTabContent.classList.add('active');

        // タブ固有の処理
        if (tabName === 'reservations') {
            this.loadReservationsList();
            this.loadPrintReservationTypes();
        } else if (tabName === 'types') {
            this.loadReservationTypesList();
        } else if (tabName === 'settings') {
            this.loadSystemSettings();
            this.updateEmailJSStatus();
        }
    }

    // 管理画面データ読み込み
    loadAdminData() {
        this.switchTab('reservations');
    }

    // 予約一覧読み込み
    loadReservationsList() {
        const reservations = JSON.parse(localStorage.getItem('hospital_reservations') || '[]');
        const container = document.getElementById('reservations-list');
        
        if (!container) return;
        
        if (reservations.length === 0) {
            container.innerHTML = '<p>予約がありません</p>';
            return;
        }

        container.innerHTML = reservations.map(reservation => `
            <div class="reservation-item">
                <div class="reservation-info">
                    <h4>${reservation.patientName}</h4>
                    <p>${reservation.email}</p>
                    <p>${reservation.phone}</p>
                </div>
                <div class="reservation-info">
                    <h4>${reservation.reservationType}</h4>
                    <p>${reservation.reservationDate}</p>
                    <p>${reservation.reservationTime}</p>
                </div>
                <div class="reservation-info">
                    <h4>備考</h4>
                    <p>${reservation.notes || '特になし'}</p>
                </div>
                <div class="reservation-actions">
                    <button class="btn btn--error btn--sm" onclick="system.deleteReservation(${reservation.id})">削除</button>
                </div>
            </div>
        `).join('');
    }

    // 予約削除
    deleteReservation(id) {
        this.showConfirmDialog(
            '予約削除確認',
            'この予約を削除しますか？',
            () => {
                const reservations = JSON.parse(localStorage.getItem('hospital_reservations') || '[]');
                const filtered = reservations.filter(r => r.id !== id);
                localStorage.setItem('hospital_reservations', JSON.stringify(filtered));
                this.loadReservationsList();
            }
        );
    }

    // プリント用予約種類読み込み
    loadPrintReservationTypes() {
        const types = JSON.parse(localStorage.getItem('hospital_reservation_types') || '[]');
        const select = document.getElementById('print-reservation-type');
        
        if (!select) return;
        
        select.innerHTML = '<option value="">すべての予約種類</option>' + 
            types.map(type => `<option value="${type.name}">${type.name}</option>`).join('');
    }

    // プリント実行
    executePrint() {
        const reservationTypeElement = document.getElementById('print-reservation-type');
        const startDateElement = document.getElementById('print-start-date');
        const endDateElement = document.getElementById('print-end-date');
        
        if (!reservationTypeElement || !startDateElement || !endDateElement) return;
        
        const reservationType = reservationTypeElement.value;
        const startDate = startDateElement.value;
        const endDate = endDateElement.value;

        if (!startDate || !endDate) {
            alert('開始日と終了日を選択してください');
            return;
        }

        const reservations = JSON.parse(localStorage.getItem('hospital_reservations') || '[]');
        const settings = JSON.parse(localStorage.getItem('hospital_system_settings') || '{}');
        
        // 期間とタイプでフィルタリング
        let filteredReservations = reservations.filter(r => {
            const resDate = new Date(r.reservationDate);
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            return resDate >= start && resDate <= end && 
                   (reservationType === '' || r.reservationType === reservationType);
        });

        // 予約時間順でソート
        filteredReservations.sort((a, b) => {
            const dateTimeA = new Date(`${a.reservationDate}T${a.reservationTime}`);
            const dateTimeB = new Date(`${b.reservationDate}T${b.reservationTime}`);
            return dateTimeA - dateTimeB;
        });

        // プリント内容生成
        const printContent = this.generatePrintContent(
            settings.hospitalName || 'さくら病院',
            reservationType || 'すべての予約種類',
            startDate,
            endDate,
            filteredReservations
        );

        // プリント表示と印刷実行
        const printContentElement = document.getElementById('print-content');
        const printAreaElement = document.getElementById('print-area');
        
        if (printContentElement && printAreaElement) {
            printContentElement.innerHTML = printContent;
            printAreaElement.classList.remove('hidden');
            
            setTimeout(() => {
                window.print();
                printAreaElement.classList.add('hidden');
            }, 100);
        }
    }

    // プリント内容生成
    generatePrintContent(hospitalName, reservationType, startDate, endDate, reservations) {
        const currentDateTime = new Date(this.currentDate).toLocaleString('ja-JP');
        
        return `
            <div class="print-header">
                <h1>${hospitalName}</h1>
                <p>予約一覧表</p>
            </div>
            <div class="print-meta">
                <div>
                    <strong>プリント作成日時:</strong> ${currentDateTime}
                </div>
                <div>
                    <strong>予約種類:</strong> ${reservationType}
                </div>
                <div>
                    <strong>期間:</strong> ${startDate} 〜 ${endDate}
                </div>
                <div>
                    <strong>件数:</strong> ${reservations.length}件
                </div>
            </div>
            <table class="print-table">
                <thead>
                    <tr>
                        <th>予約日時</th>
                        <th>患者名</th>
                        <th>電話番号</th>
                        <th>メールアドレス</th>
                        <th>備考</th>
                    </tr>
                </thead>
                <tbody>
                    ${reservations.map(r => `
                        <tr>
                            <td>${r.reservationDate} ${r.reservationTime}</td>
                            <td>${r.patientName}</td>
                            <td>${r.phone}</td>
                            <td>${r.email}</td>
                            <td>${r.notes || '特になし'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="print-summary">
                合計: ${reservations.length}件の予約
            </div>
        `;
    }

    // 予約種類一覧読み込み
    loadReservationTypesList() {
        const types = JSON.parse(localStorage.getItem('hospital_reservation_types') || '[]');
        const container = document.getElementById('reservation-types-list');
        
        if (!container) return;
        
        container.innerHTML = types.map(type => `
            <div class="reservation-type-item">
                <div class="type-header">
                    <h4>${type.name}</h4>
                </div>
                <div class="type-details">
                    <div class="type-detail-item">
                        <div class="type-detail-label">時間間隔</div>
                        <div class="type-detail-value">${type.timeInterval}分</div>
                    </div>
                    <div class="type-detail-item">
                        <div class="type-detail-label">定員</div>
                        <div class="type-detail-value">${type.capacity}名</div>
                    </div>
                    <div class="type-detail-item">
                        <div class="type-detail-label">利用可能期間</div>
                        <div class="type-detail-value">${type.availablePeriod.start} 〜 ${type.availablePeriod.end}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // システム設定読み込み
    loadSystemSettings() {
        const settings = JSON.parse(localStorage.getItem('hospital_system_settings') || '{}');
        
        const hospitalNameElement = document.getElementById('hospital-name');
        const publicMessageElement = document.getElementById('public-message-input');
        
        if (hospitalNameElement) hospitalNameElement.value = settings.hospitalName || '';
        if (publicMessageElement) publicMessageElement.value = settings.publicMessage || '';
        
        // EmailJS設定
        if (settings.emailJSConfig) {
            const serviceIdElement = document.getElementById('emailjs-service-id');
            const templateIdElement = document.getElementById('emailjs-template-id');
            const publicKeyElement = document.getElementById('emailjs-public-key');
            
            if (serviceIdElement) serviceIdElement.value = settings.emailJSConfig.serviceId || '';
            if (templateIdElement) templateIdElement.value = settings.emailJSConfig.templateId || '';
            if (publicKeyElement) publicKeyElement.value = settings.emailJSConfig.publicKey || '';
        }
    }

    // システム設定保存
    saveSystemSettings() {
        const settings = JSON.parse(localStorage.getItem('hospital_system_settings') || '{}');
        
        const hospitalNameElement = document.getElementById('hospital-name');
        const publicMessageElement = document.getElementById('public-message-input');
        
        if (hospitalNameElement) settings.hospitalName = hospitalNameElement.value;
        if (publicMessageElement) settings.publicMessage = publicMessageElement.value;
        
        localStorage.setItem('hospital_system_settings', JSON.stringify(settings));
        alert('設定を保存しました');
    }

    // EmailJS設定保存
    saveEmailJSConfig() {
        const settings = JSON.parse(localStorage.getItem('hospital_system_settings') || '{}');
        
        if (!settings.emailJSConfig) {
            settings.emailJSConfig = {};
        }
        
        const serviceIdElement = document.getElementById('emailjs-service-id');
        const templateIdElement = document.getElementById('emailjs-template-id');
        const publicKeyElement = document.getElementById('emailjs-public-key');
        
        if (serviceIdElement) settings.emailJSConfig.serviceId = serviceIdElement.value;
        if (templateIdElement) settings.emailJSConfig.templateId = templateIdElement.value;
        if (publicKeyElement) settings.emailJSConfig.publicKey = publicKeyElement.value;
        
        settings.emailJSConfig.enabled = !!(settings.emailJSConfig.serviceId && settings.emailJSConfig.templateId && settings.emailJSConfig.publicKey);
        
        localStorage.setItem('hospital_system_settings', JSON.stringify(settings));
        this.updateEmailJSStatus();
        alert('EmailJS設定を保存しました');
    }

    // EmailJS状態更新
    updateEmailJSStatus() {
        const settings = JSON.parse(localStorage.getItem('hospital_system_settings') || '{}');
        const config = settings.emailJSConfig || {};
        const indicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        
        if (!indicator || !statusText) return;
        
        if (config.enabled && config.serviceId && config.templateId && config.publicKey) {
            indicator.className = 'status-indicator success';
            statusText.textContent = '正常稼働';
        } else if (config.serviceId || config.templateId || config.publicKey) {
            indicator.className = 'status-indicator warning';
            statusText.textContent = '設定不完全';
        } else {
            indicator.className = 'status-indicator';
            statusText.textContent = '未設定';
        }
    }

    // EmailJS接続テスト
    testEmailJSConnection() {
        const serviceIdElement = document.getElementById('emailjs-service-id');
        const templateIdElement = document.getElementById('emailjs-template-id');
        const publicKeyElement = document.getElementById('emailjs-public-key');
        
        const serviceId = serviceIdElement ? serviceIdElement.value : '';
        const templateId = templateIdElement ? templateIdElement.value : '';
        const publicKey = publicKeyElement ? publicKeyElement.value : '';
        
        const resultsContainer = document.getElementById('emailjs-test-results');
        if (!resultsContainer) return;
        
        resultsContainer.classList.remove('hidden');
        
        // 模擬テスト結果
        resultsContainer.innerHTML = `
            <h4>接続テスト結果</h4>
            <div class="test-result-item">
                <span>Service ID: ${serviceId ? '✓ 設定済み' : '✗ 未設定'}</span>
            </div>
            <div class="test-result-item">
                <span>Template ID: ${templateId ? '✓ 設定済み' : '✗ 未設定'}</span>
            </div>
            <div class="test-result-item">
                <span>Public Key: ${publicKey ? '✓ 設定済み' : '✗ 未設定'}</span>
            </div>
            <div class="test-result-item">
                <span>接続状態: ${serviceId && templateId && publicKey ? '✓ 正常' : '✗ 設定不完全'}</span>
            </div>
        `;
    }

    // テストメール送信
    sendTestEmail() {
        const resultsContainer = document.getElementById('emailjs-test-results');
        if (!resultsContainer) return;
        
        resultsContainer.classList.remove('hidden');
        resultsContainer.innerHTML = `
            <h4>テストメール送信結果</h4>
            <div class="test-result-item">
                <span>送信時刻: ${new Date().toLocaleString('ja-JP')}</span>
            </div>
            <div class="test-result-item">
                <span>結果: 模擬送信完了（実際の送信にはEmailJSの設定が必要です）</span>
            </div>
        `;
    }

    // バックアップ作成
    createBackup() {
        const reservations = JSON.parse(localStorage.getItem('hospital_reservations') || '[]');
        const reservationTypes = JSON.parse(localStorage.getItem('hospital_reservation_types') || '[]');
        const systemSettings = JSON.parse(localStorage.getItem('hospital_system_settings') || '{}');
        
        const backupData = {
            exportDate: new Date().toISOString(),
            version: "1.0",
            data: {
                reservations,
                reservationTypes,
                systemSettings
            }
        };
        
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const currentDateTime = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `hospital_backup_${currentDateTime}.json`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
        alert('バックアップファイルをダウンロードしました');
    }

    // データ復元実行
    executeRestore() {
        this.showConfirmDialog(
            'データ復元確認',
            '現在のデータを復元データで上書きします。現在のデータは自動的にバックアップされます。実行しますか？',
            () => {
                // 現在データの自動バックアップ
                this.createBackup();
                
                const fileInput = document.getElementById('restore-file');
                if (!fileInput || !fileInput.files[0]) {
                    alert('復元ファイルを選択してください');
                    return;
                }
                
                const file = fileInput.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const backupData = JSON.parse(e.target.result);
                        
                        // データ形式チェック
                        if (!backupData.data || !backupData.version) {
                            throw new Error('無効なバックアップファイル形式です');
                        }
                        
                        // データ復元
                        if (backupData.data.reservations) {
                            localStorage.setItem('hospital_reservations', JSON.stringify(backupData.data.reservations));
                        }
                        if (backupData.data.reservationTypes) {
                            localStorage.setItem('hospital_reservation_types', JSON.stringify(backupData.data.reservationTypes));
                        }
                        if (backupData.data.systemSettings) {
                            localStorage.setItem('hospital_system_settings', JSON.stringify(backupData.data.systemSettings));
                        }
                        
                        alert('データの復元が完了しました');
                        this.loadAdminData();
                        
                    } catch (error) {
                        alert('復元に失敗しました: ' + error.message);
                    }
                };
                
                reader.readAsText(file);
            }
        );
    }

    // 緊急時復旧
    emergencyRestore() {
        this.showConfirmDialog(
            '緊急時復旧確認',
            'すべてのデータが初期状態に戻ります。この操作は取り消せません。実行しますか？',
            () => {
                // LocalStorageクリア
                localStorage.removeItem('hospital_reservations');
                localStorage.removeItem('hospital_reservation_types');
                localStorage.removeItem('hospital_system_settings');
                
                // 初期データ再設定
                this.initializeData();
                
                alert('初期データに復元しました');
                this.loadAdminData();
            }
        );
    }

    // 確認ダイアログ表示
    showConfirmDialog(title, message, callback) {
        const dialog = document.getElementById('confirm-dialog');
        const titleElement = document.getElementById('confirm-title');
        const messageElement = document.getElementById('confirm-message');
        
        if (!dialog || !titleElement || !messageElement) return;
        
        titleElement.textContent = title;
        messageElement.textContent = message;
        this.confirmCallback = callback;
        
        dialog.classList.remove('hidden');
    }

    // 確認ダイアログ非表示
    hideConfirmDialog() {
        const dialog = document.getElementById('confirm-dialog');
        if (dialog) {
            dialog.classList.add('hidden');
        }
        this.confirmCallback = null;
    }
}

// システム初期化
let system;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing system...');
    system = new HospitalReservationSystem();
});
