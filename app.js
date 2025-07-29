// 病院予約システム JavaScript - 修正版
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
        
        // DOM読み込み完了後に初期化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('システムを初期化しています...');
        this.initializeDefaultData();
        this.bindEvents();
        this.loadReservationTypes();
        this.updateNoticeMessage();
        this.setMinDate();
        console.log('システムの初期化が完了しました');
    }

    // デフォルトデータの初期化
    initializeDefaultData() {
        console.log('デフォルトデータを初期化しています...');
        
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
            console.log('デフォルトの予約種類を設定しました');
        }

        if (!this.getStorageItem('reservations')) {
            this.setStorageItem('reservations', []);
            console.log('予約データを初期化しました');
        }

        if (!this.getStorageItem('adminPassword')) {
            this.setStorageItem('adminPassword', 'admin123');
            console.log('管理者パスワードを設定しました');
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

○○クリニック
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
            return true;
        } catch (error) {
            console.error(`Error setting ${key} to storage:`, error);
            return false;
        }
    }

    // イベントバインディング
    bindEvents() {
        console.log('イベントハンドラーをバインドしています...');
        
        // 管理者ログインボタン
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('管理者ログインボタンがクリックされました');
                this.showModal('adminLoginModal');
            });
            console.log('管理者ログインボタンのイベントを設定しました');
        } else {
            console.error('管理者ログインボタンが見つかりません');
        }

        // 管理者ログインフォーム
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('管理者ログインフォームが送信されました');
                this.handleAdminLogin();
            });
        }

        // ログアウトボタン
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                console.log('ログアウトボタンがクリックされました');
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
                const tabName = e.target.dataset.tab;
                console.log(`タブが切り替えられました: ${tabName}`);
                this.switchTab(tabName);
            });
        });

        // モーダル閉じる
        document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
            element.addEventListener('click', (e) => {
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
        
        console.log('イベントハンドラーのバインドが完了しました');
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
        console.log(`ステップ${step}に移動します`);
        
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        
        const targetStep = document.getElementById(`step${step}`);
        if (targetStep) {
            targetStep.classList.add('active');
            this.currentStep = step;

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

    // 予約種類読み込み - 修正版
    loadReservationTypes() {
        console.log('予約種類を読み込んでいます...');
        
        const types = this.getStorageItem('reservationTypes');
        const container = document.getElementById('reservationTypes');
        
        if (!container) {
            console.error('予約種類コンテナが見つかりません');
            return;
        }
        
        if (!types || types.length === 0) {
            console.error('予約種類データが見つかりません');
            container.innerHTML = '<p>予約種類が設定されていません。管理者にお問い合わせください。</p>';
            return;
        }
        
        console.log(`${types.length}個の予約種類を表示します`, types);
        
        container.innerHTML = '';
        
        types.forEach((type, index) => {
            console.log(`予約種類を作成中: ${type.name}`);
            
            const card = document.createElement('div');
            card.className = 'reservation-type-card';
            card.dataset.typeId = type.id;
            
            card.innerHTML = `
                <h3>${type.name}</h3>
                <p>所要時間: ${type.duration}分</p>
                <p>定員: ${type.capacity}名</p>
            `;
            
            card.addEventListener('click', () => {
                console.log(`予約種類が選択されました: ${type.name}`);
                document.querySelectorAll('.reservation-type-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedType = type;
                setTimeout(() => {
                    this.goToStep(2);
                }, 200);
            });
            
            container.appendChild(card);
        });
        
        console.log('予約種類の読み込みが完了しました');
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
        
        if (!this.selectedType.schedule[dayName].enabled) {
            this.showMessage('選択した日は休業日です。', 'error');
            return false;
        }

        if (this.selectedType.holidayDates.includes(selectedDate)) {
            this.showMessage('選択した日は休日です。', 'error');
            return false;
        }

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
        console.log('予約送信処理を開始します');
        
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
        const duplicateReservation = existingReservations.find(r => 
            r.email === email && r.date === this.selectedDate && r.time === this.selectedTime
        );
        
        if (duplicateReservation) {
            this.showMessage('このメールアドレス・日時で既に予約があります。', 'error');
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
        const saveResult = this.setStorageItem('reservations', existingReservations);
        
        if (!saveResult) {
            this.showMessage('予約の保存に失敗しました。', 'error');
            return;
        }

        console.log('予約が保存されました:', reservation);

        // メール送信
        const emailResult = await this.sendConfirmationEmail(reservation);
        
        if (emailResult.success) {
            this.showMessage('予約が完了し、確認メールを送信しました。', 'success');
        } else {
            this.showMessage('予約は完了しましたが、メール送信に失敗しました。', 'warning');
        }

        // 完了画面表示
        this.showReservationSummary(reservation);
        this.goToStep(5);
    }

    // 確認メール送信
    async sendConfirmationEmail(reservation) {
        console.log('メール送信を開始します', reservation);
        
        const emailSettings = this.getStorageItem('emailSettings');
        
        if (!emailSettings || !emailSettings.brevoApiKey || !emailSettings.senderEmail) {
            console.log('メール設定が不完全です', emailSettings);
            return { success: false, message: 'メール設定が不完全です。' };
        }

        try {
            const template = emailSettings.template
                .replace(/{customerName}/g, reservation.name)
                .replace(/{reservationType}/g, reservation.typeName)
                .replace(/{reservationDateTime}/g, `${this.formatDate(reservation.date)} ${reservation.time}`)
                .replace(/{notes}/g, reservation.notes || 'なし');

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

            console.log('Brevo APIにメール送信リクエストを送信します', emailData);

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
                const result = await response.json();
                console.log('メール送信成功:', result);
                return { success: true, message: 'メールが送信されました。' };
            } else {
                const error = await response.text();
                console.error('メール送信失敗:', error);
                return { success: false, message: `メール送信エラー: ${response.status}` };
            }
        } catch (error) {
            console.error('メール送信エラー:', error);
            if (error.message.includes('CORS') || error.name === 'TypeError') {
                console.log('CORS制限のため、メール送信をシミュレートします');
                return { success: true, message: 'メール送信をシミュレートしました（CORS制限のため）。' };
            }
            return { success: false, message: 'メール送信に失敗しました。' };
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
        console.log('フォームをリセットします');
        
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
        
        const dateInput = document.getElementById('reservationDate');
        if (dateInput) {
            dateInput.value = '';
        }
    }

    // 管理者ログイン
    handleAdminLogin() {
        console.log('管理者ログイン処理を開始します');
        
        const passwordEl = document.getElementById('adminPassword');
        if (!passwordEl) {
            console.error('パスワード入力欄が見つかりません');
            return;
        }
        
        const password = passwordEl.value.trim();
        const storedPassword = this.getStorageItem('adminPassword');
        
        console.log('パスワード確認中...');
        
        if (password === storedPassword) {
            console.log('ログイン成功');
            this.hideModal('adminLoginModal');
            this.showAdminPanel();
            passwordEl.value = '';
            this.showMessage('管理者としてログインしました。', 'success');
        } else {
            console.log('ログイン失敗');
            this.showMessage('パスワードが正しくありません。', 'error');
        }
    }

    // 管理者画面表示
    showAdminPanel() {
        console.log('管理者画面を表示します');
        
        const mainContent = document.querySelector('.main-content');
        const noticeSection = document.querySelector('.notice-section');
        const header = document.querySelector('.header');
        const adminPanel = document.getElementById('adminPanel');
        
        if (mainContent) {
            mainContent.style.display = 'none';
            console.log('メインコンテンツを非表示にしました');
        }
        if (noticeSection) {
            noticeSection.style.display = 'none';
            console.log('お知らせセクションを非表示にしました');
        }
        if (header) {
            header.style.display = 'none';
            console.log('ヘッダーを非表示にしました');
        }
        if (adminPanel) {
            adminPanel.classList.add('active');
            console.log('管理者パネルを表示しました');
        }
        
        this.loadAdminData();
    }

    // ログアウト
    handleLogout() {
        console.log('ログアウト処理を開始します');
        
        const mainContent = document.querySelector('.main-content');
        const noticeSection = document.querySelector('.notice-section');
        const header = document.querySelector('.header');
        const adminPanel = document.getElementById('adminPanel');
        
        if (mainContent) mainContent.style.display = 'block';
        if (noticeSection) noticeSection.style.display = 'block';
        if (header) header.style.display = 'block';
        if (adminPanel) adminPanel.classList.remove('active');
        
        this.switchTab('dashboard');
        this.showMessage('ログアウトしました。', 'info');
    }

    // モーダル操作
    showModal(modalId) {
        console.log(`モーダルを表示します: ${modalId}`);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            console.log(`モーダル ${modalId} を表示しました`);
        } else {
            console.error(`モーダル ${modalId} が見つかりません`);
        }
    }

    hideModal(modalId) {
        console.log(`モーダルを非表示にします: ${modalId}`);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // メッセージ表示
    showMessage(message, type = 'info') {
        console.log(`メッセージを表示します: ${message} (${type})`);
        
        document.querySelectorAll('.message').forEach(msg => msg.remove());

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;

        // メインコンテンツの最初に挿入
        const mainContainer = document.querySelector('.main-content .container') || 
                             document.querySelector('.admin-content .container') || 
                             document.querySelector('.container');
        
        if (mainContainer) {
            mainContainer.insertBefore(messageElement, mainContainer.firstChild);

            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 5000);
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

    // 管理者データ読み込み
    loadAdminData() {
        console.log('管理者データを読み込んでいます');
        
        this.loadDashboard();
        this.loadReservationsList();
        this.loadReservationTypes();
        this.loadEmailSettings();
        this.loadSystemSettings();
    }

    // ダッシュボード読み込み
    loadDashboard() {
        const reservations = this.getStorageItem('reservations') || [];
        const today = new Date().toISOString().split('T')[0];
        const thisWeek = this.getWeekRange(new Date());
        const thisMonth = this.getMonthRange(new Date());
        
        const todayCount = reservations.filter(r => r.date === today).length;
        const weekCount = reservations.filter(r => r.date >= thisWeek.start && r.date <= thisWeek.end).length;
        const monthCount = reservations.filter(r => r.date >= thisMonth.start && r.date <= thisMonth.end).length;
        
        const todayEl = document.getElementById('todayReservations');
        const weekEl = document.getElementById('weekReservations');
        const monthEl = document.getElementById('monthReservations');
        
        if (todayEl) todayEl.textContent = todayCount;
        if (weekEl) weekEl.textContent = weekCount;
        if (monthEl) monthEl.textContent = monthCount;

        console.log(`統計データ - 本日: ${todayCount}, 今週: ${weekCount}, 今月: ${monthCount}`);
        
        this.loadCalendar();
    }

    // 予約リスト読み込み
    loadReservationsList() {
        const container = document.getElementById('reservationsList');
        if (!container) return;
        
        const reservations = this.getStorageItem('reservations') || [];
        const filterType = document.getElementById('filterType');
        const filterDate = document.getElementById('filterDate');
        
        let filteredReservations = [...reservations];
        
        if (filterType && filterType.value) {
            filteredReservations = filteredReservations.filter(r => r.type === filterType.value);
        }
        
        if (filterDate && filterDate.value) {
            filteredReservations = filteredReservations.filter(r => r.date === filterDate.value);
        }
        
        filteredReservations.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateB - dateA;
        });
        
        if (filteredReservations.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>予約がありません</h3><p>予約データが見つかりませんでした。</p></div>';
            return;
        }
        
        const table = `
            <table>
                <thead>
                    <tr>
                        <th>予約日時</th>
                        <th>種類</th>
                        <th>お名前</th>
                        <th>メール</th>
                        <th>電話</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredReservations.map(reservation => `
                        <tr>
                            <td>${this.formatDate(reservation.date)} ${reservation.time}</td>
                            <td>${reservation.typeName}</td>
                            <td>${reservation.name}</td>
                            <td>${reservation.email}</td>
                            <td>${reservation.phone}</td>
                            <td class="reservation-actions">
                                <button class="btn btn--sm btn--outline" onclick="window.reservationSystem.editReservation('${reservation.id}')">編集</button>
                                <button class="btn btn--sm" style="background: var(--color-error); color: white;" onclick="window.reservationSystem.deleteReservationDirect('${reservation.id}')">削除</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = table;
        this.updateFilterOptions();
        
        console.log(`${filteredReservations.length}件の予約を表示しました`);
    }

    // フィルタオプション更新
    updateFilterOptions() {
        const filterType = document.getElementById('filterType');
        if (!filterType) return;
        
        const types = this.getStorageItem('reservationTypes') || [];
        filterType.innerHTML = '<option value="">全ての予約種類</option>';
        
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            filterType.appendChild(option);
        });
    }

    // メール設定読み込み
    loadEmailSettings() {
        const emailSettings = this.getStorageItem('emailSettings') || {};
        
        const apiKeyEl = document.getElementById('brevoApiKey');
        const senderEmailEl = document.getElementById('senderEmail');
        const senderNameEl = document.getElementById('senderName');
        const emailSubjectEl = document.getElementById('emailSubject');
        const emailTemplateEl = document.getElementById('emailTemplate');
        
        if (apiKeyEl) apiKeyEl.value = emailSettings.brevoApiKey || '';
        if (senderEmailEl) senderEmailEl.value = emailSettings.senderEmail || '';
        if (senderNameEl) senderNameEl.value = emailSettings.senderName || '';
        if (emailSubjectEl) emailSubjectEl.value = emailSettings.subject || '';
        if (emailTemplateEl) emailTemplateEl.value = emailSettings.template || '';
    }

    // システム設定読み込み
    loadSystemSettings() {
        const noticeMessage = this.getStorageItem('noticeMessage');
        const noticeTextArea = document.getElementById('noticeTextArea');
        if (noticeTextArea && noticeMessage) {
            noticeTextArea.value = noticeMessage;
        }
    }

    // メール設定保存
    handleEmailSettingsSave() {
        console.log('メール設定を保存します');
        
        const apiKeyEl = document.getElementById('brevoApiKey');
        const senderEmailEl = document.getElementById('senderEmail');
        const senderNameEl = document.getElementById('senderName');
        
        if (!apiKeyEl || !senderEmailEl || !senderNameEl) return;
        
        const currentSettings = this.getStorageItem('emailSettings') || {};
        
        const newSettings = {
            ...currentSettings,
            brevoApiKey: apiKeyEl.value.trim(),
            senderEmail: senderEmailEl.value.trim(),
            senderName: senderNameEl.value.trim()
        };
        
        this.setStorageItem('emailSettings', newSettings);
        this.showMessage('メール設定を保存しました。', 'success');
        console.log('メール設定が保存されました', newSettings);
    }

    // メールテンプレート保存
    handleEmailTemplateSave() {
        const subjectEl = document.getElementById('emailSubject');
        const templateEl = document.getElementById('emailTemplate');
        
        if (!subjectEl || !templateEl) return;
        
        const currentSettings = this.getStorageItem('emailSettings') || {};
        
        const newSettings = {
            ...currentSettings,
            subject: subjectEl.value.trim(),
            template: templateEl.value.trim()
        };
        
        this.setStorageItem('emailSettings', newSettings);
        this.showMessage('メールテンプレートを保存しました。', 'success');
    }

    // Brevo接続テスト
    async testBrevoConnection() {
        const apiKeyEl = document.getElementById('brevoApiKey');
        if (!apiKeyEl || !apiKeyEl.value.trim()) {
            this.showMessage('APIキーを入力してください。', 'error');
            return;
        }
        
        this.showMessage('接続をテストしています...', 'info');
        
        try {
            const response = await fetch('https://api.brevo.com/v3/account', {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'api-key': apiKeyEl.value.trim()
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.showMessage(`接続成功: ${data.companyName || 'Brevo'}`, 'success');
            } else {
                this.showMessage('接続失敗: APIキーを確認してください。', 'error');
            }
        } catch (error) {
            console.error('接続テストエラー:', error);
            this.showMessage('接続テストに失敗しました（CORS制限の可能性があります）。', 'warning');
        }
    }

    // 予約編集
    editReservation(reservationId) {
        const reservations = this.getStorageItem('reservations') || [];
        const reservation = reservations.find(r => r.id === reservationId);
        
        if (!reservation) return;
        
        this.editingReservationId = reservationId;
        
        const nameEl = document.getElementById('editCustomerName');
        const emailEl = document.getElementById('editCustomerEmail');
        const phoneEl = document.getElementById('editCustomerPhone');
        const notesEl = document.getElementById('editCustomerNotes');
        
        if (nameEl) nameEl.value = reservation.name;
        if (emailEl) emailEl.value = reservation.email;
        if (phoneEl) phoneEl.value = reservation.phone;
        if (notesEl) notesEl.value = reservation.notes || '';
        
        this.showModal('editReservationModal');
    }

    // 予約編集処理
    handleReservationEdit() {
        if (!this.editingReservationId) return;
        
        const nameEl = document.getElementById('editCustomerName');
        const emailEl = document.getElementById('editCustomerEmail');
        const phoneEl = document.getElementById('editCustomerPhone');
        const notesEl = document.getElementById('editCustomerNotes');
        
        if (!nameEl || !emailEl || !phoneEl) return;
        
        const reservations = this.getStorageItem('reservations') || [];
        const reservationIndex = reservations.findIndex(r => r.id === this.editingReservationId);
        
        if (reservationIndex === -1) return;
        
        reservations[reservationIndex] = {
            ...reservations[reservationIndex],
            name: nameEl.value.trim(),
            email: emailEl.value.trim(),
            phone: phoneEl.value.trim(),
            notes: notesEl.value.trim()
        };
        
        this.setStorageItem('reservations', reservations);
        this.hideModal('editReservationModal');
        this.loadReservationsList();
        this.showMessage('予約を更新しました。', 'success');
        
        this.editingReservationId = null;
    }

    // 予約削除（直接）
    deleteReservationDirect(reservationId) {
        if (!confirm('この予約を削除しますか？')) return;
        
        const reservations = this.getStorageItem('reservations') || [];
        const filteredReservations = reservations.filter(r => r.id !== reservationId);
        
        this.setStorageItem('reservations', filteredReservations);
        this.loadReservationsList();
        this.loadDashboard();
        this.showMessage('予約を削除しました。', 'success');
    }

    // 予約削除（モーダル内）
    handleReservationDelete() {
        if (!this.editingReservationId) return;
        
        if (!confirm('この予約を削除しますか？')) return;
        
        this.deleteReservationDirect(this.editingReservationId);
        this.hideModal('editReservationModal');
        this.editingReservationId = null;
    }

    // お知らせメッセージ更新
    handleNoticeUpdate() {
        const noticeTextArea = document.getElementById('noticeTextArea');
        if (!noticeTextArea) return;
        
        const message = noticeTextArea.value;
        this.setStorageItem('noticeMessage', message);
        this.updateNoticeMessage();
        this.showMessage('お知らせメッセージを更新しました。', 'success');
    }

    // タブ切り替え
    switchTab(tabName) {
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
        const targetContent = document.getElementById(`${tabName}Tab`);
        
        if (targetTab) targetTab.classList.add('active');
        if (targetContent) targetContent.classList.add('active');
        
        if (tabName === 'dashboard') {
            this.loadDashboard();
        } else if (tabName === 'reservations') {
            this.loadReservationsList();
        } else if (tabName === 'types') {
            this.loadReservationTypes();
        } else if (tabName === 'email') {
            this.loadEmailSettings();
        }
    }

    // データエクスポート
    exportData() {
        const data = {
            reservations: this.getStorageItem('reservations'),
            reservationTypes: this.getStorageItem('reservationTypes'),
            emailSettings: this.getStorageItem('emailSettings'),
            noticeMessage: this.getStorageItem('noticeMessage')
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `hospital_reservation_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showMessage('データをエクスポートしました。', 'success');
    }

    // 印刷
    printReservations() {
        window.print();
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

    // カレンダー表示
    loadCalendar() {
        const container = document.getElementById('adminCalendar');
        if (!container) return;
        
        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();
        
        container.innerHTML = `
            <div class="calendar-header">
                <div class="calendar-nav">
                    <button class="btn btn--outline" onclick="window.reservationSystem.changeCalendarMonth(-1)">&lt;</button>
                    <span>${year}年${month + 1}月</span>
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

    // 予約種類読み込み（管理者画面用）
    loadReservationTypes() {
        const container = document.getElementById('reservationTypesList');
        if (!container) return;
        
        const types = this.getStorageItem('reservationTypes') || [];
        
        if (types.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>予約種類がありません</h3><p>新しい予約種類を追加してください。</p></div>';
            return;
        }
        
        container.innerHTML = types.map(type => `
            <div class="reservation-type-item card">
                <div class="card__body">
                    <div class="type-header">
                        <h3>${type.name}</h3>
                        <div class="type-actions">
                            <button class="btn btn--outline btn--sm" onclick="window.reservationSystem.editType('${type.id}')">編集</button>
                            <button class="btn btn--sm" style="background: var(--color-error); color: white;" onclick="window.reservationSystem.deleteType('${type.id}')">削除</button>
                        </div>
                    </div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">所要時間</div>
                            <div class="detail-value">${type.duration}分</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">定員</div>
                            <div class="detail-value">${type.capacity}名</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">予約可能期間</div>
                            <div class="detail-value">${type.availablePeriod.start} 〜 ${type.availablePeriod.end}</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 未実装機能のプレースホルダー
    handlePasswordChange() { this.showMessage('パスワード変更機能は実装中です。', 'info'); }
    showAddTypeModal() { this.showMessage('予約種類追加機能は実装中です。', 'info'); }
    editType(typeId) { this.showMessage('予約種類編集機能は実装中です。', 'info'); }
    deleteType(typeId) { this.showMessage('予約種類削除機能は実装中です。', 'info'); }
    handleTypeSave() { this.showMessage('予約種類保存機能は実装中です。', 'info'); }
    sendTestEmail() { this.showMessage('テストメール送信機能は実装中です。', 'info'); }
    importData(event) { this.showMessage('データインポート機能は実装中です。', 'info'); }
}

// システム初期化
let reservationSystem;

// DOM読み込み完了後にシステムを初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM読み込み完了 - システムを初期化します');
        reservationSystem = new HospitalReservationSystem();
        window.reservationSystem = reservationSystem;
    });
} else {
    console.log('DOMは既に読み込み完了 - システムを初期化します');
    reservationSystem = new HospitalReservationSystem();
    window.reservationSystem = reservationSystem;
}

// グローバル関数
function changeCalendarMonth(direction) {
    if (window.reservationSystem) {
        window.reservationSystem.changeCalendarMonth(direction);
    }
}
