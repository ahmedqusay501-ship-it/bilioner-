// ============================================================
// merchant.js — Billionaire platform: MERCHANT-ONLY code
// Everything only a logged-in merchant's own dashboard uses: their
// products, their orders, their store theme/branding, their own
// accounting, and their "preview my store" lens.
//
// Depends on core.js being loaded first (uses `data`, `saveData()`,
// `showToast()`, `openCancelReasonModal()`, and other shared helpers).
// ============================================================

const MERCHANT_VIEWS = [{id: 'merchant', label: 'لوحة متجري'}];

function storeLinkUrl(slug) {
  return `${location.origin}${location.pathname}?store=${encodeURIComponent(slug)}`;
}

function copyStoreLink(slug) {
  const url = storeLinkUrl(slug);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(
      () => showToast('تم نسخ رابط المتجر'),
      () => showToast('تعذر نسخ الرابط، انسخه يدوياً')
    );
  } else {
    showToast('تعذر نسخ الرابط، انسخه يدوياً');
  }
}

// Builds the shareable link that takes any new merchant straight to the "طلب انضمام" form
function renderMerchantPanel() {
  if (!loggedInMerchantId) return;
  const m = data.merchants.find(x => x.id === loggedInMerchantId);
  const panel = document.getElementById('merchant-panel');
  if (!m) { panel.innerHTML = ''; return; }
  ensureMerchantTheme(m);

  // The whole panel below gets rebuilt from scratch on every refresh (including the
  // background one every 5 seconds) — that's normally fine since it always re-reads
  // straight from `data`, but the "add product" form is the one place with free-typed
  // content that ISN'T saved anywhere yet. If the merchant had, say, typed a name and price
  // but not clicked "إضافة المنتج" the moment the 5-second refresh happens to land, a full
  // innerHTML rebuild would silently throw that typed text away. Grabbing it here and putting
  // it back after the rebuild means an in-progress "add product" draft always survives a
  // background refresh, not just while a field happens to be focused.
  const draftFieldPrefixes = ['p-name-', 'p-price-', 'p-desc-', 'p-sizes-', 'p-stock-'];
  const draft = {};
  draftFieldPrefixes.forEach(prefix => {
    const el = document.getElementById(prefix + m.id);
    if (el && el.value) draft[prefix] = el.value;
  });

  panel.innerHTML = `
    <div class="card">
      <div class="card-title">حالة المتجر: <span class="badge ${m.status === 'active' ? 'active' : 'disabled'}">${m.status === 'active' ? 'نشط' : 'معطل'}</span></div>
      <div class="card-title" style="margin-top:8px;">رابط متجرك الفريد — أرسله لزبائنك</div>
      <div class="link-chip" onclick="copyStoreLink('${m.linkSlug}')">${storeLinkUrl(m.linkSlug)}</div>
      ${m.status === 'active'
        ? `<button class="btn secondary small" style="margin-top:8px;" onclick="window.open(storeLinkUrl('${m.linkSlug}'), '_blank')">فتح المتجر بصفحة جديدة</button>`
        : `<div class="subtitle" style="margin-top:8px;">الرابط اعلاه يشتغل بعد ما يفعّل الأدمن متجرك. لين هسه استخدم زر المعاينة تحت لتشوف شكل متجرك.</div>`}
      <button class="btn small" style="margin-top:8px;" onclick="openMerchantPreview(${m.id})">🔍 عاين متجرك متل ما راح يشوفه الزبون</button>
    </div>
    <div class="card">
      <div class="card-title">🔐 بيانات حسابي (خاصة بيك انت بس)</div>
      <div class="subtitle" style="margin-bottom:8px;">هاي البيانات ما يشوفها أي تاجر ثاني — يشوفها الأدمن وانت بس</div>
      <div style="font-size:12.5px; color:var(--text-mute);">
        اسم المستخدم: <b style="color:var(--ink);">${(revealedUsernames.has('own-'+m.id) ? m.username : '•'.repeat(Math.max(6, (m.username||'').length))) || '—'}</b>
        ${m.username ? `<span class="link-chip" style="padding:2px 6px; font-size:10px;" onclick="toggleUsernameReveal('own-${m.id}')">${revealedUsernames.has('own-'+m.id) ? 'إخفاء' : 'إظهار'}</span>` : ''}
        <br>كلمة المرور: 🔒 مخفية لحمايتك — إذا نسيتها اطلب من الأدمن يصفرها ويعطيك وحدة جديدة
      </div>
    </div>
    <div class="card">
      <div class="card-title">🛎️ طلبات جديدة بانتظار ردك</div>
      <div id="pending-orders-${m.id}">${renderPendingOrders(m)}</div>
    </div>
    <div class="card">
      <div class="card-title">📦 الطلبات المقبولة بانتظار التوصيل</div>
      <div id="ready-shipping-${m.id}">${renderReadyForShipping(m)}</div>
    </div>
    <div class="card">
      <div class="card-title">🎨 لون لوحة تحكمك</div>
      <div class="subtitle" style="margin-bottom:8px;">هذا اللون يخص شكل لوحتك انت بس (الأزرار والعناوين هنا بلوحة التحكم) — منفصل تماماً عن شكل متجرك اللي يشوفه الزبون</div>
      <div class="theme-row">
        <input type="color" id="dash-color-${m.id}" value="${m.dashboardColor}" onchange="setDashboardColor(${m.id}, this.value)">
        <span style="font-size:12px; color:#666;">اختر اللون المفضل لواجهتك</span>
      </div>
    </div>
    <div class="card">
      <div class="card-title">🎨 تخصيص شكل متجرك</div>
      <div class="subtitle" style="margin-bottom:8px;">هذا الشكل يظهر للزبون بالضبط بصفحة متجرك</div>

      <label>اللون الرئيسي (للأزرار والعناوين)</label>
      <div class="theme-row">
        <input type="color" id="theme-color-${m.id}" value="${m.theme.primaryColor}" onchange="setThemeColor(${m.id}, this.value)">
        <span style="font-size:12px; color:#666;">اختر لون يمثل هوية محلك</span>
      </div>

      <label>شعار المحل (لوگو)</label>
      <div class="theme-row">
        ${m.theme.logo
          ? `<img class="logo-preview" src="${m.theme.logo}">`
          : `<div class="thumb-placeholder" style="width:56px;height:56px;">🏪</div>`}
        <div style="flex:1;">
          <input type="file" accept="image/*" id="theme-logo-${m.id}" onchange="setThemeLogo(${m.id}, this)">
          ${m.theme.logo ? `<span class="link-chip" style="margin-top:6px;" onclick="removeThemeImage(${m.id},'logo')">إزالة الشعار</span>` : ''}
        </div>
      </div>

      <label>صورة غلاف المتجر (اختياري)</label>
      <input type="file" accept="image/*" id="theme-banner-${m.id}" onchange="setThemeBanner(${m.id}, this)">
      ${m.theme.banner
        ? `<img class="banner-preview" src="${m.theme.banner}"><span class="link-chip" style="margin-top:6px;" onclick="removeThemeImage(${m.id},'banner')">إزالة صورة الغلاف</span>`
        : ''}
    </div>
    <div class="card" style="border:1px solid var(--accent); background:linear-gradient(135deg,#fff,var(--accent-soft));">
      <div class="card-title">✨ تصميم ذكي بالذكاء الاصطناعي</div>
      <div class="subtitle" style="margin-bottom:8px;">ارفع شعار محلك وخل الذكاء الاصطناعي يحلل ألوانه ويصمملك لون رئيسي وصورة غلاف تناسب هويتك تلقائياً — اقتراح فقط، ما ينطبق إلا إذا وافقت، وما يغير أي شي من إعداداتك الحالية</div>
      <label>شعار المحل ${m.theme.logo ? '(عندك وحدة محفوظة — تكدر ترفع وحدة جديدة أو تحلل الحالية)' : '(ارفعه هنا)'}</label>
      <input type="file" accept="image/*" id="ai-logo-${m.id}" onchange="runAiDesign(${m.id}, this)">
      ${m.theme.logo && !(aiDesignSuggestion && aiDesignSuggestion.merchantId === m.id)
        ? `<button class="btn secondary small" style="margin-top:8px;" onclick="runAiDesign(${m.id})">🤖 حلّل شعاري الحالي وصمملي الألوان</button>`
        : ''}
      ${aiDesignSuggestion && aiDesignSuggestion.merchantId === m.id ? `
        <div style="margin-top:12px; padding:10px; border-radius:10px; background:#fff; border:1px dashed var(--accent);">
          <div style="font-size:12px; color:#666; margin-bottom:8px;">🎨 اقتراح الذكاء الاصطناعي — استوحيناه من ألوان شعارك:</div>
          <img src="${aiDesignSuggestion.banner}" style="width:100%; height:110px; object-fit:cover; border-radius:8px;">
          <div class="theme-row">
            <span style="width:30px; height:30px; border-radius:6px; display:inline-block; background:${aiDesignSuggestion.primaryColor}; border:1px solid #ddd;"></span>
            <span style="font-size:12px; color:#666;">اللون الرئيسي المقترح للمتجر</span>
          </div>
          <div style="display:flex; gap:8px; margin-top:6px;">
            <button class="btn small" onclick="applyAiDesign(${m.id})">✅ تطبيق هذا التصميم</button>
            <button class="btn small secondary" onclick="dismissAiDesign()">تجاهل الاقتراح</button>
          </div>
        </div>
      ` : ''}
    </div>
    <div class="card">
      <div class="card-title">➕ إضافة منتج</div>
      <label>اسم المنتج</label><input id="p-name-${m.id}" placeholder="قميص قطن">
      <label>السعر (دينار)</label><input type="number" id="p-price-${m.id}" placeholder="15000">
      <label>وصف القطعة (اختياري)</label><textarea id="p-desc-${m.id}" placeholder="مثلاً: قماش قطن 100%، صناعة تركية، مناسب لكل الفصول"></textarea>
      <label>المقاسات المتوفرة (اختياري، افصل بينها بفاصلة)</label><input id="p-sizes-${m.id}" placeholder="مثلاً: S, M, L, XL">
      <label>الكمية المتوفرة (اختياري — اتركها فارغة لو غير محدودة)</label><input type="number" id="p-stock-${m.id}" placeholder="مثلاً: 20">
      <label>صورة المنتج (اختياري)</label><input type="file" accept="image/*" id="p-image-${m.id}">
      <button class="btn" onclick="addProduct(${m.id})">إضافة المنتج</button>
    </div>
    <div class="card">
      <div class="card-title">منتجاتي</div>
      <div id="products-list-${m.id}">${renderProductList(m)}</div>
    </div>
    <div class="card">
      <div class="card-title">أرباحي</div>
      <div class="grid3">
        <div class="stat"><div class="stat-num">${m.salesCount}</div><div class="stat-label">عمليات بيع</div></div>
        <div class="stat"><div class="stat-num">${m.balance.toLocaleString()}</div><div class="stat-label">رصيدي (د)</div></div>
        <div class="stat"><div class="stat-num">${m.visits || 0}</div><div class="stat-label">زيارات متجرك</div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">🧮 حساباتي الدقيقة</div>
      <div class="subtitle" style="margin-bottom:8px;">كل أموالك، الرسوم المستقطعة منك لصالح المنصة، وصافي أرباحك — هذي بياناتك انت بس ولا تظهر أي حساب لتاجر ثاني أو للأدمن أو لشركة الشحن</div>
      <div class="row2">
        <div><label>من تاريخ</label><input type="date" id="macc-from-${m.id}" onchange="renderMerchantAccounting(${m.id})"></div>
        <div><label>إلى تاريخ</label><input type="date" id="macc-to-${m.id}" onchange="renderMerchantAccounting(${m.id})"></div>
      </div>
      <button class="btn secondary small" onclick="resetMerchantAccountingFilters(${m.id})">إعادة تعيين الفلاتر</button>
      <div class="grid3" id="macc-summary-${m.id}" style="margin-top:10px;"></div>
      <div class="grid3" id="macc-summary2-${m.id}"></div>
      <div style="margin-top:6px;">
        <button class="btn small" onclick="exportMerchantAccountingExcel(${m.id})">📥 تحميل تقرير Excel</button>
        <button class="btn small secondary" onclick="exportMerchantAccountingPDF(${m.id})">🖨️ تحميل تقرير PDF</button>
      </div>
      <div class="card-title" style="margin-top:14px;">🧾 فواتير طلباتي بالتفصيل</div>
      <div id="macc-orders-${m.id}"></div>
    </div>
    <div class="card">
      <div class="card-title">📈 مبيعاتي آخر 7 أيام</div>
      <div class="chart-wrap"><canvas id="chart-merchant-sales"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title">🏆 الأكثر مبيعاً</div>
      <div class="chart-wrap"><canvas id="chart-merchant-products"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title">سجل الطلبات (الكل)</div>
      <div id="merchant-orders-${m.id}">${renderMerchantOrders(m)}</div>
    </div>
  `;

  // Put back whatever the merchant had already typed into "add product" before this rebuild.
  draftFieldPrefixes.forEach(prefix => {
    if (draft[prefix] === undefined) return;
    const el = document.getElementById(prefix + m.id);
    if (el) el.value = draft[prefix];
  });

  renderMerchantCharts(m);
  renderMerchantAccounting(m.id);
}

