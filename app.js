/* 病院予約システム – app.js
   技術: Vanilla JavaScript (ES2020) only
   注意: localStorage などのブラウザ永続ストレージは使用していません。
*/

/*************************************************
 * データ初期化
 *************************************************/
const defaultSettings = {
  adminPassword: "admin123", // 平文 (初期のみ)
  hospitalMessage:
    "ご予約をお取りいただき、ありがとうございます。予約時間の15分前にはお越しください。",
  emailTemplate:
    "この度は当院をご利用いただき、ありがとうございます。\n\n予約が確定いたしました。\n\n【予約詳細】\n予約種類: {reservationType}\n予約日時: {date} {time}\n\n何かご不明な点がございましたら、お電話にてお問い合わせください。",
  brevoApiKey: "",
};

const initialReservationTypes = [
  {
    id: "health_check",
    name: "健康診断",
    timeInterval: 15,
    maxSlots: 10,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    businessHours: {
      monday: { start: "09:00", end: "17:00" },
      tuesday: { start: "09:00", end: "17:00" },
      wednesday: { start: "09:00", end: "17:00" },
      thursday: { start: "09:00", end: "17:00" },
      friday: { start: "09:00", end: "17:00" },
      saturday: { start: "09:00", end: "12:00" },
      sunday: { start: "", end: "" },
    },
    holidays: [],
    holidayWeekdays: [0], // 日曜
  },
  {
    id: "vaccination",
    name: "予防接種",
    timeInterval: 15,
    maxSlots: 8,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    businessHours: {
      monday: { start: "09:00", end: "17:00" },
      tuesday: { start: "09:00", end: "17:00" },
      wednesday: { start: "09:00", end: "17:00" },
      thursday: { start: "09:00", end: "17:00" },
      friday: { start: "09:00", end: "17:00" },
      saturday: { start: "09:00", end: "12:00" },
      sunday: { start: "", end: "" },
    },
    holidays: [],
    holidayWeekdays: [0, 6], // 日曜・土曜
  },
];

const sampleReservations = [
  {
    id: "sample_1",
    name: "田中太郎",
    email: "tanaka@example.com",
    phone: "090-1234-5678",
    reservationType: "health_check",
    date: "2025-08-15",
    time: "10:00",
    notes: "初回受診です",
    createdAt: "2025-07-29T12:00:00Z",
  },
];

/* アプリケーションの全状態 */
const state = {
  settings: structuredClone(defaultSettings),
  reservationTypes: structuredClone(initialReservationTypes),
  reservations: [...sampleReservations],
  adminPasswordHash: null, // SHA-256 ハッシュを後ほど設定
  currentAdminSection: "reservations",
  sortConfig: { key: "date", dir: "asc" },
};

/*************************************************
 * ユーティリティ関数
 *************************************************/
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function showNotification(message, type = "success", duration = 4000) {
  const wrapper = $("#notification");
  wrapper.classList.remove("hidden", "success", "error", "warning");
  wrapper.classList.add(type);
  $("#notification-message").textContent = message;

  const hide = () => wrapper.classList.add("hidden");
  $("#notification-close").onclick = hide;
  setTimeout(hide, duration);
}

