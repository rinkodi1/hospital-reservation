// 病院予約システム - メインスクリプト
// Hospital Booking System - Main Script

// =======================
// 1. データ構造とグローバル変数
// =======================

// EmailJS設定（実際の値に変更してください）
const EMAILJS_CONFIG = {
    serviceId: 'YOUR_SERVICE_ID',
    templateId: 'YOUR_TEMPLATE_ID', 
    publicKey: 'YOUR_PUBLIC_KEY'
};

// デフォルト設定
const DEFAULT_CONFIG = {
    adminPassword: 'admin123',
    hospitalMessage: 'ご来院いただきありがとうございます。オンライン予約システムをご利用ください。'
};

// サンプル予約種類データ
const SAMPLE_BOOKING_TYPES = [
    {
        id: 'health_check',
        name: '健康診断',
        interval: 15,
        capacity: 10,
        startTime: '09:00',
        endTime: '17:00',
        weekdays: [1,2,3,4,5],
        availableFrom: '2025-01-01',
        availableTo: '2025-12-31',
        holidays: ['2025-01-01', '2025-12-31']
    },
    {
        id: 'vaccination',
        name: '予防接種',
        interval: 15,
        capacity: 8,
        startTime: '10:00',
        endTime: '16:00',
        weekdays: [1,2,3,4,5],
        availableFrom: '2025-01-01',
        availableTo: '2025-12-31',
        holidays: []
    }
];

// 現在の画面状態
let currentScreen = 'main';
let selectedTimeSlot = null;
let isAdminLoggedIn = false;

// =======================
// 2. データ管理関数
// =======================

// データをlocalStorageに保存する関数
function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('データ保存エラー:', error);
        return false;
    }
}

// データをlocalStorageから読み込む関数
function loadData(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        return defaultValue;
    }
}

// 初期データを設定する関数
function initializeData() {
    // 予約種類データの初期化
    if (!loadData('bookingTypes')) {
        saveData('bookingTypes', SAMPLE_BOOKING_TYPES);
    }
    
    // 予約データの初期化
    if (!loadData('bookings')) {
        saveData('bookings', []);
    }
    
    // 管理者設定の初期化
    if (!loadData('adminConfig')) {
        saveData('adminConfig', DEFAULT_CONFIG);
    }
}

// =======================
// 3. 画面切り替え関数
// =======================

function showScreen(screenName) {
    // 全ての画面を非表示
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // 指定された画面を表示
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenName;
    }
}

// =======================
// 4. 予約機能
// =======================

// 予約種類を読み込んでセレクトボックスに設定
function loadBookingTypes() {
    const bookingTypes = loadData('bookingTypes', []);
    const selectElement = document.getElementById('booking-type');
    
    if (!selectElement) {
        console.error('booking-type element not found');
        return;
    }
    
    // 既存のオプションをクリア（最初のデフォルトオプション以外）
    selectElement.innerHTML = '<option value="">選択してください</option>';
    
    bookingTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.name;
        selectElement.appendChild(option);
    });
    
    console.log('Loaded booking types:', bookingTypes);
}

// 時間枠を生成する関数
function generateTimeSlots(typeId, date) {
    const bookingTypes = loadData('bookingTypes', []);
    const bookings = loadData('bookings', []);
    const type = bookingTypes.find(t => t.id === typeId);
    
    if (!type) {
        console.log('Type not found:', typeId);
        return [];
    }
    
    // 日付の妥当性チェック
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    
    // 曜日チェック
    if (!type.weekdays.includes(dayOfWeek)) {
        console.log('Day not available:', dayOfWeek, type.weekdays);
        return [];
    }
    
    // 期間チェック
    if (date < type.availableFrom || date > type.availableTo) {
        console.log('Date out of range:', date, type.availableFrom, type.availableTo);
        return [];
    }
    
    // 休日チェック
    if (type.holidays.includes(date)) {
        console.log('Holiday:', date);
        return [];
    }
    
    // 過去の日付チェック
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
        console.log('Past date:', date);
        return [];
    }
    
    const slots = [];
    const startTime = timeToMinutes(type.startTime);
    const endTime = timeToMinutes(type.endTime);
    
    for (let time = startTime; time < endTime; time += type.interval) {
        const timeStr = minutesToTime(time);
        
        // この時間枠の予約数を計算
        const bookingCount = bookings.filter(booking => 
            booking.type === typeId && 
            booking.date === date && 
            booking.time === timeStr
        ).length;
        
        slots.push({
            time: timeStr,
            available: type.capacity - bookingCount,
            capacity: type.capacity,
            isFull: bookingCount >= type.capacity
        });
    }
    
    console.log('Generated slots:', slots);
    return slots;
}

