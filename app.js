// Firebase設定 - デモ用（実際のプロジェクトでは自分のFirebaseプロジェクトの設定に置き換えてください）
const firebaseConfig = {
  // デモ用設定 - 実際の使用時は適切な値に置き換えてください
  apiKey: "AIzaSyCdIKKQktfxR990-JXcnutnCtg_KTBgEGI",
  authDomain: "hospital-reservation-6b1fa.firebaseapp.com",
  projectId: "hospital-reservation-6b1fa",
  storageBucket: "hospital-reservation-6b1fa.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Firebase初期化（デモモードでは実際のFirebaseは使用せず、ローカルストレージで代用）
let useFirebase = false;
try {
  if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
    useFirebase = true;
  }
} catch (error) {
  console.log('Firebase未使用、ローカルストレージモードで動作します');
  useFirebase = false;
}

// ローカルストレージを使用したデータ管理
class LocalStorageDB {
  static get(collection, doc = null) {
    const key = doc ? `${collection}_${doc}` : collection;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  
  static set(collection, data, doc = null) {
    const key = doc ? `${collection}_${doc}` : collection;
    localStorage.setItem(key, JSON.stringify(data));
  }
  
  static getAll(collection) {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(collection + '_')) {
        const data = JSON.parse(localStorage.getItem(key));
        const id = key.replace(collection + '_', '');
        items.push({ id, ...data });
      }
    }
    return items;
  }
  
  static delete(collection, doc) {
    const key = `${collection}_${doc}`;
    localStorage.removeItem(key);
  }
}

// Vue.js アプリケーション
const { createApp } = Vue;