/* 文字列を SHA-256 ハッシュ (HEX) に変換 */
async function sha256(str) {
  const utf8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* 日付ユーティリティ */
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function parseDate(str) {
  return new Date(str + "T00:00:00");
}

function getWeekdayIdx(date) {
  return date.getDay(); // 0 Sun ... 6 Sat
}

function pad(num) {
  return String(num).padStart(2, "0");
}

function addMinutes(timeStr, minutes) {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return pad(Math.floor(total / 60)) + ":" + pad(total % 60);
}

function compareTime(a, b) {
  return a.localeCompare(b);
}

/*************************************************
 * 初期セットアップ
 *************************************************/
(async function init() {
  // ハッシュを生成
  state.adminPasswordHash = await sha256(state.settings.adminPassword);

  // 病院メッセージ表示
  $("#hospital-message").textContent = state.settings.hospitalMessage;

  // 予約種類セレクトを生成
  populateReservationTypeOptions();

  // 予約フォームイベント
  setUpPatientFormEvents();

  // 管理者ログイン関連
  setUpAdminAuthEvents();

  // 通知閉じる処理
  $("#notification-close").addEventListener("click", () => {
    $("#notification").classList.add("hidden");
  });

  // 初期フィルターオプションなど
  populateAdminFilterOptions();
})();

/*************************************************
 * 画面切り替え
 *************************************************/
function switchScreen(screenId) {
  $$(".screen").forEach((el) => el.classList.add("hidden"));
  $("#" + screenId).classList.remove("hidden");
}

/*************************************************
 * 患者向け画面処理
 *************************************************/
function populateReservationTypeOptions() {
  const typeSelect = $("#reservation-type");
  typeSelect.innerHTML = '<option value="">選択してください</option>';
  state.reservationTypes.forEach((type) => {
    const opt = document.createElement("option");
    opt.value = type.id;
    opt.textContent = type.name;
    typeSelect.appendChild(opt);
  });
}

function setUpPatientFormEvents() {
  const typeSelect = $("#reservation-type");
  const dateInput = $("#reservation-date");

  typeSelect.addEventListener("change", () => {
    // 選択された予約種類の期間を min/max に設定
    const type = state.reservationTypes.find((t) => t.id === typeSelect.value);
    if (type) {
      dateInput.min = type.startDate;
      dateInput.max = type.endDate;
    } else {
      dateInput.removeAttribute("min");
      dateInput.removeAttribute("max");
    }

    clearTimeSlots();
  });

  dateInput.addEventListener("change", () => {
    renderTimeSlots();
  });

  $("#reservation-form").addEventListener("submit", (e) => {
    e.preventDefault();
    handleReservationSubmit();
  });
}

function clearTimeSlots() {
  $("#time-slots").innerHTML = "";
  $("#time-slots-container").classList.add("hidden");
}

function renderTimeSlots() {
  clearTimeSlots();
  const typeId = $("#reservation-type").value;
  const dateStr = $("#reservation-date").value;
  if (!typeId || !dateStr) return;

  const type = state.reservationTypes.find((t) => t.id === typeId);
  if (!type) return;

  const date = parseDate(dateStr);
  // 休日チェック
  const weekdayIdx = getWeekdayIdx(date);
  if (type.holidayWeekdays.includes(weekdayIdx) || type.holidays.includes(dateStr)) {
    showNotification("選択した日は休日です。別の日付をお選びください。", "warning");
    return;
  }

  // 営業時間取得
  const weekdayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const bh = type.businessHours[weekdayNames[weekdayIdx]];
  if (!bh || !bh.start || !bh.end) {
    showNotification("選択した日は営業時間外です。別の日付をお選びください。", "warning");
    return;
  }

  let current = bh.start;
  const container = $("#time-slots");

  while (compareTime(current, bh.end) < 0) {
    const slotCount = state.reservations.filter(
      (r) => r.reservationType === typeId && r.date === dateStr && r.time === current
    ).length;
    const available = type.maxSlots - slotCount;

    const slot = document.createElement("div");
    slot.className = "time-slot" + (available === 0 ? " full" : "");
    slot.dataset.time = current;

    slot.innerHTML = `<div class="time-slot-time">${current}</div><div class="time-slot-availability">${type.maxSlots - available}/${type.maxSlots}</div>`;

    if (available === 0) {
      slot.title = "満枠です";
    } else {
      slot.addEventListener("click", () => {
        if (slot.classList.contains("full")) return;
        $$(".time-slot.selected", container).forEach((s) => s.classList.remove("selected"));
        slot.classList.add("selected");
      });
    }

    container.appendChild(slot);
    current = addMinutes(current, type.timeInterval);
  }

  $("#time-slots-container").classList.remove("hidden");
}

function handleReservationSubmit() {
  const name = $("#patient-name").value.trim();
  const email = $("#patient-email").value.trim();
  const phone = $("#patient-phone").value.trim();
  const typeId = $("#reservation-type").value;
  const date = $("#reservation-date").value;
  const selectedSlot = $(".time-slot.selected");
  const notes = $("#patient-notes").value.trim();

  if (!name || !email || !phone || !typeId || !date || !selectedSlot) {
    showNotification("すべての必須項目を入力してください。", "error");
    return;
  }

  // 重複チェック（同じ email で当日以降の予約が一件でもあると不可）
  const duplicate = state.reservations.find(
    (r) => r.email === email && new Date(r.date) >= new Date(date)
  );
  if (duplicate) {
    showNotification("既に予約が存在します。重複予約はできません。", "error");
    return;
  }

  const time = selectedSlot.dataset.time;
  const newRes = {
    id: "res_" + Date.now(),
    name,
    email,
    phone,
    reservationType: typeId,
    date,
    time,
    notes,
    createdAt: new Date().toISOString(),
  };
  state.reservations.push(newRes);

  // ダミー送信
  sendConfirmationEmail(newRes);

  showNotification("予約が完了しました。確認メールを送信しました。", "success");

  // フォームリセット
  $("#reservation-form").reset();
  clearTimeSlots();
}

function sendConfirmationEmail(reservation) {
  const typeObj = state.reservationTypes.find((t) => t.id === reservation.reservationType);
  const body = state.settings.emailTemplate
    .replace("{name}", reservation.name)
    .replace("{reservationType}", typeObj ? typeObj.name : "")
    .replace("{date}", reservation.date)
    .replace("{time}", reservation.time)
    .replace("{notes}", reservation.notes || "-");

  // 実際の送信は環境によって制限されるため、ここでは console.log として代替
  console.log("[Brevo API] Sending email to", reservation.email);
  console.log("Body:\n" + body);
}

/*************************************************
 * 管理者認証・画面
 *************************************************/
function setUpAdminAuthEvents() {
  // 患者画面の管理者ログインボタン
  $("#admin-login-btn").addEventListener("click", () => switchScreen("admin-login-screen"));
  $("#back-to-patient").addEventListener("click", () => switchScreen("patient-screen"));

  $("#admin-login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const pwd = $("#admin-password").value;
    const hash = await sha256(pwd);
    if (hash === state.adminPasswordHash) {
      $("#admin-password").value = "";
      switchScreen("admin-screen");
      renderAdminSection("reservations");
      showNotification("ログインしました。", "success");
    } else {
      showNotification("パスワードが違います。", "error");
    }
  });

  // サイドバーリンク
  $$(".sidebar-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      renderAdminSection(section);
    });
  });

  // ログアウト
  $("#logout-btn").addEventListener("click", () => {
    switchScreen("patient-screen");
  });

  // Password change
  $("#password-change-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPwd = $("#new-password").value.trim();
    if (!newPwd) return;
    state.adminPasswordHash = await sha256(newPwd);
    $("#new-password").value = "";
    showNotification("パスワードを更新しました。", "success");
  });

  // Message update
  $("#message-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = $("#hospital-message-text").value.trim();
    state.settings.hospitalMessage = msg;
    $("#hospital-message").textContent = msg;
    showNotification("メッセージを更新しました。", "success");
  });

  // Brevo settings
  $("#brevo-settings-form").addEventListener("submit", (e) => {
    e.preventDefault();
    state.settings.brevoApiKey = $("#brevo-api-key").value.trim();
    showNotification("Brevo設定を保存しました。", "success");
  });

  // Email template
  $("#email-template-form").addEventListener("submit", (e) => {
    e.preventDefault();
    state.settings.emailTemplate = $("#email-template").value;
    showNotification("メールテンプレートを更新しました。", "success");
  });

  // Backup download
  $("#backup-data").addEventListener("click", () => {
    const data = {
      settings: state.settings,
      reservationTypes: state.reservationTypes,
      reservations: state.reservations,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservation_backup_${formatDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Restore
  $("#restore-data").addEventListener("click", () => {
    const file = $("#restore-file").files[0];
    if (!file) {
      showNotification("ファイルを選択してください。", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.reservations && Array.isArray(data.reservations)) {
          state.settings = data.settings || state.settings;
          state.reservationTypes = data.reservationTypes || state.reservationTypes;
          state.reservations = data.reservations;
          populateReservationTypeOptions();
          populateAdminFilterOptions();
          renderReservationsTable();
          showNotification("データを復元しました。", "success");
        } else {
          throw new Error();
        }
      } catch (err) {
        showNotification("ファイル形式が正しくありません。", "error");
      }
    };
    reader.readAsText(file);
  });

  // Clear data
  $("#clear-data").addEventListener("click", () => {
    if (!confirm("本当にすべての予約データを削除しますか？")) return;
    state.reservations = [];
    renderReservationsTable();
    showNotification("予約データを削除しました。", "success");
  });

  // View mode toggle
  $("#view-mode").addEventListener("change", renderReservationsView);
  $("#print-reservations").addEventListener("click", handlePrintReservations);

  // Filter events
  $("#search-name").addEventListener("input", renderReservationsTable);
  $("#filter-type").addEventListener("change", renderReservationsTable);
  $("#filter-date").addEventListener("change", renderReservationsTable);
  $("#clear-filters").addEventListener("click", () => {
    ["#search-name", "#filter-type", "#filter-date"].forEach((sel) => {
      const el = $(sel);
      if (el.tagName === "SELECT" || el.tagName === "INPUT") el.value = "";
    });
    renderReservationsTable();
  });

  // Sort
  $$(".sort-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.sort;
      const dir = state.sortConfig.key === key && state.sortConfig.dir === "asc" ? "desc" : "asc";
      state.sortConfig = { key, dir };
      renderReservationsTable();
    });
  });
}