// ---------- MERCHANT DASHBOARD COLOR (own admin panel look, admin/shipping unaffected) ----------
// Lightens (positive percent) or darkens (negative percent) a hex color, used to derive
// dark/light/soft accent shades from the single color a merchant picks.
function setDashboardColor(id, color) {
  const m = data.merchants.find(x => x.id === id);
  m.dashboardColor = color;
  saveData();
  applyMerchantDashboardColor(m);
}

// ---------- MERCHANT ACCOUNTING (isolated strictly to this merchant's own orders) ----------
function filteredMerchantAccountingOrders(merchantId) {
  const fromEl = document.getElementById(`macc-from-${merchantId}`);
  const toEl = document.getElementById(`macc-to-${merchantId}`);
  const from = fromEl ? fromEl.value : '';
  const to = toEl ? toEl.value : '';
  return data.orders.filter(o => {
    if (o.merchantId !== merchantId) return false; // hard isolation: never another merchant's data
    const d = o.date.slice(0, 10);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  }).slice().reverse();
}

function resetMerchantAccountingFilters(merchantId) {
  const fromEl = document.getElementById(`macc-from-${merchantId}`);
  const toEl = document.getElementById(`macc-to-${merchantId}`);
  if (fromEl) fromEl.value = '';
  if (toEl) toEl.value = '';
  renderMerchantAccounting(merchantId);
}