const ReservationSystem = {
  data() {
    return {
      // アプリケーション状態
      currentView: 'public', // 'public', 'admin-login', 'admin-dashboard'
      isLoggedIn: false,
      
      // 公開画面データ
      reservationTypes: [],
      selectedType: null,
      selectedDate: '',
      selectedTime: '',
      availableSlots: {},
      reservationForm: {
        name: '',
        email: '',
        phone: '',
        notes: ''
      },
      welcomeMessage: '当院の予約システムをご利用いただき、ありがとうございます。ご希望の予約種別と日時をお選びください。',
      
      // 管理画面データ
      activeAdminTab: 'types',
      adminPassword: '',
      loginError: '',
      reservations: [],
      settings: {
        welcomeMessage: '当院の予約システムをご利用いただき、ありがとうございます。ご希望の予約種別と日時をお選びください。',
        brevoApiKey: '',
        brevoSenderEmail: 'noreply@hospital.com',
        brevoSenderName: '○○病院',
        emailTemplate: '予約が完了しました。\n\n予約日時: {{date}} {{time}}\n予約種別: {{type}}\nお名前: {{name}}\n備考: {{notes}}\n\n何かご不明な点がございましたら、お電話にてお問い合わせください。',
        adminPassword: 'admin123'
      },
      
      // モーダル状態
      showModal: false,
      modalType: '',
      editingItem: null,
      
      // 新規予約種別フォーム
      newReservationType: {
        name: '',
        duration: 30,
        capacity: 5,
        startTime: '09:00',
        endTime: '17:00',
        workingDays: [1, 2, 3, 4, 5],
        acceptancePeriod: {
          start: '',
          end: ''
        }
      },
      
      // フィルター・ソート
      reservationFilter: {
        type: '',
        date: '',
        sortBy: 'date'
      },
      
      // Brevo連携状態
      brevoStatus: '未設定',
      
      // カレンダー
      calendar: null,
      
      // バックアップ
      backupData: null,
      
      // ローディング状態
      loading: false
    }
  },
  
  async mounted() {
    await this.loadInitialData();
  },
  
  methods: {
    // 初期データ読み込み
    async loadInitialData() {
      this.loading = true;
      try {
        // 設定読み込み
        let settingsData = LocalStorageDB.get('settings', 'main');
        if (settingsData) {
          this.settings = { ...this.settings, ...settingsData };
          this.welcomeMessage = this.settings.welcomeMessage;
        } else {
          // 初期設定を作成
          this.initializeDefaultSettings();
        }
        
        // 予約種別読み込み
        this.loadReservationTypes();
        
        // 予約データ読み込み
        this.loadReservations();
        
      } catch (error) {
        console.error('初期データ読み込み失敗:', error);
      }
      this.loading = false;
    },
    
    // デフォルト設定初期化
    initializeDefaultSettings() {
      const defaultSettings = {
        welcomeMessage: '当院の予約システムをご利用いただき、ありがとうございます。ご希望の予約種別と日時をお選びください。',
        brevoApiKey: '',
        brevoSenderEmail: 'noreply@hospital.com',
        brevoSenderName: '○○病院',
        emailTemplate: '予約が完了しました。\n\n予約日時: {{date}} {{time}}\n予約種別: {{type}}\nお名前: {{name}}\n備考: {{notes}}\n\n何かご不明な点がございましたら、お電話にてお問い合わせください。',
        adminPassword: 'admin123'
      };
      
      LocalStorageDB.set('settings', defaultSettings, 'main');
      
      // サンプル予約種別を作成
      const sampleTypes = [
        {
          name: '健康診断',
          duration: 30,
          capacity: 5,
          startTime: '09:00',
          endTime: '17:00',
          workingDays: [1, 2, 3, 4, 5],
          acceptancePeriod: {
            start: '2025-07-29',
            end: '2025-12-31'
          }
        },
        {
          name: '予防接種',
          duration: 15,
          capacity: 10,
          startTime: '09:00',
          endTime: '16:00',
          workingDays: [1, 2, 3, 4, 5, 6],
          acceptancePeriod: {
            start: '2025-07-29',
            end: '2025-12-31'
          }
        }
      ];
      
      sampleTypes.forEach((type, index) => {
        LocalStorageDB.set('reservationTypes', type, `type_${index + 1}`);
      });
      
      this.settings = defaultSettings;
    },
    
    // 予約種別読み込み
    loadReservationTypes() {
      this.reservationTypes = LocalStorageDB.getAll('reservationTypes');
    },
    
    // 予約データ読み込み
    loadReservations() {
      this.reservations = LocalStorageDB.getAll('reservations');
      // 日付・時間順にソート
      this.reservations.sort((a, b) => {
        const dateCompare = (a.date || '').localeCompare(b.date || '');
        if (dateCompare !== 0) return dateCompare;
        return (a.time || '').localeCompare(b.time || '');
      });
    },
    
    // 管理者ログイン画面表示
    showAdminLogin() {
      console.log('管理者ログイン画面を表示');
      this.currentView = 'admin-login';
      this.loginError = '';
      this.adminPassword = '';
    },
    
    // 管理者ログイン
    adminLogin() {
      console.log('ログイン試行:', this.adminPassword);
      if (this.adminPassword === this.settings.adminPassword) {
        this.isLoggedIn = true;
        this.currentView = 'admin-dashboard';
        this.loginError = '';
        this.adminPassword = '';
        console.log('ログイン成功');
      } else {
        this.loginError = 'パスワードが間違っています';
        console.log('ログイン失敗');
      }
    },
    
    // ログアウト
    logout() {
      this.isLoggedIn = false;
      this.currentView = 'public';
      this.adminPassword = '';
    },
    
    // 公開画面に戻る
    backToPublic() {
      this.currentView = 'public';
    },
    
    // 予約種別選択
    selectReservationType(type) {
      console.log('予約種別選択:', type);
      this.selectedType = type;
      this.selectedDate = '';
      this.selectedTime = '';
      this.availableSlots = {};
    },
    
    // 日付選択時の処理
    onDateSelect() {
      console.log('日付選択:', this.selectedDate);
      if (!this.selectedType || !this.selectedDate) return;
      this.loadAvailableSlots();
    },
    
    // 利用可能時間枠読み込み
    loadAvailableSlots() {
      console.log('時間枠読み込み開始');
      const date = new Date(this.selectedDate);
      const dayOfWeek = date.getDay();
      
      // 営業日チェック
      if (!this.selectedType.workingDays.includes(dayOfWeek)) {
        this.availableSlots = {};
        console.log('営業日ではありません');
        return;
      }
      
      // 予約受付期間チェック
      const startDate = new Date(this.selectedType.acceptancePeriod.start);
      const endDate = new Date(this.selectedType.acceptancePeriod.end);
      if (date < startDate || date > endDate) {
        this.availableSlots = {};
        console.log('受付期間外です');
        return;
      }
      
      // 時間枠生成
      const slots = this.generateTimeSlots();
      console.log('生成された時間枠:', slots);
      
      // 既存予約数を取得
      const existingReservations = this.reservations.filter(r => 
        r.type === this.selectedType.id && r.date === this.selectedDate
      );
      console.log('既存予約:', existingReservations);
      
      // 各時間枠の予約数を計算
      const slotCounts = {};
      existingReservations.forEach(reservation => {
        slotCounts[reservation.time] = (slotCounts[reservation.time] || 0) + 1;
      });
      
      // 利用可能枠データ作成
      this.availableSlots = {};
      slots.forEach(time => {
        const currentCount = slotCounts[time] || 0;
        this.availableSlots[time] = {
          current: currentCount,
          max: this.selectedType.capacity,
          available: currentCount < this.selectedType.capacity
        };
      });
      
      console.log('利用可能枠:', this.availableSlots);
    },
    
    // 時間枠生成
    generateTimeSlots() {
      const slots = [];
      const start = this.timeToMinutes(this.selectedType.startTime);
      const end = this.timeToMinutes(this.selectedType.endTime);
      const duration = this.selectedType.duration;
      
      for (let time = start; time < end; time += duration) {
        slots.push(this.minutesToTime(time));
      }
      
      return slots;
    },
    
    // 時間文字列を分に変換
    timeToMinutes(timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    },
    
    // 分を時間文字列に変換
    minutesToTime(minutes) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    },
    
    // 時間選択
    selectTime(time) {
      console.log('時間選択:', time);
      this.selectedTime = time;
    },
    
    // 予約送信
    async submitReservation() {
      try {
        // バリデーション
        if (!this.reservationForm.name || !this.reservationForm.email || !this.reservationForm.phone) {
          alert('必須項目を入力してください');
          return;
        }
        
        // 重複チェック
        const duplicateCheck = this.reservations.find(r =>
          r.email === this.reservationForm.email &&
          r.type === this.selectedType.id &&
          new Date(r.date) >= new Date()
        );
        
        if (duplicateCheck) {
          alert('同じ種別で既に予約済みです');
          return;
        }
        
        // 予約データ作成
        const reservationId = `res_${Date.now()}`;
        const reservationData = {
          name: this.reservationForm.name,
          email: this.reservationForm.email,
          phone: this.reservationForm.phone,
          type: this.selectedType.id,
          typeName: this.selectedType.name,
          date: this.selectedDate,
          time: this.selectedTime,
          notes: this.reservationForm.notes,
          createdAt: new Date().toISOString()
        };
        
        // ローカルストレージ保存
        LocalStorageDB.set('reservations', reservationData, reservationId);
        
        // メール送信（デモでは省略）
        this.sendConfirmationEmail(reservationData);
        
        // データ再読み込み
        this.loadReservations();
        
        // フォームリセット
        this.resetReservationForm();
        
        alert('予約が完了しました。');
        
      } catch (error) {
        console.error('予約エラー:', error);
        alert('予約処理中にエラーが発生しました');
      }
    },
    
    // 予約フォームリセット
    resetReservationForm() {
      this.reservationForm = {
        name: '',
        email: '',
        phone: '',
        notes: ''
      };
      this.selectedType = null;
      this.selectedDate = '';
      this.selectedTime = '';
      this.availableSlots = {};
    },
    
    // 確認メール送信（デモ用）
    sendConfirmationEmail(reservationData) {
      if (!this.settings.brevoApiKey) {
        console.log('メール送信をスキップ（APIキー未設定）');
        return;
      }
      
      try {
        const emailContent = this.settings.emailTemplate
          .replace('{{date}}', reservationData.date)
          .replace('{{time}}', reservationData.time)
          .replace('{{type}}', reservationData.typeName)
          .replace('{{name}}', reservationData.name)
          .replace('{{notes}}', reservationData.notes || 'なし');
        
        console.log('メール送信内容:', emailContent);
        // 実際のメール送信はここで行う
        
      } catch (error) {
        console.error('メール送信エラー:', error);
      }
    },
    
    // 管理画面タブ切り替え
    switchAdminTab(tabName) {
      this.activeAdminTab = tabName;
    },
    
    // モーダル表示
    showModalDialog(type, item = null) {
      this.modalType = type;
      this.editingItem = item;
      this.showModal = true;
      
      if (type === 'reservation-type') {
        if (item) {
          this.newReservationType = { ...item };
        } else {
          this.newReservationType = {
            name: '',
            duration: 30,
            capacity: 5,
            startTime: '09:00',
            endTime: '17:00',
            workingDays: [1, 2, 3, 4, 5],
            acceptancePeriod: {
              start: this.getTodayString(),
              end: '2025-12-31'
            }
          };
        }
      }
    },
    
    // モーダル閉じる
    closeModal() {
      this.showModal = false;
      this.modalType = '';
      this.editingItem = null;
    },
    
    // 予約種別保存
    saveReservationType() {
      try {
        if (this.editingItem) {
          // 更新
          LocalStorageDB.set('reservationTypes', this.newReservationType, this.editingItem.id);
        } else {
          // 新規作成
          const newId = `type_${Date.now()}`;
          LocalStorageDB.set('reservationTypes', this.newReservationType, newId);
        }
        
        this.loadReservationTypes();
        this.closeModal();
        
      } catch (error) {
        console.error('予約種別保存エラー:', error);
        alert('保存中にエラーが発生しました');
      }
    },
    
    // 予約種別削除
    deleteReservationType(id) {
      if (!confirm('この予約種別を削除してもよろしいですか？')) return;
      
      try {
        LocalStorageDB.delete('reservationTypes', id);
        this.loadReservationTypes();
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除中にエラーが発生しました');
      }
    },
    
    // 予約削除
    deleteReservation(id) {
      if (!confirm('この予約を削除してもよろしいですか？')) return;
      
      try {
        LocalStorageDB.delete('reservations', id);
        this.loadReservations();
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除中にエラーが発生しました');
      }
    },
    
    // 設定保存
    saveSettings() {
      try {
        LocalStorageDB.set('settings', this.settings, 'main');
        this.welcomeMessage = this.settings.welcomeMessage;
        alert('設定を保存しました');
      } catch (error) {
        console.error('設定保存エラー:', error);
        alert('設定保存中にエラーが発生しました');
      }
    },
    
    // Brevo接続テスト
    testBrevoConnection() {
      if (!this.settings.brevoApiKey) {
        alert('APIキーを入力してください');
        return;
      }
      
      try {
        // デモ用の簡単な接続テスト
        this.brevoStatus = '接続成功';
        alert('Brevoとの接続に成功しました（デモ）');
      } catch (error) {
        this.brevoStatus = '接続エラー';
        alert('接続テスト中にエラーが発生しました');
      }
    },
    
    // テストメール送信
    sendTestEmail() {
      const testEmail = prompt('テストメール送信先を入力してください:');
      if (!testEmail) return;
      
      try {
        alert('テストメールを送信しました（デモ）');
      } catch (error) {
        console.error('テストメール送信エラー:', error);
        alert('テストメール送信中にエラーが発生しました');
      }
    },
    
    // 印刷機能
    printReservations(typeId) {
      const typeData = this.reservationTypes.find(t => t.id === typeId);
      if (!typeData) return;
      
      const reservationsForType = this.reservations
        .filter(r => r.type === typeId)
        .sort((a, b) => {
          const dateCompare = (a.date || '').localeCompare(b.date || '');
          if (dateCompare !== 0) return dateCompare;
          return (a.time || '').localeCompare(b.time || '');
        });
      
      if (reservationsForType.length === 0) {
        alert('印刷する予約がありません。');
        return;
      }
      
      const printData = reservationsForType.map(r => ({
        '予約日': r.date,
        '時間': r.time,
        '氏名': r.name,
        '電話番号': r.phone,
        '備考': r.notes || ''
      }));
      
      const now = new Date();
      const printDate = `${now.getFullYear()}年${(now.getMonth() + 1).toString().padStart(2, '0')}月${now.getDate().toString().padStart(2, '0')}日 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Print.jsが利用できない場合の代替処理 
      if (typeof printJS === 'undefined') {
        const printContent = `${typeData.name} 予約一覧 (作成日時: ${printDate})\n\n` + 
          printData.map(item => 
            `${item['予約日']} ${item['時間']} - ${item['氏名']} (${item['電話番号']}) ${item['備考']}`
          ).join('\n');
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`<pre>${printContent}</pre>`);
        printWindow.print();
        printWindow.close();
      } else {
        printJS({
          printable: printData,
          properties: ['予約日', '時間', '氏名', '電話番号', '備考'],
          type: 'json',
          header: `${typeData.name} 予約一覧 (作成日時: ${printDate})`
        });
      }
    },
    
    // バックアップ作成
    createBackup() {
      try {
        const backup = {
          reservationTypes: LocalStorageDB.getAll('reservationTypes'),
          reservations: LocalStorageDB.getAll('reservations'),
          settings: this.settings,
          exportDate: new Date().toISOString()
        };
        
        // ダウンロード
        const blob = new Blob([JSON.stringify(backup, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hospital-reservation-backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
      } catch (error) {
        console.error('バックアップ作成エラー:', error);
        alert('バックアップ作成中にエラーが発生しました');
      }
    },
    
    // バックアップ復元
    handleBackupRestore(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          
          if (!confirm('現在のデータを置き換えてバックアップを復元しますか？\n※この操作は取り消せません')) {
            return;
          }
          
          // 既存データ削除
          const reservationTypesKeys = [];
          const reservationsKeys = [];
          
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('reservationTypes_')) {
              reservationTypesKeys.push(key);
            } else if (key && key.startsWith('reservations_')) {
              reservationsKeys.push(key);
            }
          }
          
          reservationTypesKeys.forEach(key => localStorage.removeItem(key));
          reservationsKeys.forEach(key => localStorage.removeItem(key));
          
          // バックアップデータ復元
          backupData.reservationTypes.forEach(type => {
            LocalStorageDB.set('reservationTypes', type, type.id);
          });
          
          backupData.reservations.forEach(reservation => {
            LocalStorageDB.set('reservations', reservation, reservation.id);
          });
          
          LocalStorageDB.set('settings', backupData.settings, 'main');
          
          // データ再読み込み
          this.loadInitialData();
          
          alert('バックアップの復元が完了しました');
          
        } catch (error) {
          console.error('バックアップ復元エラー:', error);
          alert('バックアップ復元中にエラーが発生しました');
        }
      };
      
      reader.readAsText(file);
      event.target.value = ''; // ファイル選択をリセット
    },
    
    // フィルタ適用済み予約リスト
    filteredReservations() {
      let filtered = [...this.reservations];
      
      if (this.reservationFilter.type) {
        filtered = filtered.filter(r => r.type === this.reservationFilter.type);
      }
      
      if (this.reservationFilter.date) {
        filtered = filtered.filter(r => r.date === this.reservationFilter.date);
      }
      
      // ソート
      filtered.sort((a, b) => {
        if (this.reservationFilter.sortBy === 'date') {
          const dateCompare = (a.date || '').localeCompare(b.date || '');
          if (dateCompare !== 0) return dateCompare;
          return (a.time || '').localeCompare(b.time || '');
        } else if (this.reservationFilter.sortBy === 'name') {
          return (a.name || '').localeCompare(b.name || '');
        } else if (this.reservationFilter.sortBy === 'type') {
          return (a.typeName || '').localeCompare(b.typeName || '');
        }
        return 0;
      });
      
      return filtered;
    },
    
    // 曜日名取得
    getDayName(dayNum) {
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      return days[dayNum];
    },
    
    // 今日の日付取得（YYYY-MM-DD形式）
    getTodayString() {
      const today = new Date();
      return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    }
  },
  
  computed: {
    // ビュー管理
    showPublicView() {
      return this.currentView === 'public';
    },
    showAdminLogin() {
      return this.currentView === 'admin-login';
    },
    showAdminDashboard() {
      return this.currentView === 'admin-dashboard' && this.isLoggedIn;
    }
  },
  
  template: `
    <div class="app-wrapper">
      <header>
        <div class="container flex justify-between items-center">
          <div class="brand">病院予約システム</div>
          <div>
            <button v-if="showPublicView" @click="showAdminLogin" class="btn btn--secondary">
              管理者ログイン
            </button>
            <button v-if="showAdminDashboard" @click="logout" class="btn btn--secondary">
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main class="container">
        <!-- ローディング表示 -->
        <div v-if="loading" class="card">
          <div class="card__body">
            <p>読み込み中...</p>
          </div>
        </div>

        <!-- 公開予約画面 -->
        <div v-else-if="showPublicView">
          <div class="card">
            <div class="card__body">
              <p>{{ welcomeMessage }}</p>
            </div>
          </div>

          <!-- 予約種別選択 -->
          <div class="card">
            <div class="card__body">
              <h3>予約種別を選択してください</h3>
              <div v-if="reservationTypes.length > 0" class="flex gap-8 mt-8" style="flex-wrap: wrap;">
                <button
                  v-for="type in reservationTypes"
                  :key="type.id"
                  @click="selectReservationType(type)"
                  :class="['btn', selectedType?.id === type.id ? 'btn--primary' : 'btn--outline']"
                >
                  {{ type.name }}
                </button>
              </div>
              <div v-else>
                <p class="status status--info">予約種別が設定されていません。管理者にお問い合わせください。</p>
              </div>
            </div>
          </div>

          <!-- 日時選択 -->
          <div v-if="selectedType" class="card">
            <div class="card__body">
              <h3>{{ selectedType.name }} の予約日時を選択</h3>
              
              <div class="form-group">
                <label class="form-label">予約日</label>
                <input
                  type="date"
                  v-model="selectedDate"
                  @change="onDateSelect"
                  :min="getTodayString()"
                  class="form-control"
                >
              </div>

              <div v-if="selectedDate && Object.keys(availableSlots).length > 0" class="mt-8">
                <label class="form-label">予約時間</label>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; margin-top: 8px;">
                  <button
                    v-for="(slot, time) in availableSlots"
                    :key="time"
                    @click="selectTime(time)"
                    :disabled="!slot.available"
                    :class="[
                      'btn',
                      selectedTime === time ? 'btn--primary' : 'btn--outline'
                    ]"
                    style="padding: 8px; font-size: 12px;"
                  >
                    {{ time }}<br>
                    <small>{{ slot.current }}/{{ slot.max }}</small>
                  </button>
                </div>
              </div>

              <div v-else-if="selectedDate && Object.keys(availableSlots).length === 0" class="mt-8">
                <p class="status status--warning">選択された日は予約を受け付けていません</p>
              </div>
            </div>
          </div>

          <!-- 予約者情報入力 -->
          <div v-if="selectedTime" class="card">
            <div class="card__body">
              <h3>予約者情報を入力してください</h3>
              
              <div class="form-group">
                <label class="form-label">お名前 *</label>
                <input type="text" v-model="reservationForm.name" class="form-control" required>
              </div>

              <div class="form-group">
                <label class="form-label">メールアドレス *</label>
                <input type="email" v-model="reservationForm.email" class="form-control" required>
              </div>

              <div class="form-group">
                <label class="form-label">電話番号 *</label>
                <input type="tel" v-model="reservationForm.phone" class="form-control" required>
              </div>

              <div class="form-group">
                <label class="form-label">備考・病院へのメッセージ</label>
                <textarea v-model="reservationForm.notes" class="form-control" rows="3"></textarea>
              </div>

              <div class="flex justify-between gap-8">
                <button @click="resetReservationForm" class="btn btn--outline">
                  リセット
                </button>
                <button @click="submitReservation" class="btn btn--primary">
                  予約を確定する
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 管理者ログイン画面 -->
        <div v-else-if="showAdminLogin">
          <div class="card" style="max-width: 400px; margin: 0 auto;">
            <div class="card__body">
              <h3>管理者ログイン</h3>
              
              <div class="form-group">
                <label class="form-label">パスワード</label>
                <input
                  type="password"
                  v-model="adminPassword"
                  @keyup.enter="adminLogin"
                  class="form-control"
                  placeholder="admin123"
                >
              </div>

              <div v-if="loginError" class="status status--error mb-8">
                {{ loginError }}
              </div>

              <div class="flex justify-between gap-8">
                <button @click="backToPublic" class="btn btn--outline">
                  戻る
                </button>
                <button @click="adminLogin" class="btn btn--primary">
                  ログイン
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 管理画面ダッシュボード -->
        <div v-else-if="showAdminDashboard">
          <!-- タブナビゲーション -->
          <div class="tabs">
            <div
              @click="switchAdminTab('types')"
              :class="['tab-btn', activeAdminTab === 'types' ? 'active' : '']"
            >
              予約種別管理
            </div>
            <div
              @click="switchAdminTab('reservations')"
              :class="['tab-btn', activeAdminTab === 'reservations' ? 'active' : '']"
            >
              予約管理
            </div>
            <div
              @click="switchAdminTab('email')"
              :class="['tab-btn', activeAdminTab === 'email' ? 'active' : '']"
            >
              メール設定
            </div>
            <div
              @click="switchAdminTab('messages')"
              :class="['tab-btn', activeAdminTab === 'messages' ? 'active' : '']"
            >
              案内メッセージ
            </div>
            <div
              @click="switchAdminTab('print')"
              :class="['tab-btn', activeAdminTab === 'print' ? 'active' : '']"
            >
              印刷
            </div>
            <div
              @click="switchAdminTab('backup')"
              :class="['tab-btn', activeAdminTab === 'backup' ? 'active' : '']"
            >
              バックアップ
            </div>
          </div>

          <!-- 予約種別管理タブ -->
          <div v-if="activeAdminTab === 'types'">
            <div class="flex justify-between items-center mb-8">
              <h3>予約種別管理</h3>
              <button @click="showModalDialog('reservation-type')" class="btn btn--primary">
                新規作成
              </button>
            </div>

            <div class="card">
              <div class="card__body">
                <table class="table" v-if="reservationTypes.length > 0">
                  <thead>
                    <tr>
                      <th>種別名</th>
                      <th>時間</th>
                      <th>定員</th>
                      <th>営業日</th>
                      <th>受付期間</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="type in reservationTypes" :key="type.id">
                      <td>{{ type.name }}</td>
                      <td>{{ type.duration }}分</td>
                      <td>{{ type.capacity }}名</td>
                      <td>{{ type.workingDays?.map(d => getDayName(d)).join(', ') }}</td>
                      <td>{{ type.acceptancePeriod?.start }} ～ {{ type.acceptancePeriod?.end }}</td>
                      <td>
                        <button @click="showModalDialog('reservation-type', type)" class="btn btn--sm btn--outline">
                          編集
                        </button>
                        <button @click="deleteReservationType(type.id)" class="btn btn--sm btn--outline" style="margin-left: 4px;">
                          削除
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p v-else>予約種別が登録されていません。</p>
              </div>
            </div>
          </div>

          <!-- 予約管理タブ -->
          <div v-if="activeAdminTab === 'reservations'">
            <h3>予約管理</h3>
            
            <!-- フィルター -->
            <div class="card">
              <div class="card__body">
                <div class="form-inline">
                  <div class="form-group">
                    <label class="form-label">予約種別</label>
                    <select v-model="reservationFilter.type" class="form-control">
                      <option value="">全種別</option>
                      <option v-for="type in reservationTypes" :key="type.id" :value="type.id">
                        {{ type.name }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">予約日</label>
                    <input type="date" v-model="reservationFilter.date" class="form-control">
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">ソート</label>
                    <select v-model="reservationFilter.sortBy" class="form-control">
                      <option value="date">日時順</option>
                      <option value="name">氏名順</option>
                      <option value="type">種別順</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card__body">
                <table class="table" v-if="filteredReservations().length > 0">
                  <thead>
                    <tr>
                      <th>予約日</th>
                      <th>時間</th>
                      <th>種別</th>
                      <th>氏名</th>
                      <th>電話番号</th>
                      <th>メール</th>
                      <th>備考</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="reservation in filteredReservations()" :key="reservation.id">
                      <td>{{ reservation.date }}</td>
                      <td>{{ reservation.time }}</td>
                      <td>{{ reservation.typeName }}</td>
                      <td>{{ reservation.name }}</td>
                      <td>{{ reservation.phone }}</td>
                      <td>{{ reservation.email }}</td>
                      <td>{{ reservation.notes || '-' }}</td>
                      <td>
                        <button @click="deleteReservation(reservation.id)" class="btn btn--sm btn--outline">
                          削除
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p v-else>予約がありません。</p>
              </div>
            </div>
          </div>

          <!-- メール設定タブ -->
          <div v-if="activeAdminTab === 'email'">
            <h3>メール設定 (Brevo)</h3>
            
            <div class="card">
              <div class="card__body">
                <div class="status" :class="brevoStatus === '接続成功' ? 'status--success' : brevoStatus === '接続失敗' ? 'status--error' : 'status--info'">
                  接続状況: {{ brevoStatus }}
                </div>
                
                <div class="form-group">
                  <label class="form-label">Brevo API キー</label>
                  <input type="password" v-model="settings.brevoApiKey" class="form-control">
                </div>

                <div class="form-group">
                  <label class="form-label">送信者メールアドレス</label>
                  <input type="email" v-model="settings.brevoSenderEmail" class="form-control">
                </div>

                <div class="form-group">
                  <label class="form-label">送信者名</label>
                  <input type="text" v-model="settings.brevoSenderName" class="form-control">
                </div>

                <div class="form-group">
                  <label class="form-label">メールテンプレート</label>
                  <textarea v-model="settings.emailTemplate" class="form-control" rows="8"></textarea>
                  <small>利用可能な変数: {{date}}, {{time}}, {{type}}, {{name}}, {{notes}}</small>
                </div>

                <div class="flex gap-8">
                  <button @click="testBrevoConnection" class="btn btn--outline">
                    接続テスト
                  </button>
                  <button @click="sendTestEmail" class="btn btn--outline">
                    テストメール送信
                  </button>
                  <button @click="saveSettings" class="btn btn--primary">
                    設定保存
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 案内メッセージタブ -->
          <div v-if="activeAdminTab === 'messages'">
            <h3>予約画面案内メッセージ</h3>
            
            <div class="card">
              <div class="card__body">
                <div class="form-group">
                  <label class="form-label">案内メッセージ</label>
                  <textarea v-model="settings.welcomeMessage" class="form-control" rows="4"></textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">管理者パスワード</label>
                  <input type="password" v-model="settings.adminPassword" class="form-control">
                </div>

                <button @click="saveSettings" class="btn btn--primary">
                  設定保存
                </button>
              </div>
            </div>
          </div>

          <!-- 印刷タブ -->
          <div v-if="activeAdminTab === 'print'">
            <h3>予約一覧印刷</h3>
            
            <div class="card">
              <div class="card__body">
                <p>種別ごとに予約一覧を印刷できます。予約日・時間の早い順で出力されます。</p>
                
                <div class="flex gap-8 flex-col" v-if="reservationTypes.length > 0">
                  <div v-for="type in reservationTypes" :key="type.id" class="flex justify-between items-center">
                    <span>{{ type.name }}</span>
                    <button @click="printReservations(type.id)" class="btn btn--outline">
                      印刷
                    </button>
                  </div>
                </div>
                <p v-else>予約種別がありません。</p>
              </div>
            </div>
          </div>

          <!-- バックアップタブ -->
          <div v-if="activeAdminTab === 'backup'">
            <h3>データバックアップ</h3>
            
            <div class="card">
              <div class="card__body">
                <h4>バックアップ作成</h4>
                <p>予約データと設定をJSONファイルとして保存します。</p>
                <button @click="createBackup" class="btn btn--primary">
                  バックアップを作成
                </button>
              </div>
            </div>

            <div class="card">
              <div class="card__body">
                <h4>バックアップ復元</h4>
                <p>保存済みのバックアップファイルからデータを復元します。</p>
                <p class="status status--warning">※現在のデータは全て置き換えられます</p>
                <input type="file" @change="handleBackupRestore" accept=".json" class="form-control">
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer>
        <div class="container">
          <p>&copy; 2025 病院予約システム - デモ版（LocalStorage使用）</p>
        </div>
      </footer>

      <!-- モーダル -->
      <div :class="['modal', showModal ? '' : 'hidden']">
        <div class="modal-card">
          <div class="modal-card__body">
            <div v-if="modalType === 'reservation-type'">
              <h4>{{ editingItem ? '予約種別編集' : '予約種別作成' }}</h4>
              
              <div class="form-group">
                <label class="form-label">種別名</label>
                <input type="text" v-model="newReservationType.name" class="form-control">
              </div>

              <div class="form-inline">
                <div class="form-group">
                  <label class="form-label">1コマ時間（分）</label>
                  <input type="number" v-model.number="newReservationType.duration" class="form-control" min="5" max="120">
                </div>
                
                <div class="form-group">
                  <label class="form-label">定員数</label>
                  <input type="number" v-model.number="newReservationType.capacity" class="form-control" min="1" max="50">
                </div>
              </div>

              <div class="form-inline">
                <div class="form-group">
                  <label class="form-label">開始時刻</label>
                  <input type="time" v-model="newReservationType.startTime" class="form-control">
                </div>
                
                <div class="form-group">
                  <label class="form-label">終了時刻</label>
                  <input type="time" v-model="newReservationType.endTime" class="form-control">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">営業曜日</label>
                <div class="flex gap-4" style="flex-wrap: wrap;">
                  <label v-for="(dayName, dayNum) in ['日', '月', '火', '水', '木', '金', '土']" :key="dayNum" class="flex items-center gap-4">
                    <input type="checkbox" :value="dayNum" v-model="newReservationType.workingDays">
                    {{ dayName }}
                  </label>
                </div>
              </div>

              <div class="form-inline">
                <div class="form-group">
                  <label class="form-label">受付開始日</label>
                  <input type="date" v-model="newReservationType.acceptancePeriod.start" class="form-control">
                </div>
                
                <div class="form-group">
                  <label class="form-label">受付終了日</label>
                  <input type="date" v-model="newReservationType.acceptancePeriod.end" class="form-control">
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-card__footer">
            <button @click="closeModal" class="btn btn--outline">
              キャンセル
            </button>
            <button v-if="modalType === 'reservation-type'" @click="saveReservationType" class="btn btn--primary">
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  `
};

// アプリケーション開始
createApp(ReservationSystem).mount('#app');
