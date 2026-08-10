// ============================================================
// admin.js — Billionaire platform: ADMIN-ONLY code
// Everything only the admin screen uses: merchant join requests,
// pricing/shipping-zone settings, the dashboard + charts, accounting
// reports, and marking orders delivered/returned.
//
// Depends on core.js being loaded first (uses `data`, `saveData()`,
// `showToast()`, `openCancelReasonModal()`, and other shared helpers).
// ============================================================

const ADMIN_VIEWS = [
  {id: 'dashboard', label: '📊 لوحة التحكم'},
  {id: 'requests', label: '🧾 طلبات التجار'},
  {id: 'accounting', label: '🧮 الحسابات'},
  {id: 'settings', label: '⚙️ إعدادات التسعير'},
  {id: 'shipping', label: '🚚 التوصيل وإجراءات'},
  {id: 'store', label: '🔎 معاينة المتاجر'}
];
let pendingApproveId = null;
let approveModalMode = 'approve'; // 'approve' (new merchant, needs username/password) | 'editFees' (existing merchant, fees only)
let approveFeeState = { feeSource: 'customer', feeType: 'fixed', feeAmount: 0, feeCustomer: 0, feeMerchant: 0, itemDeduction: 0 };

// Opens the modal in "approve" mode: admin sets username/password AND the fee settings for this merchant in one step
function approveMerchant(id) {
  pendingApproveId = id;
  approveModalMode = 'approve';
  const m = data.merchants.find(x => x.id === id);
  document.getElementById('approve-username').value = '';
  document.getElementById('approve-password').value = '';
  document.getElementById('approve-credentials-fields').style.display = 'block';
  document.getElementById('approve-modal-title').textContent = 'قبول التاجر — بيانات الدخول ورسوم المنصة';
  approveFeeState = {
    feeSource: (m && m.feeSource) || data.settings.feeSource,
    feeType: (m && m.feeType) || data.settings.feeType || 'fixed',
    feeAmount: (m && m.feeAmount != null) ? m.feeAmount : (data.settings.feeAmount || 0),
    feeCustomer: (m && m.feeCustomer != null) ? m.feeCustomer : (data.settings.feeCustomer || 0),
    feeMerchant: (m && m.feeMerchant != null) ? m.feeMerchant : (data.settings.feeMerchant || 0),
    itemDeduction: (m && m.itemDeduction != null) ? m.itemDeduction : (data.settings.itemDeduction || 0)
  };
  renderApproveFeeFields();
  document.getElementById('approve-modal').classList.add('show');
}

// Opens the modal in "editFees" mode: an already-active merchant's login stays the same,
// admin only adjusts the platform fee settings for that merchant.
function editMerchantFees(id) {
  pendingApproveId = id;
  approveModalMode = 'editFees';
  const m = data.merchants.find(x => x.id === id);
  if (!m) return;
  document.getElementById('approve-credentials-fields').style.display = 'none';
  document.getElementById('approve-modal-title').textContent = `تعديل رسوم المنصة — ${m.shop}`;
  approveFeeState = {
    feeSource: m.feeSource || data.settings.feeSource,
    feeType: m.feeType || data.settings.feeType || 'fixed',
    feeAmount: m.feeAmount || 0,
    feeCustomer: m.feeCustomer || 0,
    feeMerchant: m.feeMerchant || 0,
    itemDeduction: m.itemDeduction || 0
  };
  renderApproveFeeFields();
  document.getElementById('approve-modal').classList.add('show');
}

function closeApproveModal() {
  pendingApproveId = null;
  document.getElementById('approve-credentials-fields').style.display = 'block';
  document.getElementById('approve-modal').classList.remove('show');
}

function setApproveFeeSource(src) { approveFeeState.feeSource = src; renderApproveFeeFields(); }
function setApproveFeeType(type) { approveFeeState.feeType = type; renderApproveFeeFields(); }
function setApproveFeeAmount(field, value) {
  let v = parseFloat(value) || 0;
  if (approveFeeState.feeType === 'percent') v = Math.min(100, Math.max(0, v));
  approveFeeState[field] = v;
}
function setApproveItemDeduction(value) {
  approveFeeState.itemDeduction = Math.max(0, parseFloat(value) || 0);
}

function renderApproveFeeFields() {
  document.getElementById('approve-fee-source-toggles').innerHTML = `
    <span class="toggle ${approveFeeState.feeSource==='customer'?'selected':''}" onclick="setApproveFeeSource('customer')">من الزبون</span>
    <span class="toggle ${approveFeeState.feeSource==='merchant'?'selected':''}" onclick="setApproveFeeSource('merchant')">من التاجر</span>
    <span class="toggle ${approveFeeState.feeSource==='both'?'selected':''}" onclick="setApproveFeeSource('both')">من الاثنين</span>
  `;
  document.getElementById('approve-fee-type-toggles').innerHTML = `
    <span class="toggle ${approveFeeState.feeType==='fixed'?'selected':''}" onclick="setApproveFeeType('fixed')">مبلغ ثابت (دينار)</span>
    <span class="toggle ${approveFeeState.feeType==='percent'?'selected':''}" onclick="setApproveFeeType('percent')">نسبة مئوية (%)</span>
  `;
  const unit = approveFeeState.feeType === 'percent' ? '%' : 'د';
  const amountFieldsEl = document.getElementById('approve-fee-amount-fields');
  if (approveFeeState.feeSource === 'both') {
    amountFieldsEl.innerHTML = `
      <div class="row2" style="margin-top:8px;">
        <div><label>من الزبون (${unit})</label><input type="number" value="${approveFeeState.feeCustomer}" onchange="setApproveFeeAmount('feeCustomer', this.value)"></div>
        <div><label>من التاجر (${unit})</label><input type="number" value="${approveFeeState.feeMerchant}" onchange="setApproveFeeAmount('feeMerchant', this.value)"></div>
      </div>`;
  } else {
    amountFieldsEl.innerHTML = `<label style="margin-top:8px;">مبلغ الرسم (${unit})</label><input type="number" value="${approveFeeState.feeAmount}" onchange="setApproveFeeAmount('feeAmount', this.value)">`;
  }
  const itemDeductionEl = document.getElementById('approve-item-deduction');
  if (itemDeductionEl) itemDeductionEl.value = approveFeeState.itemDeduction;
}