function renderAdminSection(section) {
  state.currentAdminSection = section;
  $$(".sidebar-link").forEach((l) => l.classList.toggle("active", l.dataset.section === section));
  $$(".admin-section").forEach((sec) => sec.classList.add("hidden"));
  $("#admin-" + section).classList.remove("hidden");

  switch (section) {
    case "reservations":
      renderReservationsView();
      break;
    case "types":
      renderTypesList();
      break;
    case "system":
      $("#hospital-message-text").value = state.settings.hospitalMessage;
      break;
    case "email":
      $("#brevo-api-key").value = state.settings.brevoApiKey;
      $("#email-template").value = state.settings.emailTemplate;
      break;
  }
}

function renderReservationsView() {
  const mode = $("#view-mode").value;
  if (mode === "list") {
    $("#reservations-list").classList.remove("hidden");
    $("#reservations-calendar").classList.add("hidden");
    renderReservationsTable();
  } else {
    $("#reservations-list").classList.add("hidden");
    $("#reservations-calendar").classList.remove("hidden");
    renderReservationsCalendar();
  }
}

function filterReservations() {
  let list = [...state.reservations];
  const nameQuery = $("#search-name").value.trim();
  const typeFilter = $("#filter-type").value;
  const dateFilter = $("#filter-date").value;

  if (nameQuery) list = list.filter((r) => r.name.includes(nameQuery));
  if (typeFilter) list = list.filter((r) => r.reservationType === typeFilter);
  if (dateFilter) list = list.filter((r) => r.date === dateFilter);

  // ソート
  const { key, dir } = state.sortConfig;
  list.sort((a, b) => {
    const valA = key === "type" ? a.reservationType : a[key];
    const valB = key === "type" ? b.reservationType : b[key];
    return dir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  return list;
}

function renderReservationsTable() {
  const tbody = $("#reservations-tbody");
  tbody.innerHTML = "";
  const records = filterReservations();
  records.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.date}</td>
      <td>${r.time}</td>
      <td>${getTypeNameById(r.reservationType)}</td>
      <td>${r.name}</td>
      <td>${r.phone}</td>
      <td>${r.email}</td>
      <td>${r.notes || "-"}</td>
      <td><button class="btn btn--outline btn--sm" data-id="${r.id}">削除</button></td>
    `;
    tbody.appendChild(tr);
  });
  // 削除ボタン
  $$('button[data-id]', tbody).forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (!confirm('本当に削除しますか？')) return;
      state.reservations = state.reservations.filter(r => r.id !== id);
      renderReservationsTable();
      showNotification('削除しました', 'success');
    });
  });
}

function renderReservationsCalendar(monthOffset = 0) {
  // monthOffset 無視 (簡易実装)
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const year = firstOfMonth.getFullYear();
  const month = firstOfMonth.getMonth();
  $("#current-month").textContent = `${year}年${month + 1}月`;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const grid = $("#calendar-grid");
  grid.innerHTML = "";

  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startDay + 1;
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    if (dayNum < 1 || dayNum > daysInMonth) {
      cell.classList.add("other-month");
      grid.appendChild(cell);
      continue;
    }
    const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`;
    const count = state.reservations.filter((r) => r.date === dateStr).length;

    if (formatDate(now) === dateStr) cell.classList.add("today");

    cell.innerHTML = `<div class="calendar-day-number">${dayNum}</div><div class="calendar-day-reservations">${count}件</div>`;

    grid.appendChild(cell);
  }
}