function renderMerchantAccounting(merchantId) {
  const m = data.merchants.find(x => x.id === merchantId);
  const summaryEl = document.getElementById(`macc-summary-${merchantId}`);
  const summary2El = document.getElementById(`macc-summary2-${merchantId}`);
  const ordersEl = document.getElementById(`macc-orders-${merchantId}`);
  if (!m || !summaryEl || !ordersEl) return;

  const orders = filteredMerchantAccountingOrders(merchantId);
  const accepted = orders.filter(o => o.status === 'accepted' && !o.cancelled);
  const totalSales = accepted.reduce((s, o) => s + o.price, 0);
  const totalFeeDeducted = accepted.reduce((s, o) => s + (o.feeFromMerchant || 0), 0);
  const totalItemDeduction = accepted.reduce((s, o) => s + (o.itemDeduction || 0), 0);
  const netProfit = totalSales - totalFeeDeducted - totalItemDeduction;
  const totalShipping = accepted.reduce((s, o) => s + (o.shippingFee || 0), 0);

  summaryEl.innerHTML = `
    <div class="stat"><div class="stat-num">${accepted.length}</div><div class="stat-label">طلبات مقبولة</div></div>
    <div class="stat"><div class="stat-num">${totalSales.toLocaleString()}</div><div class="stat-label">إجمالي مبيعاتي (د)</div></div>
    <div class="stat"><div class="stat-num">${totalFeeDeducted.toLocaleString()}</div><div class="stat-label">رسوم المنصة المستقطعة (د)</div></div>
  `;
  summary2El.innerHTML = `
    <div class="stat"><div class="stat-num">${totalItemDeduction.toLocaleString()}</div><div class="stat-label">استقطاع ثابت للقطع (د)</div></div>
    <div class="stat"><div class="stat-num">${netProfit.toLocaleString()}</div><div class="stat-label">صافي ربحي (د)</div></div>
    <div class="stat"><div class="stat-num">${totalShipping.toLocaleString()}</div><div class="stat-label">أجور توصيل زبائني (د)</div></div>
  `;

  if (orders.length === 0) {
    ordersEl.innerHTML = '<div class="empty">ما فيه عمليات مطابقة للفلاتر</div>';
    return;
  }
  ordersEl.innerHTML = orders.map(o => {
    const dateStr = new Date(o.date).toLocaleDateString('ar-IQ');
    const net = o.status === 'accepted' && !o.cancelled ? (o.price - (o.feeFromMerchant || 0) - (o.itemDeduction || 0)) : 0;
    return `<div class="list-item" style="align-items:flex-start;">
      <span>${dateStr} — ${o.productName}${o.size ? ' (مقاس ' + o.size + ')' : ''} ${o.cancelled ? '<span class="badge rejected">❌ ملغي</span>' : `<span class="badge ${o.status}">${orderStatusLabel(o.status)}</span>`}<br>
      <span style="color:var(--text-mute); font-size:11px;">السعر: ${o.price.toLocaleString()} د — رسم منصة مستقطع مني: ${(o.feeFromMerchant || 0).toLocaleString()} د${o.itemDeduction ? ' — استقطاع القطعة: ' + o.itemDeduction.toLocaleString() + ' د' : ''} — توصيل الزبون: ${(o.shippingFee || 0).toLocaleString()} د</span></span>
      <span style="text-align:left; white-space:nowrap;">${o.status === 'accepted' && !o.cancelled ? 'صافيّ: ' + net.toLocaleString() + ' د' : '—'}</span>
    </div>`;
  }).join('');
}