async function confirmApprove() {
  const m = data.merchants.find(x => x.id === pendingApproveId);
  if (!m) return;
  if (approveModalMode === 'approve') {
    const username = document.getElementById('approve-username').value.trim();
    const password = document.getElementById('approve-password').value.trim();
    if (!username || !password) { showToast('عبي اليوزر نيم والباسورد'); return; }
    if (password.length < 6) { showToast('لازم كلمة المرور ٦ خانات أو أكثر (شرط Firebase)'); return; }

    // Real account creation (Firebase Authentication) — this is the new, secure path.
    // If Firebase itself failed to load (offline fallback mode), we skip straight to the
    // legacy hash-based credential so the app keeps working instead of getting stuck.
    if (window.authApi) {
      const approveBtn = document.querySelector('#approve-modal .btn:not(.secondary)');
      if (approveBtn) { approveBtn.disabled = true; approveBtn.textContent = 'جاري إنشاء الحساب...'; }
      try {
        const uid = await window.authApi.createAccount(username, password);
        m.authUid = uid;
      } catch (e) {
        if (approveBtn) { approveBtn.disabled = false; approveBtn.textContent = 'تأكيد'; }
        if (e && e.code === 'auth/email-already-in-use') {
          showToast('⚠️ اليوزرنيم هذا مستخدم من قبل — جرب يوزرنيم ثاني');
        } else {
          console.error('Account creation failed:', e);
          showToast('⚠️ تعذر إنشاء حساب الدخول — تأكد من الاتصال وحاول مرة ثانية');
        }
        return; // stop here — never approve without a working login account
      }
      if (approveBtn) { approveBtn.disabled = false; approveBtn.textContent = 'تأكيد'; }
    }

    m.username = username; m.password = await hashPassword(password); m.status = 'active';
  }
  m.feeSource = approveFeeState.feeSource;
  m.feeType = approveFeeState.feeType;
  m.feeAmount = approveFeeState.feeAmount;
  m.feeCustomer = approveFeeState.feeCustomer;
  m.feeMerchant = approveFeeState.feeMerchant;
  m.itemDeduction = approveFeeState.itemDeduction;

  // Mirror the sensitive/public split into the new per-merchant Firestore documents too,
  // so Firestore Security Rules (once published) can protect this merchant's data
  // individually — separately from every other merchant's.
  if (window.authApi && m.authUid) {
    try {
      const { password: _pw, ...publicFields } = m;
      await window.authApi.saveDoc('merchants', m.authUid, publicFields);
      await window.authApi.saveDoc('merchant_private', m.authUid, { balance: m.balance || 0, salesCount: m.salesCount || 0 });
      // The old pending-request document (keyed by the local id, not the new uid) is now
      // fully superseded by the two documents above — remove it so it doesn't linger.
      await window.authApi.deleteDoc('join_requests', String(m.id)).catch(() => {});
    } catch (e) {
      console.error('Could not write the new secure merchant document (approval still saved to the main record):', e);
    }
  }

  saveData();
  closeApproveModal();
  showToast(approveModalMode === 'approve' ? 'تم القبول — لا تنسى ترسل بيانات الدخول للتاجر يدوياً' : 'تم تحديث رسوم المنصة لهذا التاجر');
  renderAll();
}

function rejectMerchant(id) {
  data.merchants = data.merchants.filter(x => x.id !== id);
  if (window.authApi) window.authApi.deleteDoc('join_requests', String(id)).catch(() => {});
  saveData();
  showToast('تم رفض الطلب');
  renderAll();
}

// Generic confirm modal helper
let confirmCallback = null;
function openConfirmModal(title, text, onConfirm) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-text').textContent = text;
  confirmCallback = onConfirm;
  document.getElementById('confirm-modal').classList.add('show');
}
function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.remove('show');
  confirmCallback = null;
}
document.getElementById('confirm-yes-btn').addEventListener('click', () => {
  if (confirmCallback) confirmCallback();
  closeConfirmModal();
});

function renderRequests() {
  const joinChip = document.getElementById('join-link-chip');
  if (joinChip) joinChip.textContent = joinLinkUrl();

  const pendingList = document.getElementById('pending-list');
  const pending = data.merchants.filter(m => m.status === 'pending');
  pendingList.innerHTML = pending.length === 0 ? '<div class="empty">ما فيه طلبات حالياً</div>' : pending.map(m => `
    <div class="list-item">
      <span>${m.name} — ${m.shop} — ${m.governorate}${m.area ? ' / ' + m.area : ''}<br><span style="color:var(--text-mute); font-size:11px;">📞 ${m.phone || '—'}</span></span>
      <span>
        <button class="btn small" onclick="approveMerchant(${m.id})">قبول</button>
        <button class="btn danger small" onclick="rejectMerchant(${m.id})">رفض</button>
      </span>
    </div>
  `).join('');

  const removalList = document.getElementById('removal-requests-list');
  if (!removalList) return;
  const removalRequests = data.orders.filter(o => o.removalStatus === 'requested');
  removalList.innerHTML = removalRequests.length === 0 ? '<div class="empty">ما فيه طلبات حذف حالياً</div>' : removalRequests.map(o => {
    const m = data.merchants.find(x => x.id === o.merchantId);
    return `<div class="list-item" style="align-items:flex-start;">
      <span>${m ? m.shop : 'تاجر محذوف'} — ${o.productName}${o.size ? ' — مقاس ' + o.size : ''} — ${o.price.toLocaleString()} د
      <br><span style="color:var(--text-mute); font-size:11px;">👤 ${o.customerName || '—'} — ${o.customerPhone || ''}</span></span>
      <span>
        <button class="btn small" onclick="approveOrderRemoval(${o.id})">موافقة على الحذف</button>
        <button class="btn danger small" onclick="denyOrderRemoval(${o.id})">رفض الحذف</button>
      </span>
    </div>`;
  }).join('');
}

function activeMerchants() { return data.merchants.filter(m => m.status !== 'pending'); }

// ---------- RESET PASSWORD (merchant) ----------
// Passwords are hashed, so there is no "original" to show — the admin can only set a new one.
let resetPasswordTarget = null; // { type: 'merchant', id }