// 時間を分に変換
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// 分を時間に変換
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// 時間枠を表示する関数
function displayTimeSlots() {
    const typeId = document.getElementById('booking-type').value;
    const date = document.getElementById('booking-date').value;
    const container = document.getElementById('time-slots-container');
    const timeSlotsDiv = document.getElementById('time-slots');
    
    console.log('Display time slots:', typeId, date);
    
    if (!typeId || !date) {
        timeSlotsDiv.style.display = 'none';
        return;
    }
    
    const slots = generateTimeSlots(typeId, date);
    
    if (slots.length === 0) {
        container.innerHTML = '<p class="no-data">この日は予約できません。</p>';
        timeSlotsDiv.style.display = 'block';
        return;
    }
    
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'time-slots-grid';
    
    slots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = `time-slot ${slot.isFull ? 'full' : ''}`;
        slotDiv.dataset.time = slot.time;
        
        if (!slot.isFull) {
            slotDiv.addEventListener('click', () => selectTimeSlot(slotDiv, slot.time));
        }
        
        slotDiv.innerHTML = `
            <div class="time-slot-time">${slot.time}</div>
            <div class="time-slot-capacity">${slot.available}/${slot.capacity}</div>
        `;
        
        grid.appendChild(slotDiv);
    });
    
    container.appendChild(grid);
    timeSlotsDiv.style.display = 'block';
    selectedTimeSlot = null;
}

// 時間枠を選択する関数
function selectTimeSlot(element, time) {
    // 既存の選択を解除
    document.querySelectorAll('.time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // 新しい選択を適用
    element.classList.add('selected');
    selectedTimeSlot = time;
    console.log('Selected time slot:', time);
}

// 重複予約チェック
function checkDuplicateBooking(email, typeId, date) {
    const bookings = loadData('bookings', []);
    return bookings.some(booking => 
        booking.email === email && 
        booking.type === typeId && 
        booking.date === date
    );
}

// 予約を保存する関数
function saveBooking(bookingData) {
    const bookings = loadData('bookings', []);
    const newBooking = {
        id: generateId(),
        ...bookingData,
        createdAt: new Date().toISOString()
    };
    
    bookings.push(newBooking);
    saveData('bookings', bookings);
    return newBooking;
}

// ユニークIDを生成
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 予約確認メールを送信
function sendConfirmationEmail(booking) {
    const bookingTypes = loadData('bookingTypes', []);
    const type = bookingTypes.find(t => t.id === booking.type);
    
    const templateParams = {
        to_name: booking.name,
        to_email: booking.email,
        booking_type: type ? type.name : booking.type,
        booking_date: booking.date,
        booking_time: booking.time,
        phone: booking.phone,
        notes: booking.notes || 'なし'
    };
    
    // EmailJSが初期化されている場合のみ送信
    if (window.emailjs && EMAILJS_CONFIG.serviceId !== 'YOUR_SERVICE_ID') {
        return emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templateId,
            templateParams,
            EMAILJS_CONFIG.publicKey
        );
    } else {
        // EmailJSが設定されていない場合はPromiseを返す（開発用）
        console.log('EmailJS not configured. Email content:', templateParams);
        return Promise.resolve({status: 200, text: 'OK (development mode)'});
    }
}

// =======================
// 5. 管理者機能
// =======================