function exportMerchantAccountingExcel(merchantId) {
  if (typeof XLSX === 'undefined') { showToast('تعذر تحميل مكتبة تصدير الإكسل — تأكد من اتصالك بالإنترنت'); return; }
  const m = data.merchants.find(x => x.id === merchantId);
  const orders = filteredMerchantAccountingOrders(merchantId);
  if (!m || orders.length === 0) { showToast('ما فيه عمليات مطابقة للفلاتر الحالية لتصديرها'); return; }

  const rows = orders.map(o => ({
    'التاريخ': new Date(o.date).toLocaleDateString('ar-IQ'),
    'الوقت': new Date(o.date).toLocaleTimeString('ar-IQ'),
    'المنتج': o.productName,
    'المقاس': o.size || '',
    'السعر (د)': o.price,
    'رسم المنصة المستقطع مني (د)': o.feeFromMerchant || 0,
    'استقطاع ثابت للقطعة (د)': o.itemDeduction || 0,
    'صافي ربحي (د)': o.status === 'accepted' && !o.cancelled ? (o.price - (o.feeFromMerchant || 0) - (o.itemDeduction || 0)) : 0,
    'أجرة توصيل الزبون (د)': o.shippingFee || 0,
    'الحالة النهائية': orderFullStatusLabel(o),
    'مين ألغى': o.cancelled ? cancelByLabel(o.cancelBy) : '',
    'سبب الإلغاء': o.cancelReason || ''
  }));
  const accepted = orders.filter(o => o.status === 'accepted' && !o.cancelled);
  const totalSales = accepted.reduce((s, o) => s + o.price, 0);
  const totalFee = accepted.reduce((s, o) => s + (o.feeFromMerchant || 0), 0);
  const totalItemDeduction = accepted.reduce((s, o) => s + (o.itemDeduction || 0), 0);
  const summaryRows = [
    { 'البند': 'المحل', 'القيمة': m.shop },
    { 'البند': 'عدد الطلبات المقبولة (غير الملغية)', 'القيمة': accepted.length },
    { 'البند': 'عدد الطلبات الملغية', 'القيمة': orders.filter(o => o.cancelled).length },
    { 'البند': 'إجمالي مبيعاتي (د)', 'القيمة': totalSales },
    { 'البند': 'إجمالي رسوم المنصة المستقطعة (د)', 'القيمة': totalFee },
    { 'البند': 'إجمالي الاستقطاع الثابت للقطع (د)', 'القيمة': totalItemDeduction },
    { 'البند': 'صافي ربحي (د)', 'القيمة': totalSales - totalFee - totalItemDeduction },
    { 'البند': 'عدد زيارات متجري', 'القيمة': m.visits || 0 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'ملخص حساباتي');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'تفاصيل طلباتي');
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `حسابات-${m.shop}-${stamp}.xlsx`);
  showToast('تم تحميل تقرير الإكسل ✅');
}

// PDF export uses the browser's own print dialog ("حفظ كـ PDF") instead of a PDF-generation
// library, so the Arabic text renders correctly (client-side PDF libraries don't shape Arabic well).