function openResetPasswordModal(type, id) {
  resetPasswordTarget = { type, id };
  const target = data.merchants.find(x => x.id === id);
  document.getElementById('reset-password-title').textContent =
    `تصفير كلمة مرور: ${target ? target.shop : ''}`;
  document.getElementById('reset-password-input').value = '';
  document.getElementById('reset-password-modal').classList.add('show');
}
function closeResetPasswordModal() {
  resetPasswordTarget = null;
  document.getElementById('reset-password-modal').classList.remove('show');
}
async function confirmResetPassword() {
  if (!resetPasswordTarget) return;
  const newPassword = document.getElementById('reset-password-input').value.trim();
  if (!newPassword) { showToast('اكتب كلمة مرور جديدة'); return; }
  const hash = await hashPassword(newPassword);
  const m = data.merchants.find(x => x.id === resetPasswordTarget.id);
  if (m) m.password = hash;
  saveData();
  closeResetPasswordModal();
  showToast('تم تصفير كلمة المرور — لا تنسى ترسلها للحساب يدوياً');
  renderAll();
}

// Masked username display with a per-row show/hide toggle — kept out of view by default.
let revealedUsernames = new Set();
function toggleUsernameReveal(key) {
  if (revealedUsernames.has(key)) revealedUsernames.delete(key);
  else revealedUsernames.add(key);
  renderAll();
}

// ---------- ADMIN CREDENTIALS ----------
async function changeAdminPassword() {
  const oldPassInput = document.getElementById('old-admin-password');
  const passInput = document.getElementById('new-admin-password');
  const errorBox = document.getElementById('admin-cred-error');
  const oldPassword = oldPassInput.value;
  const newPassword = passInput.value.trim();

  errorBox.textContent = '';
  if (!oldPassword) { errorBox.textContent = 'اكتب كلمة المرور الحالية أول'; return; }
  if (!newPassword) { errorBox.textContent = 'اكتب كلمة المرور الجديدة'; return; }
  if (newPassword.length < 6) { errorBox.textContent = 'كلمة المرور الجديدة لازم ٦ خانات أو أكثر'; return; }
  if (!window.authApi) { errorBox.textContent = 'تعذر الاتصال بنظام الحسابات — تأكد من الاتصال بالإنترنت'; return; }

  const btn = document.querySelector('#view-shipping .btn[onclick="changeAdminPassword()"]');
  if (btn) { btn.disabled = true; btn.textContent = 'جاري التحديث...'; }
  try {
    await window.authApi.changeMyPassword(oldPassword, newPassword);
    oldPassInput.value = ''; passInput.value = '';
    showToast('تم تحديث كلمة المرور — استخدمها بالمرة الجاية');
  } catch (e) {
    if (e && e.code === 'auth/wrong-password') errorBox.textContent = 'كلمة المرور الحالية غير صحيحة';
    else if (e && e.code === 'auth/requires-recent-login') errorBox.textContent = 'سجل خروج ودخول من جديد ثم أعد المحاولة (إجراء أمان من Firebase)';
    else { console.error('Admin password update failed:', e); errorBox.textContent = 'صار خطأ — تأكد من الاتصال وحاول مرة ثانية'; }
  }
  if (btn) { btn.disabled = false; btn.textContent = 'تحديث كلمة المرور'; }
}

// Purely cosmetic — just what shows in the topbar, stored in the admin-only settings doc.
// Does not touch the Firebase Auth account or login credentials in any way.
function changeAdminDisplayName() {
  const input = document.getElementById('admin-display-name');
  const name = input.value.trim();
  if (!name) { showToast('اكتب اسم أول'); return; }
  data.settings.adminDisplayName = name;
  saveData();
  document.getElementById('topbar-name').textContent = name;
  showToast('تم تحديث الاسم المعروض');
}

// Builds the real, shareable link for a merchant's storefront using the page's own address
function joinLinkUrl() {
  return `${location.origin}${location.pathname}?join=1`;
}

function copyJoinLink() {
  const url = joinLinkUrl();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(
      () => showToast('تم نسخ رابط انضمام التجار'),
      () => showToast('تعذر نسخ الرابط، انسخه يدوياً')
    );
  } else {
    showToast('تعذر نسخ الرابط، انسخه يدوياً');
  }
}

async function approveOrderRemoval(orderId) {
  const o = data.orders.find(x => x.id === orderId);
  if (!o || o.removalStatus !== 'requested') return;
  o.status = 'removed';
  o.removalStatus = 'approved';
  const m = data.merchants.find(x => x.id === o.merchantId);
  const p = m && o.productId ? m.products.find(x => x.id === o.productId) : null;
  if (p && typeof p.stock === 'number') p.stock += 1;
  await saveOrResync('تمت الموافقة على حذف القطعة من فاتورة الزبون');
}

// Admin denies the removal: the piece goes back into its invoice, unchanged, for the merchant to
// accept or reject along with the rest.
async function denyOrderRemoval(orderId) {
  const o = data.orders.find(x => x.id === orderId);
  if (!o || o.removalStatus !== 'requested') return;
  o.removalStatus = 'denied';
  await saveOrResync('تم رفض طلب الحذف — القطعة رجعت للفاتورة');
}

function renderAdminShippingControl() {
  const el = document.getElementById('admin-shipping-control-list');
  if (!el) return;
  const pending = data.orders.filter(o => o.status === 'accepted' && !o.cancelled && o.deliveryStatus === 'none').slice().reverse();
  if (pending.length === 0) { el.innerHTML = '<div class="empty">ما فيه طلبات بانتظار التوصيل حالياً</div>'; return; }
  const groups = groupOrders(pending);
  el.innerHTML = groups.map(g => {
    const items = g.orders;
    const first = items[0];
    const m = data.merchants.find(x => x.id === first.merchantId);
    const itemsHtml = items.map(o => `<div class="invoice-line"><span>${o.productName}${o.size ? ' — مقاس ' + o.size : ''}</span></div>`).join('');
    return `
    <div class="list-item" style="align-items:flex-start; flex-direction:column; gap:8px;">
      <div style="width:100%;">
        <b>🧾 ${m ? m.shop : '—'}${items.length > 1 ? ' (' + items.length + ' قطع)' : ''}</b>
        ${orderCustomerLine(first)}
        <div style="margin-top:6px;">${itemsHtml}</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px; width:100%; justify-content:flex-end; flex-wrap:wrap;">
        <button class="btn small" onclick="markInvoiceDelivered(${g.groupId})">✅ تسجيل كواصل</button>
        <button class="btn secondary small" onclick="markInvoiceReturned(${g.groupId})">↩️ تسجيل كمرجّع</button>
        <button class="btn danger small" onclick="openCancelReasonModal(${g.groupId}, 'admin', 'الأدمن')">❌ إلغاء</button>
      </div>
    </div>`;
  }).join('');
}