// 管理者ログイン
function adminLogin(password) {
    const config = loadData('adminConfig', DEFAULT_CONFIG);
    return password === config.adminPassword;
}

// パスワード変更
function changeAdminPassword(newPassword) {
    const config = loadData('adminConfig', DEFAULT_CONFIG);
    config.adminPassword = newPassword;
    saveData('adminConfig', config);
}

// 病院メッセージ更新
function updateHospitalMessage(message) {
    const config = loadData('adminConfig', DEFAULT_CONFIG);
    config.hospitalMessage = message;
    saveData('adminConfig', config);
    
    // メイン画面のメッセージも更新
    const messageElement = document.getElementById('hospital-message');
    if (messageElement) {
        messageElement.textContent = message;
    }
}

// 管理者タブ切り替え
function switchAdminTab(tabName) {
    // タブボタンの状態更新
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTabBtn) {
        activeTabBtn.classList.add('active');
    }
    
    // タブコンテンツの表示切り替え
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const activeTabContent = document.getElementById(`${tabName}-tab`);
    if (activeTabContent) {
        activeTabContent.classList.add('active');
    }
    
    // タブごとの初期化処理
    switch (tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'bookings':
            loadAdminBookings();
            break;
        case 'types':
            loadBookingTypesAdmin();
            break;
        case 'settings':
            loadSettings();
            break;
        case 'backup':
            // バックアップタブは特別な初期化不要
            break;
    }
}

// ダッシュボード読み込み
function loadDashboard() {
    loadBookingsList();
    loadCalendarView();
}

// 予約一覧を読み込み（ダッシュボード用）
function loadBookingsList() {
    const bookings = loadData('bookings', []);
    const bookingTypes = loadData('bookingTypes', []);
    const container = document.getElementById('bookings-list');
    const sortBy = document.getElementById('sort-by').value;
    
    if (!container) return;
    
    // ソート処理
    let sortedBookings = [...bookings];
    switch (sortBy) {
        case 'date':
            sortedBookings.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
            break;
        case 'type':
            sortedBookings.sort((a, b) => a.type.localeCompare(b.type));
            break;
        case 'name':
            sortedBookings.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    if (sortedBookings.length === 0) {
        container.innerHTML = '<div class="no-data">予約がありません</div>';
        return;
    }
    
    container.innerHTML = '';
    sortedBookings.forEach(booking => {
        const type = bookingTypes.find(t => t.id === booking.type);
        const bookingDiv = document.createElement('div');
        bookingDiv.className = 'booking-item';
        bookingDiv.innerHTML = `
            <div class="booking-date">${booking.date} ${booking.time}</div>
            <div class="booking-type">${type ? type.name : booking.type}</div>
            <div>${booking.name}</div>
            <div class="booking-actions">
                <button class="btn btn--outline btn--sm" onclick="viewBookingDetails('${booking.id}')">詳細</button>
            </div>
        `;
        container.appendChild(bookingDiv);
    });
}

// カレンダー表示を読み込み
function loadCalendarView() {
    const dateInput = document.getElementById('calendar-date');
    if (!dateInput) return;
    
    const date = dateInput.value;
    if (!date) return;
    
    const bookings = loadData('bookings', []);
    const bookingTypes = loadData('bookingTypes', []);
    const container = document.getElementById('calendar-view');
    
    if (!container) return;
    
    // その日の予約を取得
    const dayBookings = bookings.filter(booking => booking.date === date);
    
    if (dayBookings.length === 0) {
        container.innerHTML = '<div class="no-data">この日の予約はありません</div>';
        return;
    }
    
    // 予約種類ごとにグループ化
    const groupedBookings = {};
    dayBookings.forEach(booking => {
        if (!groupedBookings[booking.type]) {
            groupedBookings[booking.type] = [];
        }
        groupedBookings[booking.type].push(booking);
    });
    
    container.innerHTML = '';
    Object.keys(groupedBookings).forEach(typeId => {
        const type = bookingTypes.find(t => t.id === typeId);
        const typeBookings = groupedBookings[typeId];
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.innerHTML = `
            <div class="calendar-day-header">${type ? type.name : typeId}</div>
            <div class="calendar-slots" id="slots-${typeId}"></div>
        `;
        
        container.appendChild(dayDiv);
        
        // 時間枠ごとにグループ化
        const timeGroups = {};
        typeBookings.forEach(booking => {
            if (!timeGroups[booking.time]) {
                timeGroups[booking.time] = [];
            }
            timeGroups[booking.time].push(booking);
        });
        
        const slotsContainer = document.getElementById(`slots-${typeId}`);
        if (slotsContainer) {
            Object.keys(timeGroups).sort().forEach(time => {
                const slotBookings = timeGroups[time];
                const slotDiv = document.createElement('div');
                slotDiv.className = 'calendar-slot';
                slotDiv.innerHTML = `
                    <div class="calendar-slot-time">${time}</div>
                    <div class="calendar-slot-info">${slotBookings.length}名 (${slotBookings.map(b => b.name).join(', ')})</div>
                `;
                slotsContainer.appendChild(slotDiv);
            });
        }
    });
}

// 予約詳細を表示
function viewBookingDetails(bookingId) {
    const bookings = loadData('bookings', []);
    const bookingTypes = loadData('bookingTypes', []);
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) return;
    
    const type = bookingTypes.find(t => t.id === booking.type);
    
    showModal('予約詳細', `
        <div class="booking-details">
            <p><strong>お名前:</strong> ${booking.name}</p>
            <p><strong>メールアドレス:</strong> ${booking.email}</p>
            <p><strong>電話番号:</strong> ${booking.phone}</p>
            <p><strong>予約種類:</strong> ${type ? type.name : booking.type}</p>
            <p><strong>予約日時:</strong> ${booking.date} ${booking.time}</p>
            <p><strong>備考:</strong> ${booking.notes || 'なし'}</p>
            <p><strong>予約日時:</strong> ${new Date(booking.createdAt).toLocaleString('ja-JP')}</p>
        </div>
        <div class="flex gap-8 mt-16">
            <button class="btn btn--danger" onclick="deleteBooking('${booking.id}')">削除</button>
        </div>
    `);
}