function exportMerchantAccountingPDF(merchantId) {
  const m = data.merchants.find(x => x.id === merchantId);
  const orders = filteredMerchantAccountingOrders(merchantId);
  if (!m || orders.length === 0) { showToast('ما فيه عمليات مطابقة للفلاتر الحالية لتصديرها'); return; }

  const accepted = orders.filter(o => o.status === 'accepted' && !o.cancelled);
  const totalSales = accepted.reduce((s, o) => s + o.price, 0);
  const totalFee = accepted.reduce((s, o) => s + (o.feeFromMerchant || 0), 0);
  const totalItemDeduction = accepted.reduce((s, o) => s + (o.itemDeduction || 0), 0);
  const netProfit = totalSales - totalFee - totalItemDeduction;
  const totalShipping = accepted.reduce((s, o) => s + (o.shippingFee || 0), 0);

  const rowsHtml = orders.map(o => {
    const dateStr = new Date(o.date).toLocaleDateString('ar-IQ');
    const net = o.status === 'accepted' && !o.cancelled ? (o.price - (o.feeFromMerchant || 0) - (o.itemDeduction || 0)) : 0;
    return `<tr>
      <td>${dateStr}</td>
      <td>${o.productName}${o.size ? ' (' + o.size + ')' : ''}</td>
      <td>${o.price.toLocaleString()}</td>
      <td>${(o.feeFromMerchant || 0).toLocaleString()}</td>
      <td>${(o.itemDeduction || 0).toLocaleString()}</td>
      <td>${net.toLocaleString()}</td>
      <td>${orderStatusLabel(o.status)}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
    <title>تقرير حسابات — ${m.shop}</title>
    <style>
      body { font-family: 'Cairo', Tahoma, Arial, sans-serif; padding: 24px; color:#221F2B; }
      h1 { font-size: 18px; margin-bottom: 2px; }
      .sub { color:#746E63; font-size:12px; margin-bottom:18px; }
      .summary { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:20px; }
      .summary div { border:1px solid #E7E0CE; border-radius:8px; padding:10px 14px; min-width:140px; }
      .summary b { display:block; font-size:16px; margin-bottom:2px; }
      table { width:100%; border-collapse:collapse; font-size:12px; }
      th, td { border:1px solid #E7E0CE; padding:6px 8px; text-align:center; }
      th { background:#F6EDD3; }
      @media print { body { padding: 8px; } }
    </style></head><body>
      <h1>تقرير حسابات — ${m.shop}</h1>
      <div class="sub">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-IQ')} — عدد زيارات المتجر: ${m.visits || 0}</div>
      <div class="summary">
        <div><b>${accepted.length}</b>طلبات مقبولة</div>
        <div><b>${totalSales.toLocaleString()} د</b>إجمالي المبيعات</div>
        <div><b>${totalFee.toLocaleString()} د</b>رسوم المنصة المستقطعة</div>
        <div><b>${totalItemDeduction.toLocaleString()} د</b>استقطاع ثابت للقطع</div>
        <div><b>${netProfit.toLocaleString()} د</b>صافي ربحي</div>
        <div><b>${totalShipping.toLocaleString()} د</b>أجور توصيل الزبائن</div>
      </div>
      <table>
        <thead><tr><th>التاريخ</th><th>المنتج</th><th>السعر (د)</th><th>رسم مستقطع (د)</th><th>استقطاع القطعة (د)</th><th>صافي (د)</th><th>الحالة</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body></html>`;

  const printWin = window.open('', '_blank');
  if (!printWin) { showToast('المتصفح منع فتح نافذة الطباعة — فعّل النوافذ المنبثقة واعد المحاولة'); return; }
  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
  setTimeout(() => { try { printWin.focus(); printWin.print(); } catch (e) {} }, 350);
  showToast('اختر "حفظ كـ PDF" من نافذة الطباعة اللي فتحت');
}

// ---------- MERCHANT THEME (color / logo / banner) ----------
function setThemeColor(id, color) {
  const m = data.merchants.find(x => x.id === id);
  ensureMerchantTheme(m).theme.primaryColor = color;
  saveData();
  renderMerchantPanel();
}

async function setThemeLogo(id, inputEl) {
  const file = inputEl.files[0];
  if (!file) return;
  try {
    const dataUrl = await resizeImageFile(file, 300, 0.85);
    const m = data.merchants.find(x => x.id === id);
    ensureMerchantTheme(m).theme.logo = dataUrl;
    saveData();
    renderMerchantPanel();
    showToast('تم حفظ الشعار');
  } catch (e) {
    showToast('صار خطأ بمعالجة الصورة');
  }
}

async function setThemeBanner(id, inputEl) {
  const file = inputEl.files[0];
  if (!file) return;
  try {
    const dataUrl = await resizeImageFile(file, 900, 0.75);
    const m = data.merchants.find(x => x.id === id);
    ensureMerchantTheme(m).theme.banner = dataUrl;
    saveData();
    renderMerchantPanel();
    showToast('تم حفظ صورة الغلاف');
  } catch (e) {
    showToast('صار خطأ بمعالجة الصورة');
  }
}

function removeThemeImage(id, which) {
  const m = data.merchants.find(x => x.id === id);
  ensureMerchantTheme(m).theme[which] = null;
  saveData();
  renderMerchantPanel();
}

// ---------- AI SMART DESIGN (analyzes the merchant's logo colors and suggests a theme) ----------
// Purely additive feature: it only ever proposes a suggestion (aiDesignSuggestion) that the
// merchant must explicitly apply — it never touches theme.primaryColor/banner on its own,
// and never runs automatically, so nothing existing changes unless the merchant approves it.
let aiDesignSuggestion = null;

function hexToRgbAI(hex) {
  hex = (hex || '#C9A24B').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function pickReadableTextColor(hex) {
  const { r, g, b } = hexToRgbAI(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  return luminance > 150 ? '#221F2B' : '#FFFFFF';
}

// Samples the logo's pixels and finds the most prominent saturated color (skipping
// near-white/near-black/near-gray pixels, which are usually just background/outline).
function extractDominantColorAI(imgDataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const size = 60;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const px = ctx.getImageData(0, 0, size, size).data;
        const buckets = {};
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
          if (a < 100) continue;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const lightness = (max + min) / 2;
          if (lightness > 235 || lightness < 20) continue;
          const sat = max === min ? 0 : (max - min) / (255 - Math.abs(2 * lightness - 255));
          if (sat < 0.15) continue;
          const key = [Math.round(r / 24) * 24, Math.round(g / 24) * 24, Math.round(b / 24) * 24].join(',');
          if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, count: 0, satSum: 0 };
          buckets[key].r += r; buckets[key].g += g; buckets[key].b += b;
          buckets[key].count++; buckets[key].satSum += sat;
        }
        let best = null, bestScore = -1;
        for (const k in buckets) {
          const bucket = buckets[k];
          const score = bucket.count * (bucket.satSum / bucket.count);
          if (score > bestScore) { bestScore = score; best = bucket; }
        }
        if (!best) { resolve('#C77B4A'); return; }
        const r = Math.round(best.r / best.count), g = Math.round(best.g / best.count), b = Math.round(best.b / best.count);
        resolve('#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join(''));
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('logo load failed'));
    img.src = imgDataUrl;
  });
}