async function markInvoiceDelivered(groupId) {
  const items = data.orders.filter(o => (o.orderGroupId || o.id) === groupId && o.status === 'accepted' && !o.cancelled && o.deliveryStatus === 'none');
  if (items.length === 0) return;
  items.forEach(o => { o.deliveryStatus = 'delivered'; });
  await saveOrResync('تم تسجيل الفاتورة كاملة كمُسلّمة');
}

async function markInvoiceReturned(groupId) {
  const items = data.orders.filter(o => (o.orderGroupId || o.id) === groupId && o.status === 'accepted' && !o.cancelled && o.deliveryStatus === 'none');
  if (items.length === 0) return;
  const m = data.merchants.find(x => x.id === items[0].merchantId);
  items.forEach(o => {
    // Customer refused delivery: reverse the merchant's credit for this sale and put the
    // piece back in stock, per the app's own terms ("returned pieces go back to inventory").
    if (o.status === 'accepted' && m) {
      m.balance -= (o.price - o.feeFromMerchant - (o.itemDeduction || 0));
      if (m.salesCount > 0) m.salesCount--;
    }
    const p = m && o.productId ? m.products.find(x => x.id === o.productId) : null;
    if (p && typeof p.stock === 'number') p.stock += 1;
    o.deliveryStatus = 'returned';
  });
  await saveOrResync('تم تسجيل الفاتورة كاملة كمُرجّعة وإرجاع المخزون والرصيد');
}

// ---------- STOREFRONT ----------
function renderStoreSelect() {
  const sel = document.getElementById('store-select');
  if (!sel) return;
  const active = data.merchants.filter(m => m.status === 'active');
  if (active.length === 0) { sel.innerHTML = '<option>ما فيه متاجر متاحة</option>'; document.getElementById('storefront-content').innerHTML = ''; return; }
  sel.innerHTML = active.map(m => `<option value="${m.id}">${m.shop}</option>`).join('');
  renderStorefront();
}

function renderStorefront() {
  const sel = document.getElementById('store-select');
  const id = parseInt(sel.value);
  renderStorefrontInto(id, document.getElementById('storefront-content'));
}

// Shared renderer used by both the admin preview tool (view-store) and the
// public, no-login customer storefront reached via a merchant's unique link.
function renderSettings() {
  const s = data.settings;
  document.getElementById('fee-source-toggles').innerHTML = `
    <span class="toggle ${s.feeSource==='customer'?'selected':''}" onclick="setFeeSource('customer')">من الزبون</span>
    <span class="toggle ${s.feeSource==='merchant'?'selected':''}" onclick="setFeeSource('merchant')">من التاجر</span>
    <span class="toggle ${s.feeSource==='both'?'selected':''}" onclick="setFeeSource('both')">من الاثنين</span>
  `;
  const isPercent = s.feeType === 'percent';
  document.getElementById('fee-type-toggles').innerHTML = `
    <span class="toggle ${!isPercent?'selected':''}" onclick="setFeeType('fixed')">مبلغ ثابت (دينار)</span>
    <span class="toggle ${isPercent?'selected':''}" onclick="setFeeType('percent')">نسبة مئوية (%) من سعر القطعة</span>
  `;
  document.getElementById('fee-amount-label').textContent = isPercent ? 'نسبة الرسم (%)' : 'مبلغ الرسم (دينار)';
  document.getElementById('fee-customer-label').textContent = isPercent ? 'من الزبون (%)' : 'من الزبون (د)';
  document.getElementById('fee-merchant-label').textContent = isPercent ? 'من التاجر (%)' : 'من التاجر (د)';
  document.getElementById('fee-amount').value = s.feeAmount;
  document.getElementById('fee-customer').value = s.feeCustomer;
  document.getElementById('fee-merchant').value = s.feeMerchant;
  document.getElementById('both-fields').style.display = s.feeSource === 'both' ? 'block' : 'none';
  document.getElementById('fee-amount').style.display = s.feeSource === 'both' ? 'none' : 'block';

  document.getElementById('shipping-toggle-group').innerHTML = `
    <span class="toggle ${s.shippingEnabled?'selected':''}" onclick="toggleShipping(true)">مفعّل</span>
    <span class="toggle ${!s.shippingEnabled?'selected':''}" onclick="toggleShipping(false)">معطّل</span>
  `;
  document.getElementById('shipping-amount').value = s.shippingAmount;
  document.getElementById('item-deduction').value = s.itemDeduction || 0;

  renderZonesList();

  const previewPrice = 20000; // sample item price, just to show the admin what the fee looks like
  const fee = calcFee(null, previewPrice);
  const shipping = s.shippingEnabled ? s.shippingAmount : 0;
  document.getElementById('preview-note').textContent = isPercent
    ? `المعاينة محسوبة على قطعة سعرها ${previewPrice.toLocaleString()} د كمثال — الرسم يتغير تلقائياً حسب سعر كل قطعة فعلياً`
    : 'المعاينة أدناه ثابتة لأي قطعة، بغض النظر عن سعرها';
  document.getElementById('preview-grid').innerHTML = `
    <div class="stat"><div class="stat-num">${fee.customer.toLocaleString()}</div><div class="stat-label">من الزبون</div></div>
    <div class="stat"><div class="stat-num">${fee.merchant.toLocaleString()}</div><div class="stat-label">من التاجر</div></div>
    <div class="stat"><div class="stat-num">${(s.itemDeduction || 0).toLocaleString()}</div><div class="stat-label">استقطاع القطعة</div></div>
    <div class="stat"><div class="stat-num">${(fee.customer + fee.merchant + (s.itemDeduction || 0) + shipping).toLocaleString()}</div><div class="stat-label">إجمالي ربحك</div></div>
  `;
}
function setFeeSource(src) { data.settings.feeSource = src; saveData(); renderSettings(); }
function setFeeType(type) { data.settings.feeType = type; saveData(); renderSettings(); }
function setShippingAmount(v) { data.settings.shippingAmount = v; saveData(); renderSettings(); }
function toggleShipping(v) { data.settings.shippingEnabled = v; saveData(); renderSettings(); }
function saveSettings() {
  const clamp = (v) => data.settings.feeType === 'percent' ? Math.min(100, Math.max(0, v)) : v;
  data.settings.feeAmount = clamp(parseFloat(document.getElementById('fee-amount').value) || 0);
  data.settings.feeCustomer = clamp(parseFloat(document.getElementById('fee-customer').value) || 0);
  data.settings.feeMerchant = clamp(parseFloat(document.getElementById('fee-merchant').value) || 0);
  data.settings.itemDeduction = Math.max(0, parseFloat(document.getElementById('item-deduction').value) || 0);
  data.settings.shippingAmount = parseFloat(document.getElementById('shipping-amount').value) || 0;
  saveData();
  renderSettings();
}