// 予約削除 
function deleteBooking(bookingId) {
    if (!confirm('この予約を削除しますか？')) return;
    
    const bookings = loadData('bookings', []);
    const updatedBookings = bookings.filter(b => b.id !== bookingId);
    saveData('bookings', updatedBookings);
    
    closeModal();
    if (currentScreen === 'admin') {
        loadDashboard();
        loadAdminBookings();
    }
    showMessage('予約を削除しました', 'success');
}

// 管理者用予約一覧を読み込み
function loadAdminBookings() {
    const bookings = loadData('bookings', []);
    const bookingTypes = loadData('bookingTypes', []);
    const container = document.getElementById('admin-bookings-list');
    
    if (!container) return;
    
    if (bookings.length === 0) {
        container.innerHTML = '<div class="no-data">予約がありません</div>';
        return;
    }
    
    const sortedBookings = [...bookings].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    container.innerHTML = '';
    sortedBookings.forEach(booking => {
        const type = bookingTypes.find(t => t.id === booking.type);
        const bookingDiv = document.createElement('div');
        bookingDiv.className = 'booking-item';
        bookingDiv.innerHTML = `
            <div>
                <div class="booking-date">${booking.date} ${booking.time}</div>
                <div class="booking-type">${type ? type.name : booking.type}</div>
            </div>
            <div>
                <div><strong>${booking.name}</strong></div>
                <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">
                    ${booking.email} / ${booking.phone}
                </div>
            </div>
            <div>${booking.notes || '-'}</div>
            <div class="booking-actions">
                <button class="btn btn--outline btn--sm" onclick="viewBookingDetails('${booking.id}')">詳細</button>
                <button class="btn btn--danger btn--sm" onclick="deleteBooking('${booking.id}')">削除</button>
            </div>
        `;
        container.appendChild(bookingDiv);
    });
}

