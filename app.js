// Firebase設定 - 実際のプロジェクトでは自分のFirebaseプロジェクトの設定に置き換えてください
const firebaseConfig = {
  // 実際の使用時は適切な値に置き換えてください
  apiKey: "AIzaSyCdIKKQktfxR990-JXcnutnCtg_KTBgEGI",
  authDomain: "hospital-reservation.firebaseapp.com", 
  projectId: "hospital-reservation-6b1fa",
  storageBucket: "hospital-reservation.appspot.com",
  messagingSenderId: "918883221296",
  appId: "your-app-id"
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// DOMContentLoadedイベントで確実にVueアプリを初期化
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM読み込み完了');

  // Vue.js アプリケーション
  const { createApp } = Vue;

  const app = createApp({
    data() {
      return {
        // 現在の表示状態
        currentView: 'public', // 'public', 'login', 'admin'

        // 予約フォームデータ
        reservation: {
          name: '',
          email: '',
          phone: '',
          type: '',
          date: '',
          time: '',
          notes: ''
        },

        // 管理者認証
        adminPassword: '',
        loginError: '',
        isLoggedIn: false,

        // 管理画面
        adminTab: 'reservations',
        reservations: [],

        // システム設定
        defaultPassword: 'admin123'
      }
    },

    // マウント後の処理
    mounted() {
      console.log('Vue アプリケーションがマウントされました');
      this.loadReservations();

      // イベントリスナーの追加（動的要素対応）
      this.setupEventListeners();
    },

    methods: {
      // イベントリスナーの設定
      setupEventListeners() {
        console.log('イベントリスナーを設定中...');

        // 管理者ログインボタンのイベントリスナー（動的要素対応）
        document.addEventListener('click', (event) => {
          if (event.target.classList.contains('admin-login-btn')) {
            event.preventDefault();
            event.stopPropagation();
            console.log('管理者ログインボタンがクリックされました');
            this.showAdminLogin();
          }
        });
      },

      // 管理者ログイン画面を表示
      showAdminLogin() {
        console.log('管理者ログイン画面に切り替え');
        this.currentView = 'login';
        this.adminPassword = '';
        this.loginError = '';

        // DOM更新後にフォーカスを設定
        this.$nextTick(() => {
          const passwordInput = document.getElementById('password');
          if (passwordInput) {
            passwordInput.focus();
          }
        });
      },

      // 管理者ログイン処理
      adminLogin() {
        console.log('ログイン試行中...');

        if (!this.adminPassword) {
          this.loginError = 'パスワードを入力してください';
          return;
        }

        // パスワード検証（実際の本番環境では、より安全な認証方法を使用してください）
        if (this.adminPassword === this.defaultPassword) {
          console.log('ログイン成功');
          this.isLoggedIn = true;
          this.currentView = 'admin';
          this.loginError = '';
          this.adminPassword = '';

          // 予約データを再読み込み
          this.loadReservations();
        } else {
          console.log('ログイン失敗');
          this.loginError = 'パスワードが正しくありません';
          this.adminPassword = '';
        }
      },

      // 公開画面に戻る
      backToPublic() {
        console.log('公開画面に戻る');
        this.currentView = 'public';
        this.adminPassword = '';
        this.loginError = '';
      },

      // ログアウト
      logout() {
        console.log('ログアウト');
        this.isLoggedIn = false;
        this.currentView = 'public';
        this.adminTab = 'reservations';
      },

      // 予約申込処理
      async submitReservation() {
        console.log('予約申込処理開始');

        try {
          // バリデーション
          if (!this.validateReservation()) {
            return;
          }

          // 重複チェック
          const isDuplicate = await this.checkDuplicateReservation();
          if (isDuplicate) {
            alert('同じ種別で既に予約が存在します。病院にお電話でお問い合わせください。');
            return;
          }

          // Firestoreに保存
          const reservationData = {
            ...this.reservation,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'confirmed'
          };

          await db.collection('reservations').add(reservationData);

          console.log('予約が正常に保存されました');
          alert('予約申込が完了しました。確認メールを送信いたします。');

          // フォームリセット
          this.resetReservationForm();

          // メール送信（実装時にBrevo APIを使用）
          this.sendConfirmationEmail(reservationData);

        } catch (error) {
          console.error('予約申込エラー:', error);
          alert('申し訳ございません。予約申込中にエラーが発生しました。しばらく時間をおいて再度お試しください。');
        }
      },

      // 予約バリデーション
      validateReservation() {
        const required = ['name', 'email', 'phone', 'type', 'date', 'time'];

        for (const field of required) {
          if (!this.reservation[field]) {
            alert('必須項目を全て入力してください');
            return false;
          }
        }

        // メールアドレス形式チェック
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.reservation.email)) {
          alert('正しいメールアドレスを入力してください');
          return false;
        }

        return true;
      },

      // 重複予約チェック
      async checkDuplicateReservation() {
        try {
          const querySnapshot = await db.collection('reservations')
            .where('email', '==', this.reservation.email)
            .where('type', '==', this.reservation.type)
            .where('status', '==', 'confirmed')
            .get();

          return !querySnapshot.empty;
        } catch (error) {
          console.error('重複チェックエラー:', error);
          return false;
        }
      },

      // 予約フォームリセット
      resetReservationForm() {
        this.reservation = {
          name: '',
          email: '',
          phone: '',
          type: '',
          date: '',
          time: '',
          notes: ''
        };
      },

      // 確認メール送信（Brevo API使用）
      async sendConfirmationEmail(reservationData) {
        // 実際の実装時にBrevo APIキーと設定が必要
        console.log('確認メール送信:', reservationData);
        // TODO: Brevo API実装
      },

      // 予約データ読み込み
      async loadReservations() {
        try {
          console.log('予約データを読み込み中...');

          const querySnapshot = await db.collection('reservations')
            .orderBy('createdAt', 'desc')
            .get();

          this.reservations = [];
          querySnapshot.forEach((doc) => {
            this.reservations.push({
              id: doc.id,
              ...doc.data()
            });
          });

          console.log('予約データ読み込み完了:', this.reservations.length, '件');

        } catch (error) {
          console.error('予約データ読み込みエラー:', error);
        }
      },

      // 予約編集
      editReservation(reservation) {
        console.log('予約編集:', reservation);
        // TODO: 編集機能実装
        alert('編集機能は実装予定です');
      },

      // 予約削除
      async deleteReservation(reservationId) {
        if (!confirm('この予約を削除してもよろしいですか？')) {
          return;
        }

        try {
          await db.collection('reservations').doc(reservationId).delete();
          console.log('予約削除完了:', reservationId);

          // リストから削除
          this.reservations = this.reservations.filter(r => r.id !== reservationId);

          alert('予約を削除しました');

        } catch (error) {
          console.error('予約削除エラー:', error);
          alert('削除中にエラーが発生しました');
        }
      }
    }
  });

  // アプリケーションをマウント
  app.mount('#app');
  console.log('Vue アプリケーション初期化完了');
});

// エラーハンドリング
window.addEventListener('error', function(event) {
  console.error('JavaScript エラー:', event.error);
});

// 未処理のPromise拒否をキャッチ
window.addEventListener('unhandledrejection', function(event) {
  console.error('未処理のPromise拒否:', event.reason);
});