// ---------- SHIPPING ZONES (customer-facing fast/slow delivery pricing) ----------
function zoneOffersSpeed(zone, speed) {
  if (!zone) return true;
  return speed === 'fast' ? zone.fastEnabled !== false : zone.slowEnabled !== false;
}
function renderZonesList() {
  const list = document.getElementById('zones-list');
  const datalist = document.getElementById('gov-list');
  if (datalist) datalist.innerHTML = IRAQ_GOVERNORATES.map(g => `<option value="${g}">`).join('');
  const zones = data.settings.shippingZones || [];
  if (zones.length === 0) { list.innerHTML = '<div class="empty">ما فيه مناطق محددة بعد</div>'; return; }
  list.innerHTML = zones.map(z => `
    <div class="list-item">
      <span>${z.name} — سريع: ${zoneOffersSpeed(z,'fast') ? z.fastPrice.toLocaleString() + ' د' : 'غير متوفر'} / بطيء: ${zoneOffersSpeed(z,'slow') ? z.slowPrice.toLocaleString() + ' د' : 'غير متوفر'}</span>
      <span>
        <button class="btn secondary small" onclick="editShippingZone('${z.id}')">تعديل</button>
        <button class="btn danger small" onclick="deleteShippingZone('${z.id}')">حذف</button>
      </span>
    </div>
  `).join('');
}
function addShippingZone() {
  const nameInput = document.getElementById('zone-name');
  const fastInput = document.getElementById('zone-fast');
  const slowInput = document.getElementById('zone-slow');
  const fastEnabledInput = document.getElementById('zone-fast-enabled');
  const slowEnabledInput = document.getElementById('zone-slow-enabled');
  const name = nameInput.value.trim();
  const fastPrice = parseFloat(fastInput.value) || 0;
  const slowPrice = parseFloat(slowInput.value) || 0;
  const fastEnabled = fastEnabledInput.checked;
  const slowEnabled = slowEnabledInput.checked;
  if (!name) { showToast('اكتب اسم المحافظة أو المنطقة'); return; }
  if (!fastEnabled && !slowEnabled) { showToast('لازم يتوفر نوع شحن واحد على الأقل (سريع أو بطيء)'); return; }
  const existing = data.settings.shippingZones.find(z => z.name === name);
  if (existing) {
    existing.fastPrice = fastPrice;
    existing.slowPrice = slowPrice;
    existing.fastEnabled = fastEnabled;
    existing.slowEnabled = slowEnabled;
    showToast('تم تحديث المنطقة');
  } else {
    data.settings.shippingZones.push({ id: 'z' + data.nextId++, name, fastPrice, slowPrice, fastEnabled, slowEnabled });
    showToast('تمت إضافة المنطقة');
  }
  saveData();
  nameInput.value = ''; fastInput.value = ''; slowInput.value = '';
  fastEnabledInput.checked = true; slowEnabledInput.checked = true;
  renderZonesList();
}
function editShippingZone(id) {
  const z = data.settings.shippingZones.find(x => x.id === id);
  if (!z) return;
  document.getElementById('zone-name').value = z.name;
  document.getElementById('zone-fast').value = z.fastPrice;
  document.getElementById('zone-slow').value = z.slowPrice;
  document.getElementById('zone-fast-enabled').checked = z.fastEnabled !== false;
  document.getElementById('zone-slow-enabled').checked = z.slowEnabled !== false;
}
function deleteShippingZone(id) {
  data.settings.shippingZones = data.settings.shippingZones.filter(x => x.id !== id);
  saveData();
  showToast('تم حذف المنطقة');
  renderZonesList();
}