// Draws a ready-made storefront banner (gradient inspired by the logo's color + shop name).
async function generateAiBannerAI(primaryColor, shopName) {
  try { if (document.fonts && document.fonts.load) await document.fonts.load("700 64px Cairo"); } catch (e) {}
  const w = 1200, h = 360;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const light = shadeColor(primaryColor, 18);
  const dark = shadeColor(primaryColor, -28);
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, light);
  grad.addColorStop(1, dark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(w * 0.86, h * 0.22, 150, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w * 0.1, h * 0.88, 110, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = pickReadableTextColor(primaryColor);
  ctx.font = "700 64px 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try { ctx.direction = 'rtl'; } catch (e) {}
  ctx.fillText(shopName || '', w / 2, h / 2);
  return canvas.toDataURL('image/jpeg', 0.85);
}

// Entry point for the "AI Smart Design" card. If a new logo file is passed it's saved as the
// merchant's logo first (same as the normal logo uploader), then analyzed either way.
async function runAiDesign(id, inputEl) {
  const m = data.merchants.find(x => x.id === id);
  if (!m) return;
  ensureMerchantTheme(m);
  try {
    if (inputEl && inputEl.files && inputEl.files[0]) {
      const dataUrl = await resizeImageFile(inputEl.files[0], 300, 0.85);
      m.theme.logo = dataUrl;
      saveData();
    }
    if (!m.theme.logo) { showToast('ارفع شعار المحل أول عشان الذكاء الاصطناعي يحلله'); return; }
    showToast('🤖 جاري تحليل الشعار وتصميم الألوان...');
    const primaryColor = await extractDominantColorAI(m.theme.logo);
    const banner = await generateAiBannerAI(primaryColor, m.shop);
    aiDesignSuggestion = { merchantId: id, primaryColor, banner };
    renderMerchantPanel();
  } catch (e) {
    showToast('صار خطأ بتحليل الشعار، جرب صورة ثانية');
  }
}

function applyAiDesign(id) {
  if (!aiDesignSuggestion || aiDesignSuggestion.merchantId !== id) return;
  const m = data.merchants.find(x => x.id === id);
  ensureMerchantTheme(m).theme.primaryColor = aiDesignSuggestion.primaryColor;
  m.theme.banner = aiDesignSuggestion.banner;
  aiDesignSuggestion = null;
  saveData();
  renderMerchantPanel();
  showToast('✨ تم تطبيق التصميم الذكي على متجرك');
}

function dismissAiDesign() {
  aiDesignSuggestion = null;
  renderMerchantPanel();
}

let editingProductId = null;

function renderProductList(m) {
  if (m.products.length === 0) return '<div class="empty">ما فيه منتجات بعد</div>';
  return m.products.map(p => {
    if (editingProductId === p.id) {
      return `
      <div class="list-item" style="align-items:flex-start; flex-direction:column; gap:6px;">
        <label>اسم المنتج</label><input id="edit-name-${p.id}" value="${p.name}">
        <label>السعر (دينار)</label><input type="number" id="edit-price-${p.id}" value="${p.price}">
        <label>الكمية المتوفرة (اتركها فارغة لو غير محدودة)</label><input type="number" id="edit-stock-${p.id}" value="${p.stock === null || p.stock === undefined ? '' : p.stock}">
        <div>
          <button class="btn small" onclick="saveProductEdit(${m.id}, ${p.id})">حفظ</button>
          <button class="btn secondary small" onclick="cancelProductEdit()">إلغاء</button>
        </div>
      </div>`;
    }
    const outOfStock = typeof p.stock === 'number' && p.stock <= 0;
    return `
    <div class="list-item" style="align-items:flex-start;">
      <span style="display:flex; align-items:flex-start; gap:8px;">
        ${p.image ? `<img class="thumb" src="${p.image}">` : `<div class="thumb-placeholder">🖼️</div>`}
        <span>
          <div>${p.name} ${outOfStock ? '<span class="badge rejected">نفدت الكمية</span>' : ''}</div>
          ${p.description ? `<div class="product-desc">${p.description}</div>` : ''}
          ${p.sizes && p.sizes.length ? `<div class="product-sizes-label">مقاسات: ${p.sizes.join('، ')}</div>` : ''}
          <div class="product-sizes-label">${typeof p.stock === 'number' ? 'الكمية المتبقية: ' + p.stock : 'كمية غير محدودة'}</div>
        </span>
      </span>
      <span>${p.price.toLocaleString()} د
        <button class="btn secondary small" style="margin-right:6px;" onclick="editProduct(${p.id})">تعديل</button>
        <button class="btn danger small" style="margin-right:6px;" onclick="deleteProduct(${m.id},${p.id})">حذف</button>
      </span>
    </div>`;
  }).join('');
}

function editProduct(productId) {
  editingProductId = productId;
  renderMerchantPanel();
}
function cancelProductEdit() {
  editingProductId = null;
  renderMerchantPanel();
}
async function saveProductEdit(merchantId, productId) {
  const m = data.merchants.find(x => x.id === merchantId);
  const p = m.products.find(x => x.id === productId);
  const name = document.getElementById(`edit-name-${productId}`).value.trim();
  const price = parseFloat(document.getElementById(`edit-price-${productId}`).value);
  const stockRaw = document.getElementById(`edit-stock-${productId}`).value.trim();
  if (!name || !price) { showToast('عبي اسم المنتج والسعر'); return; }
  const prevName = p.name, prevPrice = p.price, prevStock = p.stock;
  p.name = name;
  p.price = price;
  p.stock = stockRaw === '' ? null : (parseInt(stockRaw) || 0);
  editingProductId = null;
  renderMerchantPanel();

  const saved = await saveData();
  if (!saved) {
    // Roll back so the screen matches what's actually persisted.
    p.name = prevName; p.price = prevPrice; p.stock = prevStock;
    renderMerchantPanel();
    return;
  }
  showToast('تم تحديث المنتج');
}

async function deleteProduct(merchantId, productId) {
  const m = data.merchants.find(x => x.id === merchantId);
  const removed = m.products.find(p => p.id === productId);
  const removedIndex = m.products.indexOf(removed);
  m.products = m.products.filter(p => p.id !== productId);
  renderMerchantPanel();

  const saved = await saveData();
  if (!saved) {
    // Put it back — the deletion never actually made it to the server.
    m.products.splice(removedIndex, 0, removed);
    renderMerchantPanel();
    return;
  }
  showToast('تم حذف المنتج');
}

function renderReadyForShipping(m) {
  const ready = data.orders.filter(o => o.merchantId === m.id && o.status === 'accepted' && !o.cancelled && o.deliveryStatus === 'none').slice().reverse();
  if (ready.length === 0) return '<div class="empty">ما فيه طلبات بانتظار التوصيل حالياً</div>';
  const groups = groupOrders(ready);
  return groups.map(g => {
    const items = g.orders;
    const first = items[0];
    const itemsHtml = items.map(o => `
      <div class="invoice-line">
        <span>${o.productName}${o.size ? ' — مقاس ' + o.size : ''} — ${o.price.toLocaleString()} د</span>
      </div>
    `).join('');
    return `
    <div class="list-item" style="align-items:flex-start; flex-direction:column; gap:8px;">
      <div style="width:100%;">
        <b>🧾 فاتورة الزبون${items.length > 1 ? ' — ' + items.length + ' قطع' : ''}</b>
        ${orderCustomerLine(first)}
        <div style="margin-top:6px;">${itemsHtml}</div>
        ${items.map(o => orderFinanceLine(o)).join('')}
      </div>
      <div style="display:flex; align-items:center; gap:8px; width:100%; justify-content:flex-end; flex-wrap:wrap;">
        <span style="font-size:11px; color:#999;">بانتظار تسجيل الأدمن لحالة التوصيل</span>
        <button class="btn danger small" onclick="openCancelReasonModal(${g.groupId}, 'merchant', '${(m.shop || '').replace(/'/g, "\\'")}')">❌ إلغاء الطلب</button>
      </div>
    </div>`;
  }).join('');
}

// Groups orders into "invoices" — every order created together from one cart checkout
// shares an orderGroupId and should be shown/actioned as a single invoice; legacy/older
// single-item orders (no orderGroupId) fall back to being their own one-item invoice.
function renderPendingOrders(m) {
  const pending = data.orders.filter(o => o.merchantId === m.id && o.status === 'pending').slice().reverse();
  if (pending.length === 0) return '<div class="empty">ما فيه طلبات جديدة حالياً</div>';
  const groups = groupOrders(pending);
  return groups.map(g => {
    const items = g.orders;
    const first = items[0];
    const subtotal = items.reduce((s, o) => s + o.price, 0);
    const serviceFee = items.reduce((s, o) => s + (o.feeFromCustomer || 0), 0);
    const shipping = items.reduce((s, o) => s + (o.shippingFee || 0), 0);
    const customerTotal = subtotal + serviceFee + shipping;
    const feeFromMerchant = items.reduce((s, o) => s + (o.feeFromMerchant || 0), 0);
    const itemDeduction = items.reduce((s, o) => s + (o.itemDeduction || 0), 0);
    const platformCommission = feeFromMerchant + itemDeduction;
    const netPayout = subtotal - platformCommission;
    const hasPendingRemoval = items.some(o => o.removalStatus === 'requested');

    const itemsHtml = items.map(o => `
      <div class="invoice-line">
        <span>${o.productName}${o.size ? ' — مقاس ' + o.size : ''} — ${o.price.toLocaleString()} د
          ${o.removalStatus === 'requested' ? ' <span class="badge pending">بانتظار موافقة الأدمن على الحذف</span>' : ''}
          ${o.removalStatus === 'denied' ? ' <span class="badge rejected">الأدمن رفض حذفها</span>' : ''}
        </span>
        ${(!o.removalStatus || o.removalStatus === 'denied') ? `<button class="btn secondary small" onclick="requestOrderRemoval(${o.id})">⚠️ غير متوفرة</button>` : ''}
      </div>
    `).join('');

    return `
    <div class="list-item" style="align-items:flex-start; flex-direction:column; gap:8px;">
      <div style="width:100%;">
        <b>🧾 فاتورة الزبون${items.length > 1 ? ' — ' + items.length + ' قطع' : ''}</b>
        ${orderCustomerLine(first)}
        <div style="margin-top:6px;">${itemsHtml}</div>
        <div style="font-size:11px; color:#888; margin-top:6px; border-top:1px dashed #EEE; padding-top:6px;">
          إجمالي الفاتورة: ${subtotal.toLocaleString()} د قطع${serviceFee ? ' + ' + serviceFee.toLocaleString() + ' د رسوم خدمة' : ''}${shipping ? ' + ' + shipping.toLocaleString() + ' د توصيل' : ''} = <b>${customerTotal.toLocaleString()} د</b>
        </div>
        <div style="font-size:11px; color:var(--accent-dark); margin-top:3px; border-top:1px dashed #EEE; padding-top:6px;">
          💰 عمولة المنصة المستقطعة منك بهذي الفاتورة: <b>${platformCommission.toLocaleString()} د</b>${feeFromMerchant ? ' (رسم منصة ' + feeFromMerchant.toLocaleString() + ' د' : ''}${itemDeduction ? (feeFromMerchant ? ' + ' : ' (') + 'استقطاع قطع ' + itemDeduction.toLocaleString() + ' د' : ''}${(feeFromMerchant || itemDeduction) ? ')' : ''}
          — صافيك المتوقع لو انقبلت الفاتورة: <b>${netPayout.toLocaleString()} د</b>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:8px; width:100%; justify-content:flex-end; flex-wrap:wrap;">
        ${hasPendingRemoval ? `<span style="font-size:11px; color:var(--warn);">بانتظار رد الأدمن على طلب حذف قطعة قبل ما تكدر تقبل الفاتورة</span>` : ''}
        <button class="btn small" ${hasPendingRemoval ? 'disabled style="opacity:.5;"' : ''} onclick="acceptInvoice(${g.groupId})">قبول الفاتورة</button>
        <button class="btn danger small" onclick="rejectInvoice(${g.groupId})">رفض الفاتورة</button>
      </div>
    </div>`;
  }).join('');
}

function acceptInvoice(groupId) {
  const items = data.orders.filter(o => (o.orderGroupId || o.id) === groupId && o.status === 'pending');
  if (items.length === 0) return;
  if (items.some(o => o.removalStatus === 'requested')) {
    showToast('لازم تنتظر رد الأدمن على طلب حذف القطعة قبل قبول الفاتورة');
    return;
  }
  const m = data.merchants.find(x => x.id === items[0].merchantId);
  items.forEach(o => {
    o.status = 'accepted';
    m.salesCount++;
    m.balance += (o.price - o.feeFromMerchant - (o.itemDeduction || 0));
  });
  saveData();
  showToast('تم قبول الفاتورة');
  renderAll();
}

function rejectInvoice(groupId) {
  const items = data.orders.filter(o => (o.orderGroupId || o.id) === groupId && o.status === 'pending');
  if (items.length === 0) return;
  const m = data.merchants.find(x => x.id === items[0].merchantId);
  items.forEach(o => {
    o.status = 'rejected';
    const p = m && o.productId ? m.products.find(x => x.id === o.productId) : null;
    if (p && typeof p.stock === 'number') p.stock += 1;
  });
  saveData();
  showToast('تم رفض الفاتورة وإرجاع الكمية للمخزون');
  renderAll();
}

// Merchant flags a single piece inside a pending invoice as unavailable — it doesn't get removed
// right away, it just waits in the admin's queue until the admin approves or denies the removal.
function requestOrderRemoval(orderId) {
  const o = data.orders.find(x => x.id === orderId);
  if (!o || o.status !== 'pending') return;
  o.removalStatus = 'requested';
  saveData();
  showToast('تم إرسال طلب حذف القطعة للأدمن — بانتظار موافقته');
  renderAll();
}

// Admin approves removing a flagged piece from its invoice: the order itself is marked "removed"
// (so it drops out of the merchant's pending invoice) and its stock is restored.
function renderMerchantOrders(m) {
  const myOrders = data.orders.filter(o => o.merchantId === m.id).slice().reverse();
  if (myOrders.length === 0) return '<div class="empty">ما فيه طلبات بعد</div>';
  return myOrders.slice(0, 15).map(o => {
    const d = new Date(o.date);
    const dateLabel = d.toLocaleDateString('ar-IQ') + ' ' + d.toLocaleTimeString('ar-IQ', {hour:'2-digit', minute:'2-digit'});
    return `<div class="list-item" style="align-items:flex-start;">
      <span>${o.productName}${o.size ? ' — مقاس ' + o.size : ''} — ${o.price.toLocaleString()} د${orderCustomerLine(o)}${orderFinanceLine(o)}${cancelReasonLine(o)}</span>
      <span>${o.cancelled ? '<span class="badge rejected">❌ ملغي</span>' : `<span class="badge ${o.status}">${orderStatusLabel(o.status)}</span> ${o.deliveryStatus && o.deliveryStatus !== 'none' ? `<span class="badge ${deliveryStatusBadgeClass(o.deliveryStatus)}">${deliveryStatusLabel(o.deliveryStatus)}</span>` : ''}`} ${dateLabel}</span>
    </div>`;
  }).join('');
}

async function addProduct(merchantId) {
  const m = data.merchants.find(x => x.id === merchantId);
  const nameInput = document.getElementById(`p-name-${merchantId}`);
  const priceInput = document.getElementById(`p-price-${merchantId}`);
  const descInput = document.getElementById(`p-desc-${merchantId}`);
  const sizesInput = document.getElementById(`p-sizes-${merchantId}`);
  const stockInput = document.getElementById(`p-stock-${merchantId}`);
  const imageInput = document.getElementById(`p-image-${merchantId}`);
  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);
  const description = descInput.value.trim();
  const sizes = sizesInput.value.trim()
    ? sizesInput.value.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const stockRaw = stockInput.value.trim();
  const stock = stockRaw === '' ? null : (parseInt(stockRaw) || 0);
  if (!name || !price) { showToast('عبي اسم المنتج والسعر'); return; }

  let image = null;
  if (imageInput.files[0]) {
    try { image = await resizeImageFile(imageInput.files[0], 500, 0.75); }
    catch (e) { showToast('تعذر معالجة صورة المنتج، بس راح تنضاف المنتج بدونها'); }
  }

  const newProduct = {id: data.nextId++, name, price, image, description, sizes, stock};
  m.products.push(newProduct);
  renderMerchantPanel(); // show it immediately, optimistically

  const saved = await saveData();
  if (!saved) {
    // The write didn't actually land on the server — undo the optimistic add so the
    // on-screen list matches what's really persisted, instead of showing a product that
    // will vanish (or silently wipe out others) the next time data refreshes.
    m.products = m.products.filter(p => p.id !== newProduct.id);
    renderMerchantPanel();
    return;
  }
  nameInput.value = ''; priceInput.value = ''; descInput.value = ''; sizesInput.value = ''; stockInput.value = ''; imageInput.value = '';
  showToast('تمت إضافة المنتج');
}