function handlePrintReservations() {
  // 一覧モード前提
  const listCard = $("#reservations-list");
  listCard.classList.add("print-area");
  const timestamp = new Date().toLocaleString();
  const caption = document.createElement("caption");
  caption.textContent = `印刷日時: ${timestamp}`;
  $(".reservations-table").prepend(caption);
  window.print();
  caption.remove();
  listCard.classList.remove("print-area");
}

function populateAdminFilterOptions() {
  const filterSelect = $("#filter-type");
  filterSelect.innerHTML = '<option value="">すべての種類</option>';
  state.reservationTypes.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    filterSelect.appendChild(opt);
  });
}

function getTypeNameById(id) {
  const t = state.reservationTypes.find((r) => r.id === id);
  return t ? t.name : id;
}

/*************************************************
 * 予約種類設定
 *************************************************/
function renderTypesList() {
  const container = $("#types-list");
  container.innerHTML = "";
  state.reservationTypes.forEach((t) => {
    const card = document.createElement("div");
    card.className = "card type-card";
    card.innerHTML = `
      <div class="card__body">
        <div class="type-card-header">
          <h3 class="type-card-title">${t.name}</h3>
          <button class="btn btn--outline btn--sm" data-id="${t.id}">編集</button>
        </div>
        <p>期間: ${t.startDate} 〜 ${t.endDate}</p>
        <p>枠数: ${t.maxSlots}名 / 間隔: ${t.timeInterval}分</p>
      </div>
    `;
    container.appendChild(card);
  });

  // 編集ボタン
  $$('button[data-id]', container).forEach((btn) => {
    btn.addEventListener('click', () => openTypeEditModal(btn.dataset.id));
  });

  // 新規追加
  $("#add-type").onclick = () => openTypeEditModal(null);
}