// ---------- ADMIN ACTIONS ----------
function resetFinancials(type) {
  openConfirmModal('تصفير الأرصدة', 'متأكد؟ هذا يصفر كل الأرصدة المالية ولا يمكن التراجع.', async () => {
    data.merchants.forEach(m => { m.balance = 0; m.salesCount = 0; });
    await saveOrResync('تم تصفير الأرصدة');
  });
}
async function toggleMerchantStatus(id) {
  const m = data.merchants.find(x => x.id === id);
  m.status = m.status === 'active' ? 'disabled' : 'active';
  await saveOrResync(m.status === 'active' ? 'تم تفعيل المتجر' : 'تم تعطيل المتجر');
}
function resetMerchantAccount(id) {
  const m = data.merchants.find(x => x.id === id);
  if (!m) return;
  openConfirmModal('تصفير حساب التاجر', `متأكد؟ راح تنمسح كل معاملات "${m.shop}" المالية وطلباته نهائياً وتختفي من الداشبورد. بيانات الحساب والمنتجات تبقى محفوظة.`, async () => {
    m.balance = 0;
    m.salesCount = 0;
    data.orders = data.orders.filter(o => o.merchantId !== id);
    await saveOrResync('تم تصفير حساب التاجر بالكامل');
  });
}
function deleteMerchant(id) {
  openConfirmModal('حذف نهائي', 'متأكد من الحذف النهائي؟ سيتم حذف كل بيانات هذا التاجر ولا يمكن التراجع.', async () => {
    const m = data.merchants.find(x => x.id === id);
    try {
      if (window.authApi && m) {
        if (m.authUid) {
          await window.authApi.deleteDoc('merchants', m.authUid);
          await window.authApi.deleteDoc('merchant_private', m.authUid);
        } else {
          await window.authApi.deleteDoc('join_requests', String(id));
        }
      }
      data.merchants = data.merchants.filter(x => x.id !== id);
      const saved = await saveData();
      if (saved) {
        showToast('تم الحذف النهائي');
      } else {
        showToast('⚠️ تعذر تأكيد الحذف بقاعدة البيانات — تحقق من الإنترنت وحاول مرة ثانية');
        await fetchAllCollections();
        data.merchants.forEach(ensureMerchantTheme);
      }
    } catch (e) {
      console.error('Merchant delete failed:', e);
      showToast('⚠️ تعذر الحذف — راجع الـ Console (F12) لتفاصيل الخطأ');
    }
    renderAll();
  });
}
function renderMerchantActions() {
  const list = document.getElementById('merchant-actions-list');
  const active = activeMerchants();
  if (active.length === 0) { list.innerHTML = '<div class="empty">ما فيه تجار مسجلين</div>'; return; }
  list.innerHTML = active.map(m => {
    const key = 'merchant-' + m.id;
    const revealed = revealedUsernames.has(key);
    const usernameDisplay = m.username ? (revealed ? m.username : '•'.repeat(Math.max(6, m.username.length))) : '—';
    return `
    <div class="list-item" style="align-items:flex-start;">
      <span>${m.shop} <span class="badge ${m.status==='active'?'active':'disabled'}">${m.status==='active'?'نشط':'معطل'}</span><br>
      <span style="color:var(--text-mute); font-size:11px;">
        يوزر: ${usernameDisplay}
        ${m.username ? `<span class="link-chip" style="padding:2px 6px; font-size:10px;" onclick="toggleUsernameReveal('${key}')">${revealed ? 'إخفاء' : 'إظهار'}</span>` : ''}
        — باسورد: 🔒 مخفية
      </span></span>
      <span>
        <button class="btn secondary small" onclick="editMerchantFees(${m.id})">💰 تعديل الرسوم</button>
        <button class="btn secondary small" onclick="exportMerchantAccountingExcel(${m.id})">📊 تصدير حسابات</button>
        <button class="btn secondary small" onclick="openResetPasswordModal('merchant', ${m.id})">🔑 تصفير الباسورد</button>
        <button class="btn warn small" onclick="toggleMerchantStatus(${m.id})">${m.status==='active'?'تعطيل':'تفعيل'}</button>
        <button class="btn danger small" onclick="resetMerchantAccount(${m.id})">تصفير الحساب</button>
        <button class="btn danger small" onclick="deleteMerchant(${m.id})">حذف نهائي</button>
      </span>
    </div>`;
  }).join('');
}

// ---------- CHARTS ----------
let chartInstances = {};
function upsertChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (chartInstances[canvasId]) { chartInstances[canvasId].destroy(); }
  chartInstances[canvasId] = new Chart(canvas.getContext('2d'), config);
}
function last7Days() {
  const dayNames = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ dateStr: d.toDateString(), label: dayNames[d.getDay()] });
  }
  return days;
}
function baseChartOptions() {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { font: { size: 10 }, precision: 0 }, grid: { color: '#EFEDE8' } },
      x: { ticks: { font: { size: 10 } }, grid: { display: false } }
    }
  };
}
function renderDashboardCharts() {
  if (typeof Chart === 'undefined') return;
  const days = last7Days();
  const labels = days.map(d => d.label);
  const ordersPerDay = days.map(d => data.orders.filter(o => new Date(o.date).toDateString() === d.dateStr).length);
  const feesPerDay = days.map(d => data.orders.filter(o => new Date(o.date).toDateString() === d.dateStr)
    .reduce((s,o) => s + o.feeFromCustomer + o.feeFromMerchant + (o.itemDeduction || 0), 0));

  upsertChart('chart-orders-trend', {
    type: 'line',
    data: { labels, datasets: [{ label: 'عدد الطلبات', data: ordersPerDay, borderColor: '#C9A24B', backgroundColor: 'rgba(201,162,75,0.18)', fill: true, tension: 0.3, pointRadius: 3 }] },
    options: baseChartOptions()
  });
  upsertChart('chart-fees-trend', {
    type: 'bar',
    data: { labels, datasets: [{ label: 'الرسوم (د)', data: feesPerDay, backgroundColor: '#201C28', borderRadius: 4, maxBarThickness: 28 }] },
    options: baseChartOptions()
  });
}
function renderDashboard() {
  const today = new Date().toDateString();
  const todayOrders = data.orders.filter(o => new Date(o.date).toDateString() === today);
  const todayFees = todayOrders.reduce((sum, o) => sum + o.feeFromCustomer + o.feeFromMerchant + (o.itemDeduction || 0), 0);

  document.getElementById('d-orders').textContent = todayOrders.length;
  document.getElementById('d-fees').textContent = todayFees.toLocaleString();
  document.getElementById('d-active').textContent = data.merchants.filter(m => m.status === 'active').length;

  const list = document.getElementById('d-merchant-list');
  const active = activeMerchants();
  list.innerHTML = active.length === 0 ? '<div class="empty">ما فيه محلات مسجلة بعد</div>' :
    active.map(m => `
      <div class="list-item">
        <span>${m.shop}</span>
        <span><span class="badge ${m.status==='active'?'active':'disabled'}">${m.status==='active'?'نشط':'معطل'}</span> — ${m.salesCount} عملية</span>
      </div>
    `).join('');

  const settlements = document.getElementById('d-settlements');
  settlements.innerHTML = todayOrders.length === 0 ? '<div class="empty">ما فيه عمليات بيع اليوم</div>' :
    todayOrders.map(o => {
      const m = data.merchants.find(x => x.id === o.merchantId);
      return `<div class="list-item" style="align-items:flex-start;">
        <span>${m ? m.shop : '—'} — ${o.productName} ${o.cancelled ? '<span class="badge rejected">❌ ملغي</span>' : `<span class="badge ${o.status}">${orderStatusLabel(o.status)}</span>`}${orderCustomerLine(o)}</span>
        <span>${(o.feeFromCustomer+o.feeFromMerchant+(o.itemDeduction||0))} د</span>
      </div>`;
    }).join('');

  renderDashboardCharts();
}