// 予約種類管理を読み込み
function loadBookingTypesAdmin() {
    const bookingTypes = loadData('bookingTypes', []);
    const container = document.getElementById('booking-types-list');
    
    if (!container) return;
    
    if (bookingTypes.length === 0) {
        container.innerHTML = '<div class="no-data">予約種類がありません</div>';
        return;
    }
    
    container.innerHTML = '';
    bookingTypes.forEach(type => {
        const typeDiv = document.createElement('div');
        typeDiv.className = 'booking-type-item';
        typeDiv.innerHTML = `
            <div class="booking-type-info">
                <h4>${type.name}</h4>
                <div class="booking-type-details">
                    ${type.startTime}-${type.endTime} (${type.interval}分間隔) / 定員: ${type.capacity}名<br>
                    期間: ${type.availableFrom} ～ ${type.availableTo}
                </div>
            </div>
            <div class="booking-type-actions">
                <button class="btn btn--outline btn--sm" onclick="editBookingType('${type.id}')">編集</button>
                <button class="btn btn--danger btn--sm" onclick="deleteBookingType('${type.id}')">削除</button>
            </div>
        `;
        container.appendChild(typeDiv);
    });
}

// 予約種類追加
function addBookingType() {
    const template = document.getElementById('type-form-template');
    if (!template) return;
    
    const form = template.content.cloneNode(true);
    
    // 今日の日付をデフォルトに設定
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];
    
    form.querySelector('.type-available-from').value = today;
    form.querySelector('.type-available-to').value = nextYearStr;
    
    showModal('新規予約種類', form);
    
    // フォーム送信処理
    setTimeout(() => {
        const typeForm = document.querySelector('.type-form');
        if (typeForm) {
            typeForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveBookingTypeFromForm(this);
            });
        }
    }, 100);
}

// 予約種類編集
function editBookingType(typeId) {
    const bookingTypes = loadData('bookingTypes', []);
    const type = bookingTypes.find(t => t.id === typeId);
    
    if (!type) return;
    
    const template = document.getElementById('type-form-template');
    if (!template) return;
    
    const form = template.content.cloneNode(true);
    
    // フォームに既存データを設定
    form.querySelector('.type-name').value = type.name;
    form.querySelector('.type-interval').value = type.interval;
    form.querySelector('.type-capacity').value = type.capacity;
    form.querySelector('.type-start-time').value = type.startTime;
    form.querySelector('.type-end-time').value = type.endTime;
    form.querySelector('.type-available-from').value = type.availableFrom;
    form.querySelector('.type-available-to').value = type.availableTo;
    form.querySelector('.type-holidays').value = type.holidays.join(',');
    
    // 曜日チェックボックス
    const checkboxes = form.querySelectorAll('.weekday-checkboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = type.weekdays.includes(parseInt(checkbox.value));
    });
    
    showModal('予約種類編集', form);
    
    // フォーム送信処理
    setTimeout(() => {
        const typeForm = document.querySelector('.type-form');
        if (typeForm) {
            typeForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveBookingTypeFromForm(this, typeId);
            });
        }
    }, 100);
}

// フォームから予約種類を保存
function saveBookingTypeFromForm(form, editId = null) {
    const weekdays = [];
    
    // 曜日チェックボックスの値を取得
    form.querySelectorAll('.weekday-checkboxes input[type="checkbox"]:checked').forEach(checkbox => {
        weekdays.push(parseInt(checkbox.value));
    });
    
    const holidays = form.querySelector('.type-holidays').value
        .split(',')
        .map(h => h.trim())
        .filter(h => h);
    
    const typeData = {
        id: editId || generateId(),
        name: form.querySelector('.type-name').value,
        interval: parseInt(form.querySelector('.type-interval').value),
        capacity: parseInt(form.querySelector('.type-capacity').value),
        startTime: form.querySelector('.type-start-time').value,
        endTime: form.querySelector('.type-end-time').value,
        weekdays: weekdays,
        availableFrom: form.querySelector('.type-available-from').value,
        availableTo: form.querySelector('.type-available-to').value,
        holidays: holidays
    };
    
    const bookingTypes = loadData('bookingTypes', []);
    
    if (editId) {
        // 編集
        const index = bookingTypes.findIndex(t => t.id === editId);
        if (index !== -1) {
            bookingTypes[index] = typeData;
        }
    } else {
        // 新規追加
        bookingTypes.push(typeData);
    }
    
    saveData('bookingTypes', bookingTypes);
    closeModal();
    loadBookingTypesAdmin();
    loadBookingTypes(); // メイン画面のセレクトボックスも更新
    showMessage('予約種類を保存しました', 'success');
}