// ---------- ADMIN: mark delivery outcome directly on any accepted, in-progress invoice ----------
// There's no shipping-company handoff step — once the merchant accepts an order it sits here,
// with deliveryStatus 'none', until the admin marks the whole invoice delivered or returned.
function openMerchantPreview(merchantId) {
  const content = document.getElementById('merchant-preview-content');
  renderStorefrontInto(merchantId, content, { ignoreDisabled: true });
  document.getElementById('merchant-preview-modal').classList.add('show');
}
function closeMerchantPreview() {
  document.getElementById('merchant-preview-modal').classList.remove('show');
}

function renderMerchantCharts(m) {
  if (typeof Chart === 'undefined') return;
  const days = last7Days();
  const labels = days.map(d => d.label);
  const myOrders = data.orders.filter(o => o.merchantId === m.id && o.status === 'accepted' && !o.cancelled);
  const salesPerDay = days.map(d => myOrders.filter(o => new Date(o.date).toDateString() === d.dateStr).length);

  upsertChart('chart-merchant-sales', {
    type: 'line',
    data: { labels, datasets: [{ label: 'عمليات البيع', data: salesPerDay, borderColor: '#256B45', backgroundColor: 'rgba(37,107,69,0.15)', fill: true, tension: 0.3, pointRadius: 3 }] },
    options: baseChartOptions()
  });

  const productTotals = {};
  myOrders.forEach(o => { productTotals[o.productName] = (productTotals[o.productName] || 0) + 1; });
  const sortedProducts = Object.entries(productTotals).sort((a,b) => b[1]-a[1]).slice(0, 5);
  upsertChart('chart-merchant-products', {
    type: 'bar',
    data: { labels: sortedProducts.map(p => p[0]), datasets: [{ label: 'مرات البيع', data: sortedProducts.map(p => p[1]), backgroundColor: '#C9A24B', borderRadius: 4, maxBarThickness: 22 }] },
    options: { ...baseChartOptions(), indexAxis: 'y' }
  });
}

// ---------- DASHBOARD ----------