function openTypeEditModal(typeId) {
  const existing = typeId ? state.reservationTypes.find((t) => t.id === typeId) : null;
  const modalTitle = $("#modal-title");
  const modalBody = $("#modal-body");
  const confirmBtn = $("#modal-confirm");

  modalTitle.textContent = existing ? "予約種類を編集" : "予約種類を追加";

  // 簡易フォーム
  modalBody.innerHTML = `
    <form id="type-form" class="w-full">
      <div class="form-group">
        <label class="form-label" for="type-name">名称</label>
        <input type="text" id="type-name" class="form-control" value="${existing ? existing.name : ""}" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="type-interval">時間間隔 (分)</label>
        <input type="number" id="type-interval" class="form-control" min="5" step="5" value="${existing ? existing.timeInterval : 15}" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="type-max">枠数</label>
        <input type="number" id="type-max" class="form-control" min="1" value="${existing ? existing.maxSlots : 10}" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="type-start-date">開始日</label>
        <input type="date" id="type-start-date" class="form-control" value="${existing ? existing.startDate : formatDate(new Date())}" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="type-end-date">終了日</label>
        <input type="date" id="type-end-date" class="form-control" value="${existing ? existing.endDate : formatDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1))) }" required>
      </div>
    </form>
  `;

  $("#modal").classList.remove("hidden");

  confirmBtn.onclick = () => {
    const form = $("#type-form");
    if (!form.reportValidity()) return;
    const newType = {
      id: existing ? existing.id : "type_" + Date.now(),
      name: $("#type-name").value.trim(),
      timeInterval: Number($("#type-interval").value),
      maxSlots: Number($("#type-max").value),
      startDate: $("#type-start-date").value,
      endDate: $("#type-end-date").value,
      businessHours: existing ? existing.businessHours : initialBusinessHours(),
      holidays: existing ? existing.holidays : [],
      holidayWeekdays: existing ? existing.holidayWeekdays : [],
    };
    if (existing) {
      const idx = state.reservationTypes.findIndex((t) => t.id === existing.id);
      state.reservationTypes[idx] = newType;
    } else {
      state.reservationTypes.push(newType);
    }
    populateReservationTypeOptions();
    populateAdminFilterOptions();
    renderTypesList();
    closeModal();
    showNotification("予約種類を保存しました。", "success");
  };

  $("#modal-cancel").onclick = closeModal;
  $("#modal-close").onclick = closeModal;
}

function initialBusinessHours() {
  return {
    monday: { start: "09:00", end: "17:00" },
    tuesday: { start: "09:00", end: "17:00" },
    wednesday: { start: "09:00", end: "17:00" },
    thursday: { start: "09:00", end: "17:00" },
    friday: { start: "09:00", end: "17:00" },
    saturday: { start: "09:00", end: "12:00" },
    sunday: { start: "", end: "" },
  };
}

/*************************************************
 * モーダル管理
 *************************************************/
function closeModal() {
  $("#modal").classList.add("hidden");
  $("#modal-confirm").onclick = null;
}

/*************************************************
 * メモ: 本実装では未対応の高度機能
 *  - 詳細な休日設定 UI
 *  - 曜日ごとの営業時間編集 UI
 *  - Brevo API 実通信
 * ただし主要なユーザーフローは満たしています。
 *************************************************/