// 予約種類削除
function deleteBookingType(typeId) {
    if (!confirm('この予約種類を削除しますか？関連する予約も削除されます。')) return;
    
    const bookingTypes = loadData('bookingTypes', []);
    const bookings = loadData('bookings', []);
    
    // 予約種類を削除
    const updatedTypes = bookingTypes.filter(t => t.id !== typeId);
    saveData('bookingTypes', updatedTypes);
    
    // 関連する予約を削除
    const updatedBookings = bookings.filter(b => b.type !== typeId);
    saveData('bookings', updatedBookings);
    
    loadBookingTypesAdmin();
    loadBookingTypes();
    showMessage('予約種類を削除しました', 'success');
}

// 設定読み込み
function loadSettings() {
    const config = loadData('adminConfig', DEFAULT_CONFIG);
    const messageInput = document.getElementById('hospital-message-input');
    if (messageInput) {
        messageInput.value = config.hospitalMessage;
    }
}

// =======================
// 6. UI共通機能
// =======================

// モーダル表示
function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    if (!modal || !modalTitle || !modalBody) return;
    
    modalTitle.textContent = title;
    
    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    } else {
        modalBody.innerHTML = '';
        modalBody.appendChild(content);
    }
    
    modal.classList.remove('hidden');
}

// モーダル閉じる
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// メッセージ表示
function showMessage(text, type = 'info') {
    // 既存のメッセージを削除
    document.querySelectorAll('.message').forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message message--${type}`;
    message.textContent = text;
    
    // アクティブな画面の最初にメッセージを挿入
    const activeScreen = document.querySelector('.screen.active .container');
    if (activeScreen) {
        activeScreen.insertBefore(message, activeScreen.firstChild);
        
        // 3秒後に自動削除
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 3000);
    }
}

// =======================
// 7. バックアップ・復元機能
// =======================

function createBackup() {
    const backupData = {
        bookings: loadData('bookings', []),
        bookingTypes: loadData('bookingTypes', []),
        adminConfig: loadData('adminConfig', DEFAULT_CONFIG),
        timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hospital-booking-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showMessage('バックアップファイルをダウンロードしました', 'success');
}

function restoreFromBackup() {
    const fileInput = document.getElementById('restore-file');
    if (!fileInput) return;
    
    const file = fileInput.files[0];
    
    if (!file) {
        showMessage('復元ファイルを選択してください', 'error');
        return;
    }
    
    if (!confirm('現在のデータは全て上書きされます。実行しますか？')) {
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);
            
            // データの妥当性チェック
            if (!backupData.bookings || !backupData.bookingTypes || !backupData.adminConfig) {
                throw new Error('無効なバックアップファイルです');
            }
            
            // データを復元
            saveData('bookings', backupData.bookings);
            saveData('bookingTypes', backupData.bookingTypes);
            saveData('adminConfig', backupData.adminConfig);
            
            // 画面を再読み込み
            location.reload();
            
        } catch (error) {
            showMessage('バックアップファイルの復元に失敗しました: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
}

// =======================
// 8. 印刷機能
// =======================

function printBookingsList() {
    const bookings = loadData('bookings', []);
    const bookingTypes = loadData('bookingTypes', []);
    
    // 印刷用のHTMLを生成
    let printHTML = `
        <div class="print-header">
            <h1>予約一覧</h1>
        </div>
        <div class="print-date">
            作成日時: ${new Date().toLocaleString('ja-JP')}
        </div>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 2px solid #000;">
                    <th style="padding: 8px; text-align: left;">日時</th>
                    <th style="padding: 8px; text-align: left;">種類</th>
                    <th style="padding: 8px; text-align: left;">氏名</th>
                    <th style="padding: 8px; text-align: left;">連絡先</th>
                    <th style="padding: 8px; text-align: left;">備考</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const sortedBookings = [...bookings].sort((a, b) => 
        new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time)
    );
    
    sortedBookings.forEach(booking => {
        const type = bookingTypes.find(t => t.id === booking.type);
        printHTML += `
            <tr style="border-bottom: 1px solid #ccc;">
                <td style="padding: 8px;">${booking.date} ${booking.time}</td>
                <td style="padding: 8px;">${type ? type.name : booking.type}</td>
                <td style="padding: 8px;">${booking.name}</td>
                <td style="padding: 8px;">${booking.email}<br>${booking.phone}</td>
                <td style="padding: 8px;">${booking.notes || '-'}</td>
            </tr>
        `;
    });
    
    printHTML += '</tbody></table>';
    
    // 新しいウィンドウで印刷
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>予約一覧</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                .print-date { text-align: right; margin-bottom: 20px; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ccc; }
                th { background-color: #f5f5f5; font-weight: bold; }
            </style>
        </head>
        <body>
            ${printHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// =======================
// 9. イベントリスナー設定
// =======================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing system...');
    
    // データ初期化
    initializeData();
    
    // EmailJS初期化
    if (window.emailjs && EMAILJS_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY') {
        emailjs.init(EMAILJS_CONFIG.publicKey);
    }
    
    // 病院メッセージを読み込み
    const config = loadData('adminConfig', DEFAULT_CONFIG);
    const messageElement = document.getElementById('hospital-message');
    if (messageElement) {
        messageElement.textContent = config.hospitalMessage;
    }
    
    // 予約種類を読み込み
    loadBookingTypes();
    
    // 今日の日付をデフォルトに設定
    const today = new Date().toISOString().split('T')[0];
    const bookingDateInput = document.getElementById('booking-date');
    if (bookingDateInput) {
        bookingDateInput.value = today;
    }
    const calendarDateInput = document.getElementById('calendar-date');
    if (calendarDateInput) {
        calendarDateInput.value = today;
    }
    
    // =======================
    // メイン画面のイベントリスナー
    // =======================
    
    // 管理者ログインボタン
    const adminLoginBtn = document.getElementById('admin-login-btn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', function() {
            console.log('Admin login button clicked');
            showScreen('admin-login');
        });
    }
    
    // 戻るボタン
    const backToMainBtn = document.getElementById('back-to-main');
    if (backToMainBtn) {
        backToMainBtn.addEventListener('click', function() {
            showScreen('main');
        });
    }
    
    // 予約種類変更時
    const bookingTypeSelect = document.getElementById('booking-type');
    if (bookingTypeSelect) {
        bookingTypeSelect.addEventListener('change', displayTimeSlots);
    }
    
    // 予約日変更時
    if (bookingDateInput) {
        bookingDateInput.addEventListener('change', displayTimeSlots);
    }
    
    // 予約フォーム送信
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Booking form submitted');
            
            const formData = {
                name: document.getElementById('patient-name').value.trim(),
                email: document.getElementById('patient-email').value.trim(),
                phone: document.getElementById('patient-phone').value.trim(),
                type: document.getElementById('booking-type').value,
                date: document.getElementById('booking-date').value,
                time: selectedTimeSlot,
                notes: document.getElementById('patient-notes').value.trim()
            };
            
            console.log('Form data:', formData);
            
            // バリデーション
            if (!formData.name || !formData.email || !formData.phone || !formData.type || !formData.date || !formData.time) {
                showMessage('必須項目を全て入力してください', 'error');
                return;
            }
            
            // 重複チェック
            if (checkDuplicateBooking(formData.email, formData.type, formData.date)) {
                showMessage('同じ日に同じ種類の予約が既に存在します', 'error');
                return;
            }
            
            // 予約保存
            const booking = saveBooking(formData);
            console.log('Booking saved:', booking);
            
            // 確認メール送信
            sendConfirmationEmail(booking)
                .then(function(response) {
                    console.log('Email sent successfully');
                    showMessage('予約が完了しました。確認メールを送信しました。', 'success');
                    bookingForm.reset();
                    document.getElementById('time-slots').style.display = 'none';
                    selectedTimeSlot = null;
                })
                .catch(function(error) {
                    console.error('Email sending failed:', error);
                    showMessage('予約は完了しましたが、確認メールの送信に失敗しました。', 'warning');
                    bookingForm.reset();
                    document.getElementById('time-slots').style.display = 'none';
                    selectedTimeSlot = null;
                });
        });
    }
    
    // =======================
    // 管理者ログイン画面のイベントリスナー
    // =======================
    
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Admin login form submitted');
            
            const password = document.getElementById('admin-password').value;
            
            if (adminLogin(password)) {
                console.log('Admin login successful');
                isAdminLoggedIn = true;
                showScreen('admin');
                switchAdminTab('dashboard');
                document.getElementById('admin-password').value = '';
            } else {
                console.log('Admin login failed');
                showMessage('パスワードが正しくありません', 'error');
            }
        });
    }
    
    // =======================
    // 管理者画面のイベントリスナー
    // =======================
    
    // ログアウトボタン
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', function() {
            isAdminLoggedIn = false;
            showScreen('main');
        });
    }
    
    // タブ切り替え
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchAdminTab(tabName);
        });
    });
    
    // ソート変更
    const sortBySelect = document.getElementById('sort-by');
    if (sortBySelect) {
        sortBySelect.addEventListener('change', loadBookingsList);
    }
    
    // カレンダー日付変更
    if (calendarDateInput) {
        calendarDateInput.addEventListener('change', loadCalendarView);
    }
    
    // 印刷ボタン
    const printListBtn = document.getElementById('print-list');
    if (printListBtn) {
        printListBtn.addEventListener('click', printBookingsList);
    }
    
    // 予約種類追加ボタン
    const addTypeBtn = document.getElementById('add-type-btn');
    if (addTypeBtn) {
        addTypeBtn.addEventListener('click', addBookingType);
    }
    
    // パスワード変更フォーム
    const passwordChangeForm = document.getElementById('password-change-form');
    if (passwordChangeForm) {
        passwordChangeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newPassword = document.getElementById('new-password').value;
            if (newPassword.length < 4) {
                showMessage('パスワードは4文字以上で入力してください', 'error');
                return;
            }
            
            changeAdminPassword(newPassword);
            showMessage('パスワードを変更しました', 'success');
            document.getElementById('new-password').value = '';
        });
    }
    
    // 病院メッセージ更新フォーム
    const messageForm = document.getElementById('message-form');
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const message = document.getElementById('hospital-message-input').value;
            updateHospitalMessage(message);
            showMessage('メッセージを更新しました', 'success');
        });
    }
    
    // バックアップボタン
    const backupBtn = document.getElementById('backup-btn');
    if (backupBtn) {
        backupBtn.addEventListener('click', createBackup);
    }
    
    // 復元ボタン
    const restoreBtn = document.getElementById('restore-btn');
    if (restoreBtn) {
        restoreBtn.addEventListener('click', restoreFromBackup);
    }
    
    // =======================
    // モーダルのイベントリスナー
    // =======================
    
    // モーダル閉じるボタン
    const modalCloseBtn = document.getElementById('modal-close');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }
    
    // モーダル外クリックで閉じる
    const modal = document.getElementById('modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
    
    // モーダル内の閉じるボタン（動的に追加される要素用）
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-close')) {
            closeModal();
        }
    });
    
    console.log('System initialization completed');
});