// ---------- ACCOUNTING / FINANCIAL REPORTS ----------
function getAccountingFilters() {
  const from = document.getElementById('acc-from').value;
  const to = document.getElementById('acc-to').value;
  const merchantId = document.getElementById('acc-merchant').value;
  const status = document.getElementById('acc-status').value;
  return { from, to, merchantId, status };
}

function filteredAccountingOrders() {
  const f = getAccountingFilters();
  return data.orders.filter(o => {
    const d = new Date(o.date);
    if (f.from && d < new Date(f.from + 'T00:00:00')) return false;
    if (f.to && d > new Date(f.to + 'T23:59:59')) return false;
    if (f.merchantId !== 'all' && String(o.merchantId) !== f.merchantId) return false;
    if (f.status !== 'all' && o.status !== f.status) return false;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function resetAccountingFilters() {
  document.getElementById('acc-from').value = '';
  document.getElementById('acc-to').value = '';
  document.getElementById('acc-merchant').value = 'all';
  document.getElementById('acc-status').value = 'all';
  renderAccounting();
}

function accountingMerchantBreakdown(orders) {
  const byMerchant = {};
  orders.forEach(o => {
    if (!byMerchant[o.merchantId]) {
      byMerchant[o.merchantId] = { count: 0, accepted: 0, sales: 0, feeCustomer: 0, feeMerchant: 0, itemDeduction: 0, shipping: 0, netPayout: 0 };
    }
    const b = byMerchant[o.merchantId];
    b.count++;
    // Only orders that were actually accepted and never cancelled represent real money —
    // counting pending/rejected/cancelled orders here inflates the merchant's reported sales.
    if (o.status === 'accepted' && !o.cancelled) {
      b.accepted++;
      b.sales += o.price;
      b.feeCustomer += o.feeFromCustomer;
      b.feeMerchant += o.feeFromMerchant;
      b.itemDeduction += (o.itemDeduction || 0);
      b.shipping += (o.shippingFee || 0);
      b.netPayout += (o.price - o.feeFromMerchant - (o.itemDeduction || 0));
    }
  });
  return byMerchant;
}

function renderAccounting() {
  const merchantSelect = document.getElementById('acc-merchant');
  const currentSel = merchantSelect.value || 'all';
  merchantSelect.innerHTML = '<option value="all">كل التجار</option>' +
    data.merchants.map(m => `<option value="${m.id}">${m.shop}</option>`).join('');
  merchantSelect.value = Array.from(merchantSelect.options).some(o => o.value === currentSel) ? currentSel : 'all';

  const orders = filteredAccountingOrders();
  // Cancelled orders never actually happened financially — the merchant's balance and any
  // fees tied to them were already reversed, so they must not count toward realized totals.
  const realized = orders.filter(o => o.status === 'accepted' && !o.cancelled);

  const totalSales = realized.reduce((s, o) => s + o.price, 0);
  const totalFeeCustomer = realized.reduce((s, o) => s + o.feeFromCustomer, 0);
  const totalFeeMerchant = realized.reduce((s, o) => s + o.feeFromMerchant, 0);
  const totalItemDeduction = realized.reduce((s, o) => s + (o.itemDeduction || 0), 0);
  const totalShipping = realized.reduce((s, o) => s + (o.shippingFee || 0), 0);
  const totalPlatformProfit = totalFeeCustomer + totalFeeMerchant + totalItemDeduction;

  document.getElementById('acc-summary').innerHTML = `
    <div class="stat"><div class="stat-num">${orders.length}</div><div class="stat-label">عدد العمليات</div></div>
    <div class="stat"><div class="stat-num">${totalSales.toLocaleString()}</div><div class="stat-label">إجمالي المبيعات (د)</div></div>
    <div class="stat"><div class="stat-num">${totalPlatformProfit.toLocaleString()}</div><div class="stat-label">أرباح المنصة (د)</div></div>
  `;
  document.getElementById('acc-summary2').innerHTML = `
    <div class="stat"><div class="stat-num">${totalFeeCustomer.toLocaleString()}</div><div class="stat-label">محصّل من الزبائن (د)</div></div>
    <div class="stat"><div class="stat-num">${totalFeeMerchant.toLocaleString()}</div><div class="stat-label">محصّل من التجار (د)</div></div>
    <div class="stat"><div class="stat-num">${totalItemDeduction.toLocaleString()}</div><div class="stat-label">استقطاع ثابت للقطع (د)</div></div>
    <div class="stat"><div class="stat-num">${totalShipping.toLocaleString()}</div><div class="stat-label">إجمالي الشحن (د)</div></div>
  `;

  const byMerchant = accountingMerchantBreakdown(orders);
  const merchantSummaryEl = document.getElementById('acc-merchant-summary');
  const merchantIds = Object.keys(byMerchant);
  if (merchantIds.length === 0) {
    merchantSummaryEl.innerHTML = '<div class="empty">ما فيه بيانات</div>';
  } else {
    merchantSummaryEl.innerHTML = merchantIds.map(id => {
      const m = data.merchants.find(x => String(x.id) === id);
      const b = byMerchant[id];
      return `<div class="list-item" style="align-items:flex-start;">
        <span>${m ? m.shop : 'تاجر محذوف'} — ${b.count} عملية (${b.accepted} مقبولة)<br>
        <span style="color:var(--text-mute); font-size:11px;">مبيعات: ${b.sales.toLocaleString()} د — رسوم منصة: ${(b.feeCustomer + b.feeMerchant).toLocaleString()} د${b.itemDeduction ? ' — استقطاع قطع: ' + b.itemDeduction.toLocaleString() + ' د' : ''} — شحن: ${b.shipping.toLocaleString()} د</span></span>
        <span style="text-align:left; white-space:nowrap;">صافي مستحقاته: ${b.netPayout.toLocaleString()} د</span>
      </div>`;
    }).join('');
  }

  const ordersEl = document.getElementById('acc-orders-table');
  if (orders.length === 0) {
    ordersEl.innerHTML = '<div class="empty">ما فيه عمليات مطابقة للفلاتر</div>';
  } else {
    ordersEl.innerHTML = orders.map(o => {
      const m = data.merchants.find(x => x.id === o.merchantId);
      const dateStr = new Date(o.date).toLocaleDateString('ar-IQ');
      return `<div class="list-item" style="align-items:flex-start;">
        <span>${dateStr} — ${m ? m.shop : '—'} — ${o.productName} ${o.cancelled ? '<span class="badge rejected">❌ ملغي</span>' : `<span class="badge ${o.status}">${orderStatusLabel(o.status)}</span>`}<br>
        <span style="color:var(--text-mute); font-size:11px;">السعر: ${o.price.toLocaleString()} د — رسم زبون: ${o.feeFromCustomer.toLocaleString()} د — رسم تاجر: ${o.feeFromMerchant.toLocaleString()} د${o.itemDeduction ? ' — استقطاع قطعة: ' + o.itemDeduction.toLocaleString() + ' د' : ''} — شحن: ${(o.shippingFee || 0).toLocaleString()} د — ${o.governorate || ''}</span></span>
      </div>`;
    }).join('');
  }
}

// Builds and downloads a multi-sheet Excel workbook of the currently filtered accounting data
function exportAccountingExcel() {
  if (typeof XLSX === 'undefined') { showToast('تعذر تحميل مكتبة تصدير الإكسل — تأكد من اتصالك بالإنترنت'); return; }
  const orders = filteredAccountingOrders();
  if (orders.length === 0) { showToast('ما فيه عمليات مطابقة للفلاتر الحالية لتصديرها'); return; }

  const ordersRows = orders.map(o => {
    const m = data.merchants.find(x => x.id === o.merchantId);
    return {
      'التاريخ': new Date(o.date).toLocaleDateString('ar-IQ'),
      'الوقت': new Date(o.date).toLocaleTimeString('ar-IQ'),
      'التاجر': m ? m.shop : 'تاجر محذوف',
      'المنتج': o.productName,
      'المقاس': o.size || '',
      'سعر القطعة (د)': o.price,
      'رسم من الزبون (د)': o.feeFromCustomer,
      'رسم من التاجر (د)': o.feeFromMerchant,
      'استقطاع ثابت للقطعة (د)': o.itemDeduction || 0,
      'رسوم المنصة الإجمالية (د)': o.feeFromCustomer + o.feeFromMerchant + (o.itemDeduction || 0),
      'أجرة الشحن (د)': o.shippingFee || 0,
      'صافي مستحق التاجر (د)': o.status === 'accepted' && !o.cancelled ? (o.price - o.feeFromMerchant - (o.itemDeduction || 0)) : 0,
      'المحافظة': o.governorate || '',
      'نوع الشحن': o.shippingSpeed === 'fast' ? 'سريع' : (o.shippingSpeed === 'slow' ? 'بطيء' : ''),
      'الحالة النهائية': orderFullStatusLabel(o),
      'مين ألغى': o.cancelled ? cancelByLabel(o.cancelBy) : '',
      'سبب الإلغاء': o.cancelReason || '',
      'اسم الزبون': o.customerName || '',
      'هاتف الزبون': o.customerPhone || '',
      'عنوان الزبون': o.customerAddress || ''
    };
  });

  const byMerchant = accountingMerchantBreakdown(orders);
  const merchantRows = Object.keys(byMerchant).map(id => {
    const m = data.merchants.find(x => String(x.id) === id);
    const b = byMerchant[id];
    return {
      'التاجر': m ? m.shop : 'تاجر محذوف',
      'عدد العمليات': b.count,
      'عمليات مقبولة': b.accepted,
      'إجمالي المبيعات (د)': b.sales,
      'رسوم من الزبائن (د)': b.feeCustomer,
      'رسوم من التاجر (د)': b.feeMerchant,
      'استقطاع ثابت للقطع (د)': b.itemDeduction,
      'إجمالي رسوم المنصة (د)': b.feeCustomer + b.feeMerchant + b.itemDeduction,
      'إجمالي الشحن (د)': b.shipping,
      'صافي مستحقات التاجر (د)': b.netPayout
    };
  });

  const realized = orders.filter(o => o.status === 'accepted' && !o.cancelled);
  const totalSales = realized.reduce((s, o) => s + o.price, 0);
  const totalFeeCustomer = realized.reduce((s, o) => s + o.feeFromCustomer, 0);
  const totalFeeMerchant = realized.reduce((s, o) => s + o.feeFromMerchant, 0);
  const totalItemDeduction = realized.reduce((s, o) => s + (o.itemDeduction || 0), 0);
  const totalShipping = realized.reduce((s, o) => s + (o.shippingFee || 0), 0);
  const f = getAccountingFilters();
  const summaryRows = [
    { 'البند': 'الفترة', 'القيمة': (f.from || '—') + ' إلى ' + (f.to || '—') },
    { 'البند': 'عدد العمليات', 'القيمة': orders.length },
    { 'البند': 'إجمالي المبيعات (د)', 'القيمة': totalSales },
    { 'البند': 'رسوم محصّلة من الزبائن (د)', 'القيمة': totalFeeCustomer },
    { 'البند': 'رسوم محصّلة من التجار (د)', 'القيمة': totalFeeMerchant },
    { 'البند': 'استقطاع ثابت للقطع (د)', 'القيمة': totalItemDeduction },
    { 'البند': 'إجمالي أرباح المنصة (د)', 'القيمة': totalFeeCustomer + totalFeeMerchant + totalItemDeduction },
    { 'البند': 'إجمالي أجور الشحن (د)', 'القيمة': totalShipping }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'الملخص العام');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(merchantRows), 'ملخص التجار');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ordersRows), 'تفاصيل الطلبات');

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `souqi-accounting-${stamp}.xlsx`);
  showToast('تم تحميل تقرير الإكسل ✅');
}


