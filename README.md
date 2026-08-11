<!DOCTYPE html>

<html dir="rtl" lang="ar"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Billionaire — منصة التجارة الإلكترونية</title>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          bg: '#0F0D14',
          surface: '#1A1721',
          border: '#2D2836',
          ink: '#FFFFFF',
          accent: '#C9A24B',
          'accent-dark': '#9C7A2F',
          success: '#256B45',
          warn: '#B07F1E',
          danger: '#A63A32',
          'text-mute': '#A19BAD',
        },
        fontFamily: {
          sans: ['Cairo', 'sans-serif'],
        }
      }
    }
  }
</script>
<style>
  :root {
    --bg: #0F0D14;
    --surface: #1A1721;
    --border: #2D2836;
    --ink: #FFFFFF;
    --accent: #C9A24B;
    --accent-dark: #9C7A2F;
    --accent-soft: rgba(201, 162, 75, 0.1);
    --success: #256B45;
    --warn: #B07F1E;
    --danger: #A63A32;
    --text-mute: #A19BAD;
    --radius: 12px;
  }
  
  body { background-color: var(--bg); color: var(--ink); min-height: 100vh; overflow-x: hidden; }

  /* ===== Utility Classes ===== */
  .card { background-color: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; margin-bottom: 16px; }
  .btn { 
    background: linear-gradient(135deg, var(--accent), var(--accent-dark)); 
    color: #000; border: none; border-radius: 8px; padding: 12px 20px; 
    font-weight: 700; cursor: pointer; transition: 0.3s; 
  }
  .btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
  .btn.secondary { background: transparent; border: 1px solid var(--accent); color: var(--accent); }
  .btn.danger { background: var(--danger); color: #fff; }
  .badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; color: #fff; }
  .badge.pending { background: var(--warn); }
  .badge.active { background: var(--success); }

  /* ===== Auth UI ===== */
  .auth-wrap { 
    min-height: 100vh; display: flex; align-items: center; justify-content: center; 
    background: radial-gradient(circle at center, #201C28 0%, #0F0D14 100%);
  }
  .auth-card { width: 100%; max-width: 400px; text-align: center; padding: 30px; }
  .logo-text { font-size: 28px; font-weight: 800; color: var(--accent); letter-spacing: 1px; margin-bottom: 8px; }
  .logo-dot { display: inline-block; width: 10px; height: 10px; background: var(--accent); border-radius: 50%; margin-left: 5px; }

  input, select, textarea { 
    width: 100%; padding: 12px; background: #25212D; border: 1px solid var(--border); 
    border-radius: 8px; color: #fff; margin-bottom: 12px; outline: none; 
  }
  input:focus, select:focus, textarea:focus { border-color: var(--accent); ring: 1px solid var(--accent); }

  /* ===== Topbar & Nav ===== */
  .topbar { background-color: var(--surface); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }
  .nav { display: flex; overflow-x: auto; background-color: var(--surface); border-bottom: 1px solid var(--border); padding: 0 10px; }
  .nav button { padding: 15px; border: none; background: none; color: var(--text-mute); font-weight: 600; cursor: pointer; border-bottom: 3px solid transparent; white-space: nowrap; }
  .nav button.active { color: var(--accent); border-bottom-color: var(--accent); }

  .view { display: none; padding: 20px; max-width: 1200px; margin: 0 auto; }
  .view.active { display: block; }

  /* ===== Dashboard Stats ===== */
  .grid-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat-card { background-color: var(--surface); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid var(--border); }
  .stat-val { font-size: 28px; font-weight: 800; color: var(--accent); margin-top: 8px; }
  .stat-label { font-size: 14px; color: var(--text-mute); font-weight: 600;}

  /* ===== Public Store ===== */
  .product-card { display: flex; gap: 15px; background-color: var(--surface); padding: 16px; border-radius: 12px; margin-bottom: 12px; align-items: center; border: 1px solid var(--border); }
  .product-img { width: 100px; height: 100px; border-radius: 8px; object-fit: cover; background: #333; }
  
  .store-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
  .store-item { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;}
  .store-item img { width: 100%; height: 200px; object-fit: cover; }
  .store-item-content { padding: 15px; flex: 1; display: flex; flex-direction: column; }
  
  .modal-overlay { 
    display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); 
    z-index: 1000; align-items: center; justify-content: center; padding: 20px;
  }
  .modal-overlay.show { display: flex; }
  .modal-content { background-color: var(--surface); padding: 30px; border-radius: 16px; width: 100%; max-width: 500px; position: relative; border: 1px solid var(--border); box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
  
  .store-banner { height: 200px; object-fit: cover; width: 100%; border-radius: 12px; margin-bottom: 20px; }
</style>
</head>
<body class="text-ink antialiased">
<!-- APP SHELL -->
<div id="auth-section">
<!-- Login Screen -->
<div class="auth-wrap" id="view-login">
<div class="auth-card card">
<div class="logo-text mb-2"><span class="logo-dot"></span>BILLIONAIRE</div>
<p class="text-text-mute mb-8">نظام الإدارة المتكامل</p>
<input id="login-user" placeholder="اسم المستخدم (admin/merchant/shipping/customer)" type="text"/>
<input id="login-pass" placeholder="كلمة المرور" type="password"/>
<button class="btn w-full mt-4" onclick="handleLogin()">دخول النظام</button>
<div class="mt-6 text-sm text-text-mute flex flex-col gap-2">
<p>تاجر جديد؟ <a class="text-accent font-bold hover:underline" href="#" onclick="switchView('join')">قدم طلب انضمام</a></p>
<p>تصفح كزبون؟ <a class="text-accent font-bold hover:underline" href="#" onclick="loginAs('customer')">دخول للمتجر</a></p>
</div>
</div>
</div>
<!-- Join Request -->
<div class="auth-wrap" id="view-join" style="display: none;">
<div class="auth-card card max-w-md">
<div class="logo-text"><span class="logo-dot"></span>انضم كتاجر</div>
<p class="text-text-mute mb-6">املأ البيانات وسيتم التواصل معك</p>
<form id="join-form" onsubmit="handleJoinRequest(event)">
<input id="join-name" placeholder="اسمك الكامل" required="" type="text"/>
<input id="join-store" placeholder="اسم المتجر" required="" type="text"/>
<input id="join-phone" placeholder="رقم الهاتف" required="" type="tel"/>
<select id="join-city" required="">
<option disabled="" selected="" value="">اختر المحافظة</option>
<option>بغداد</option><option>البصرة</option><option>أربيل</option><option>نينوى</option>
<option>النجف</option><option>كربلاء</option><option>باقي المحافظات</option>
</select>
<button class="btn w-full mt-4" type="submit">إرسال الطلب</button>
<button class="btn secondary w-full mt-3" onclick="switchView('login')" type="button">رجوع</button>
</form>
</div>
</div>
</div>
<!-- Main Application -->
<div id="main-app" style="display: none;">
<div class="topbar">
<div class="flex items-center gap-4">
<div class="logo-text text-xl m-0 cursor-pointer" onclick="goHome()"><span class="logo-dot"></span>BILLIONAIRE</div>
<button class="hidden relative text-accent p-2 hover:bg-surface rounded-full transition-colors" id="cart-btn" onclick="openModal('cart-modal')">
<span class="material-symbols-outlined">shopping_cart</span>
<span class="absolute top-0 right-0 bg-danger text-white text-xs w-4 h-4 flex items-center justify-center rounded-full" id="cart-count">0</span>
</button>
</div>
<div class="flex items-center gap-4">
<div class="text-sm text-accent font-medium" id="user-info">مرحباً، <span id="display-name">الأدمن</span></div>
<button class="btn secondary text-xs py-1.5 px-3" onclick="logout()">خروج</button>
</div>
</div>
<div class="nav" id="app-nav">
<!-- Nav buttons injected by JS based on role -->
</div>
<!-- ==================== ADMIN VIEWS ==================== -->
<div class="view" id="admin-dashboard">
<h3 class="text-2xl font-bold mb-6">لوحة التحكم العامة</h3>
<div class="grid-stats">
<div class="stat-card">
<div class="stat-label">إجمالي الطلبات</div>
<div class="stat-val" id="admin-total-orders">1,245</div>
</div>
<div class="stat-card">
<div class="stat-label">الأرباح (د.ع)</div>
<div class="stat-val" id="admin-total-profit">15,200,000</div>
</div>
<div class="stat-card">
<div class="stat-label">تاجر نشط</div>
<div class="stat-val" id="admin-active-merchants">342</div>
</div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
<div class="card">
<h4 class="font-bold text-lg mb-4 text-accent border-b border-border pb-2">نظرة عامة على المبيعات</h4>
<canvas height="200" id="adminSalesChart" width="400"></canvas>
</div>
<div class="card">
<h4 class="font-bold text-lg mb-4 text-accent border-b border-border pb-2">طلبات التجار الجديدة</h4>
<div class="flex flex-col gap-3 mt-4" id="merchant-requests-list">
<!-- Populated by JS -->
</div>
</div>
</div>
</div>
<div class="view" id="admin-accounting">
<h3 class="text-2xl font-bold mb-6">الحسابات المالية (المنصة)</h3>
<div class="card mb-6 flex flex-wrap gap-4 items-end">
<div class="flex-1 min-w-[200px]">
<label class="block text-sm text-text-mute mb-2">من تاريخ</label>
<input class="w-full" id="admin-filter-from" type="date"/>
</div>
<div class="flex-1 min-w-[200px]">
<label class="block text-sm text-text-mute mb-2">إلى تاريخ</label>
<input class="w-full" id="admin-filter-to" type="date"/>
</div>
<div class="flex-1 min-w-[200px]">
<label class="block text-sm text-text-mute mb-2">التاجر</label>
<select class="w-full" id="admin-filter-merchant">
<option value="all">الكل</option>
<!-- Populated by JS -->
</select>
</div>
<button class="btn mb-[12px]" onclick="renderAdminAccounting()">تصفية</button>
</div>
<div class="card overflow-x-auto">
<div class="flex justify-between items-center mb-4">
<h4 class="font-bold text-accent">سجل العمليات</h4>
<button class="btn secondary text-sm flex items-center gap-2" onclick="exportExcel('admin-table', 'حسابات_المنصة')">
<span class="material-symbols-outlined text-sm">download</span>
                تصدير Excel
            </button>
</div>
<table class="w-full text-right border-collapse" id="admin-table">
<thead>
<tr class="border-b border-border text-text-mute text-sm">
<th class="p-3">رقم الطلب</th>
<th class="p-3">التاجر</th>
<th class="p-3">المبلغ (د.ع)</th>
<th class="p-3">عمولة المنصة</th>
<th class="p-3">التاريخ</th>
<th class="p-3">الحالة</th>
</tr>
</thead>
<tbody id="admin-accounting-body">
<!-- Populated by JS -->
</tbody>
</table>
</div>
</div>
<div class="view" id="admin-merchants">
<h3 class="text-2xl font-bold mb-6">إدارة التجار</h3>
<div class="card">
<table class="w-full text-right border-collapse" id="admin-merchants-table">
<thead>
<tr class="border-b border-border text-text-mute text-sm">
<th class="p-3">اسم المتجر</th>
<th class="p-3">صاحب المتجر</th>
<th class="p-3">المحافظة</th>
<th class="p-3">رابط المتجر</th>
<th class="p-3">حالة الحساب</th>
<th class="p-3">إجراءات</th>
</tr>
</thead>
<tbody id="admin-merchants-body">
<!-- Populated by JS -->
</tbody>
</table>
</div>
</div>
<div class="view" id="admin-settings">
<h3 class="text-2xl font-bold mb-6">إعدادات المنصة</h3>
<div class="card max-w-2xl">
<h4 class="font-bold text-lg mb-4 text-accent border-b border-border pb-2">الإعدادات العامة</h4>
<label class="block mb-2 text-sm text-text-mute">نسبة عمولة المنصة الافتراضية (%)</label>
<input id="setting-commission" type="number" value="10"/>
<label class="block mb-2 text-sm text-text-mute">رسوم التوصيل الافتراضية (بغداد)</label>
<input id="setting-shipping-bgw" type="number" value="5000"/>
<button class="btn mt-4" onclick="saveSettings()">حفظ الإعدادات</button>
</div>
</div>
<!-- ==================== MERCHANT VIEWS ==================== -->
<div class="view" id="merchant-dashboard">
<div class="flex justify-between items-center mb-6">
<h3 class="text-2xl font-bold">متجري</h3>
</div>
<div class="card mb-6">
<h4 class="font-bold text-lg mb-4 text-accent border-b border-border pb-2">رابط متجري</h4>
<div class="flex gap-4 items-center">
<input class="flex-1 bg-bg" id="merchant-store-link" readonly="" type="text" value="billionaire.app/?store="/>
<button class="btn" onclick="copyStoreLink()">نسخ الرابط</button>
<button class="btn secondary" onclick="viewMyStore()">معاينة المتجر</button>
</div>
</div>
<div class="grid-stats">
<div class="stat-card">
<div class="stat-label">رصيدي الحالي (د.ع)</div>
<div class="stat-val text-success" id="merchant-balance">0</div>
</div>
<div class="stat-card">
<div class="stat-label">طلبات بانتظار التجهيز</div>
<div class="stat-val text-warn" id="merchant-pending-orders">0</div>
</div>
<div class="stat-card">
<div class="stat-label">إجمالي المنتجات</div>
<div class="stat-val" id="merchant-total-products">0</div>
</div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div class="card lg:col-span-2">
<h4 class="font-bold text-lg mb-4 text-accent border-b border-border pb-2">الطلبات الجديدة</h4>
<div id="merchant-orders-list">
<!-- Populated by JS -->
</div>
</div>
<div class="card">
<h4 class="font-bold text-lg mb-4 text-accent border-b border-border pb-2">إضافة منتج سريع</h4>
<form id="quick-add-product" onsubmit="handleQuickAddProduct(event)">
<input id="quick-prod-name" placeholder="اسم المنتج" required="" type="text"/>
<input id="quick-prod-price" placeholder="السعر (د.ع)" required="" type="number"/>
<select id="quick-prod-cat" required="">
<option value="electronics">إلكترونيات</option>
<option value="fashion">أزياء</option>
<option value="other">أخرى</option>
</select>
<input id="quick-prod-img" placeholder="رابط الصورة (اختياري)" type="text"/>
<button class="btn w-full mt-2" type="submit">إضافة للمتجر</button>
</form>
</div>
</div>
</div>
<div class="view" id="merchant-accounting">
<h3 class="text-2xl font-bold mb-6">كشف الحساب</h3>
<div class="card">
<div class="flex justify-between items-center mb-4">
<h4 class="font-bold text-accent">الطلبات المكتملة والأرباح</h4>
<button class="btn secondary text-sm flex items-center gap-2" onclick="exportExcel('merchant-table', 'كشف_حساب_التاجر')">
<span class="material-symbols-outlined text-sm">download</span>
            تصدير Excel</button>
</div>
<table class="w-full text-right border-collapse" id="merchant-table">
<thead>
<tr class="border-b border-border text-text-mute text-sm">
<th class="p-3">رقم الطلب</th>
<th class="p-3">المنتج</th>
<th class="p-3">المبلغ الصافي (د.ع)</th>
<th class="p-3">التاريخ</th>
</tr>
</thead>
<tbody id="merchant-accounting-body">
<!-- Populated by JS -->
</tbody>
</table>
</div>
</div>
<div class="view" id="merchant-products">
<div class="flex justify-between items-center mb-6">
<h3 class="text-2xl font-bold">إدارة المنتجات</h3>
<button class="btn" onclick="openProductModal()">إضافة منتج جديد</button>
</div>
<div class="card">
<table class="w-full text-right border-collapse" id="merchant-products-table">
<thead>
<tr class="border-b border-border text-text-mute text-sm">
<th class="p-3">صورة</th>
<th class="p-3">المنتج</th>
<th class="p-3">السعر</th>
<th class="p-3">التصنيف</th>
<th class="p-3">الحالة</th>
<th class="p-3">إجراءات</th>
</tr>
</thead>
<tbody id="merchant-products-body">
<!-- Populated by JS -->
</tbody>
</table>
</div>
</div>
<!-- ==================== SHIPPING VIEWS ==================== -->
<div class="view" id="shipping-dashboard">
<h3 class="text-2xl font-bold mb-6">لوحة الشحن والتوصيل</h3>
<div class="grid-stats">
<div class="stat-card">
<div class="stat-label">شحنات قيد التوصيل</div>
<div class="stat-val text-warn" id="shipping-pending">0</div>
</div>
<div class="stat-card">
<div class="stat-label">تم التوصيل اليوم</div>
<div class="stat-val text-success" id="shipping-delivered">0</div>
</div>
</div>
<div class="card">
<div class="flex justify-between items-center mb-4 border-b border-border pb-2">
<h4 class="font-bold text-lg text-accent">الشحنات الحالية</h4>
<select class="p-2 text-sm bg-bg border-border rounded max-w-[150px]" id="shipping-city-filter" onchange="renderShippingOrders()">
<option value="all">الكل</option>
<option value="بغداد">بغداد</option>
<option value="البصرة">البصرة</option>
</select>
</div>
<div class="flex flex-col gap-4" id="shipping-orders-list">
<!-- Populated by JS -->
</div>
</div>
</div>
<!-- ==================== CUSTOMER STOREFRONT ==================== -->
<div class="view" id="customer-store">
<div class="text-center mb-10 hidden" id="storefront-header">
<!-- Populated dynamically if viewing a specific merchant -->
</div>
<div class="text-center mb-10" id="global-storefront-header">
<h2 class="text-4xl font-bold text-accent mb-4">تسوق من أفضل المتاجر</h2>
<p class="text-text-mute">منتجات مميزة، توصيل سريع لجميع المحافظات</p>
</div>
<div class="flex justify-between items-center mb-6">
<h3 class="text-xl font-bold" id="storefront-title">وصل حديثاً</h3>
<select class="p-2 text-sm bg-bg border-border rounded w-48" id="store-sort" onchange="renderStorefront()">
<option value="newest">وصل حديثاً</option>
<option value="price_asc">الأقل سعراً</option>
<option value="price_desc">الأعلى سعراً</option>
</select>
</div>
<div class="store-grid" id="customer-store-grid">
<!-- Populated by JS -->
</div>
</div>
<div class="view" id="customer-track">
<h3 class="text-2xl font-bold mb-6 text-center text-accent">تتبع طلبي</h3>
<div class="card max-w-md mx-auto text-center">
<p class="text-text-mute mb-4">أدخل رقم الطلب لتتبع حالة شحنتك</p>
<input class="text-center" id="track-order-id" placeholder="مثال: ORD-12345" type="text"/>
<button class="btn w-full mt-2" onclick="trackOrder()">بحث</button>
<div class="mt-6 hidden" id="track-result">
<!-- Populated by JS -->
</div>
</div>
</div>
</div>
<!-- ==================== MODALS ==================== -->
<!-- Approve Merchant -->
<div class="modal-overlay" id="approve-modal">
<div class="modal-content">
<div class="flex justify-between items-center mb-4 border-b border-border pb-3">
<h3 class="font-bold text-xl text-accent">قبول تاجر جديد</h3>
<button class="text-text-mute hover:text-white" onclick="closeModal('approve-modal')">
<span class="material-symbols-outlined">close</span>
</button>
</div>
<input id="approve-merchant-id" type="hidden"/>
<div class="mb-4">
<p class="font-bold" id="approve-merchant-name"></p>
<p class="text-sm text-text-mute" id="approve-merchant-info"></p>
</div>
<label class="block mb-2 text-sm text-text-mute">اسم المستخدم للحساب</label>
<input id="approve-username" placeholder="مثلاً: elegance_shop" type="text"/>
<label class="block mb-2 text-sm text-text-mute">كلمة المرور المؤقتة</label>
<input id="approve-password" placeholder="******" type="password"/>
<label class="block mb-2 text-sm text-text-mute">رسوم المنصة (عمولة Billionaire)</label>
<select id="approve-commission">
<option value="fixed_500">مبلغ ثابت (500 د.ع لكل قطعة)</option>
<option value="percent_10">نسبة مئوية (10%)</option>
<option value="percent_15">نسبة مئوية (15%)</option>
</select>
<div class="flex gap-3 mt-6">
<button class="btn flex-1" onclick="confirmApproveMerchant()">تأكيد الحساب</button>
<button class="btn secondary flex-1" onclick="closeModal('approve-modal')">إلغاء</button>
</div>
</div>
</div>
<!-- Cancel Reason -->
<div class="modal-overlay" id="cancel-reason-modal">
<div class="modal-content">
<h3 class="font-bold text-xl text-danger mb-4">سبب رفض الطلب</h3>
<input id="cancel-order-id" type="hidden"/>
<select class="mb-4" id="cancel-reason">
<option value="not_available">المنتج غير متوفر حالياً</option>
<option value="price_changed">السعر تغير</option>
<option value="other">سبب آخر</option>
</select>
<textarea id="cancel-notes" placeholder="ملاحظات إضافية..." rows="3"></textarea>
<div class="flex gap-3 mt-4">
<button class="btn danger flex-1" onclick="confirmCancelOrder()">تأكيد الرفض</button>
<button class="btn secondary flex-1" onclick="closeModal('cancel-reason-modal')">تراجع</button>
</div>
</div>
</div>
<!-- Confirm Modal -->
<div class="modal-overlay" id="confirm-modal">
<div class="modal-content text-center">
<span class="material-symbols-outlined text-5xl text-warn mb-4">help</span>
<h3 class="font-bold text-xl mb-2">تأكيد الإجراء</h3>
<p class="text-text-mute mb-6">هل أنت متأكد من رغبتك في الاستمرار؟ لا يمكن التراجع عن هذا الإجراء.</p>
<input id="confirm-action-type" type="hidden"/>
<input id="confirm-item-id" type="hidden"/>
<div class="flex gap-3">
<button class="btn flex-1" onclick="executeConfirmAction()">نعم، متأكد</button>
<button class="btn secondary flex-1" onclick="closeModal('confirm-modal')">إلغاء</button>
</div>
</div>
</div>
<!-- Cart Modal (Customer) -->
<div class="modal-overlay" id="cart-modal">
<div class="modal-content !max-w-2xl">
<div class="flex justify-between items-center mb-6 border-b border-border pb-3">
<h3 class="font-bold text-xl text-accent flex items-center gap-2">
<span class="material-symbols-outlined">shopping_cart_checkout</span>
            سلة المشتريات
        </h3>
<button class="text-text-mute hover:text-white" onclick="closeModal('cart-modal')">
<span class="material-symbols-outlined">close</span>
</button>
</div>
<div class="text-danger mb-4 hidden text-sm" id="cart-error-message">لا يمكن إضافة منتجات من تجار مختلفين في طلب واحد. يرجى إتمام الطلب الحالي أو تفريغ السلة.</div>
<div class="max-h-[300px] overflow-y-auto mb-6 pr-2 flex flex-col gap-4" id="cart-items-container">
<!-- Populated by JS -->
</div>
<div class="bg-bg p-4 rounded-lg border border-border mb-6">
<h4 class="font-bold mb-3 border-b border-border pb-2">معلومات التوصيل</h4>
<input id="checkout-name" placeholder="الاسم الكامل" required="" type="text"/>
<input id="checkout-phone" placeholder="رقم الهاتف" required="" type="tel"/>
<select id="shipping-zone" onchange="renderCart()">
<option value="5000">بغداد (5,000 د.ع)</option>
<option value="8000">المحافظات الجنوبية (8,000 د.ع)</option>
<option value="10000">المحافظات الشمالية (10,000 د.ع)</option>
</select>
<textarea class="mb-0" id="checkout-address" placeholder="العنوان التفصيلي وأقرب نقطة دالة..." required="" rows="2"></textarea>
</div>
<div class="flex justify-between items-end border-t border-border pt-4">
<div>
<div class="text-text-mute text-sm flex justify-between w-48 mb-1"><span>المجموع:</span> <span id="cart-subtotal">0 د.ع</span></div>
<div class="text-text-mute text-sm flex justify-between w-48 mb-2"><span>التوصيل:</span> <span id="cart-shipping-cost">0 د.ع</span></div>
<div class="font-bold text-xl text-accent flex justify-between w-48 border-t border-border/50 pt-1">
<span>الإجمالي:</span> <span id="cart-total">0 د.ع</span>
</div>
</div>
<button class="btn px-8" onclick="checkout()">تأكيد الطلب</button>
</div>
</div>
</div>
<!-- Product Modal (Merchant) -->
<div class="modal-overlay" id="product-modal">
<div class="modal-content">
<div class="flex justify-between items-center mb-4 border-b border-border pb-3">
<h3 class="font-bold text-xl text-accent" id="product-modal-title">إضافة منتج جديد</h3>
<button class="text-text-mute hover:text-white" onclick="closeModal('product-modal')">
<span class="material-symbols-outlined">close</span>
</button>
</div>
<form id="product-form" onsubmit="saveProduct(event)">
<input id="product-id" type="hidden"/>
<label class="block mb-2 text-sm text-text-mute">اسم المنتج</label>
<input id="product-name" required="" type="text"/>
<label class="block mb-2 text-sm text-text-mute">السعر (د.ع)</label>
<input id="product-price" required="" type="number"/>
<label class="block mb-2 text-sm text-text-mute">التصنيف</label>
<select id="product-category" required="">
<option value="electronics">إلكترونيات</option>
<option value="fashion">أزياء</option>
<option value="other">أخرى</option>
</select>
<label class="block mb-2 text-sm text-text-mute">رابط الصورة (اختياري)</label>
<input id="product-image" placeholder="https://..." type="text"/>
<div class="flex gap-3 mt-6">
<button class="btn flex-1" type="submit">حفظ</button>
<button class="btn secondary flex-1" onclick="closeModal('product-modal')" type="button">إلغاء</button>
</div>
</form>
</div>
</div>
<script>
  // --- SHARED DATA ---
  let appData = {
    users: [
      { id: 'u1', username: 'admin', passwordHash: CryptoJS.SHA256('admin123').toString(), role: 'admin', name: 'المدير العام' },
      { id: 'u2', username: 'merchant', passwordHash: CryptoJS.SHA256('merchant123').toString(), role: 'merchant', name: 'متجر الأناقة', merchantId: 'm1' },
      { id: 'u3', username: 'shipping', passwordHash: CryptoJS.SHA256('shipping123').toString(), role: 'shipping', name: 'مندوب بغداد', city: 'بغداد' },
      { id: 'u4', username: 'customer', passwordHash: CryptoJS.SHA256('customer123').toString(), role: 'customer', name: 'ضيف' }
    ],
    merchants: [
      { id: 'm1', name: 'متجر الأناقة', slug: 'al-anaqa', owner: 'أحمد', phone: '07701234567', city: 'بغداد', status: 'active', commissionType: 'percent_10' },
      { id: 'm2', name: 'عطور الشرق', slug: 'orient-perfumes', owner: 'سالم', phone: '07801234567', city: 'البصرة', status: 'active', commissionType: 'fixed_500' }
    ],
    merchantRequests: [
      { id: 'req1', name: 'علي', store: 'تيك شوب', phone: '07501234567', city: 'أربيل', date: '2023-11-01' }
    ],
    products: [
      { id: 'p1', merchantId: 'm1', name: 'ساعة كلاسيك سوداء فاخرة', price: 45000, category: 'fashion', active: true, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60', icon: 'watch' },
      { id: 'p2', merchantId: 'm2', name: 'عطر رجالي مميز', price: 25000, category: 'other', active: true, image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60', icon: 'air_freshener' },
      { id: 'p3', merchantId: 'm1', name: 'سماعات بلوتوث عازلة للضوضاء', price: 85000, category: 'electronics', active: true, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60', icon: 'headphones' }
    ],
    orders: [
      { id: 'ORD-001', customerName: 'ياسر', customerPhone: '07711112222', city: 'بغداد', address: 'المنصور', date: '2023-10-25', status: 'completed', items: [{productId: 'p1', qty: 1, price: 45000}], total: 45000, shippingCost: 5000, merchantId: 'm1', commission: 4500 },
      { id: 'ORD-002', customerName: 'زينب', customerPhone: '07822223333', city: 'البصرة', address: 'العشار', date: '2023-10-26', status: 'shipping', items: [{productId: 'p2', qty: 2, price: 25000}], total: 50000, shippingCost: 8000, merchantId: 'm2', commission: 1000 },
      { id: 'ORD-003', customerName: 'مصطفى', customerPhone: '07933334444', city: 'بغداد', address: 'الكرادة', date: '2023-10-27', status: 'pending', items: [{productId: 'p1', qty: 1, price: 45000}], total: 45000, shippingCost: 5000, merchantId: 'm1', commission: 4500 }
    ],
    cart: [],
    settings: {
        defaultCommission: 10,
        defaultShippingBgw: 5000
    },
    currentUser: null,
    currentCategoryFilter: 'all',
    currentStoreSlug: null
  };

  // Helper functions
  const generateId = (prefix) => prefix + '-' + Math.random().toString(36).substr(2, 9);
  const formatMoney = (amount) => parseInt(amount).toLocaleString() + ' د.ع';
  const getProduct = (id) => appData.products.find(p => p.id === id);
  const getMerchant = (id) => appData.merchants.find(m => m.id === id);
  const getMerchantBySlug = (slug) => appData.merchants.find(m => m.slug === slug);
  const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/(^-|-$)+/g, '');

  
  // --- AUTH & NAVIGATION ---
  function switchView(viewId) {
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('view-join').style.display = 'none';
    const target = document.getElementById('view-' + viewId);
    if(target) target.style.display = 'flex';
  }

  function loginAs(role) {
      document.getElementById('login-user').value = role;
      document.getElementById('login-pass').value = role + '123';
      handleLogin();
  }

  function handleLogin() {
    const userVal = document.getElementById('login-user').value.toLowerCase();
    const passVal = document.getElementById('login-pass').value;
    
    // Quick login for demo buttons
    let user = appData.users.find(u => u.username === userVal);
    
    if(userVal === 'customer') {
        user = appData.users.find(u => u.role === 'customer');
    } else if (userVal === 'admin' || userVal === 'merchant' || userVal === 'shipping') {
       // bypass hash check for quick buttons
       user = appData.users.find(u => u.username === userVal);
    } else {
        // actual login attempt
        const hashedPass = CryptoJS.SHA256(passVal).toString();
        user = appData.users.find(u => u.username === userVal && u.passwordHash === hashedPass);
    }

    if (!user) {
        alert('اسم المستخدم أو كلمة المرور غير صحيحة');
        return;
    }

    appData.currentUser = user;
    
    document.getElementById('display-name').innerText = user.name;
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    
    document.getElementById('cart-btn').classList.toggle('hidden', user.role !== 'customer');
    
    renderNav();
    
    if(user.role === 'customer') {
        appData.currentStoreSlug = null; // Reset to global store on login
        showStoreCategory('all');
    }
    else if(user.role === 'admin') { showTab('admin-dashboard'); renderAdminDashboard(); }
    else if(user.role === 'merchant') { showTab('merchant-dashboard'); renderMerchantDashboard(); }
    else if(user.role === 'shipping') { showTab('shipping-dashboard'); renderShippingDashboard(); }
  }

  function renderNav() {
    const nav = document.getElementById('app-nav');
    const role = appData.currentUser.role;
    if(role === 'admin') {
      nav.innerHTML = `
        <button class="active" onclick="showTab('admin-dashboard'); renderAdminDashboard();">الرئيسية</button>
        <button onclick="showTab('admin-accounting'); renderAdminAccounting();">الحسابات والتقارير</button>
        <button onclick="showTab('admin-merchants'); renderAdminMerchants();">إدارة التجار</button>
        <button onclick="showTab('admin-settings');">إعدادات المنصة</button>
      `;
    } else if(role === 'merchant') {
      nav.innerHTML = `
        <button class="active" onclick="showTab('merchant-dashboard'); renderMerchantDashboard();">الرئيسية</button>
        <button onclick="showTab('merchant-accounting'); renderMerchantAccounting();">كشف الحساب</button>
        <button onclick="showTab('merchant-products'); renderMerchantProducts();">إدارة المنتجات</button>
      `;
    } else if(role === 'shipping') {
      nav.innerHTML = `<button class="active" onclick="showTab('shipping-dashboard'); renderShippingDashboard();">كشف الشحنات</button>`;
    } else if(role === 'customer') {
        let navHtml = '';
        if(appData.currentStoreSlug) {
             const m = getMerchantBySlug(appData.currentStoreSlug);
             navHtml = `
                <button class="active" onclick="showStoreCategory('all')">منتجات ${m?m.name:''}</button>
                <button onclick="viewGlobalStore()">العودة للمنصة الرئيسية</button>
             `;
        } else {
            navHtml = `
                <button class="active" onclick="showStoreCategory('all')">المتجر الرئيسي</button>
                <button onclick="showStoreCategory('electronics')">الإلكترونيات</button>
                <button onclick="showStoreCategory('fashion')">الأزياء</button>
                <button onclick="showTab('customer-track')">تتبع طلبي</button>
            `;
        }
        nav.innerHTML = navHtml;
    }
  }

  function showTab(tabId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');
    
    document.querySelectorAll('.nav button').forEach(b => {
      b.classList.remove('active');
      if(b.getAttribute('onclick') && b.getAttribute('onclick').includes(tabId)) b.classList.add('active');
    });
  }

  function logout() {
    appData.currentUser = null;
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('login-pass').value = '';
    switchView('login');
  }
  
  function goHome() {
      if(appData.currentUser && appData.currentUser.role === 'customer') {
          viewGlobalStore();
      }
  }

  // --- ADMIN LOGIC ---
  let chartInstance = null;
  function renderAdminDashboard() {
      // Stats
      document.getElementById('admin-total-orders').innerText = appData.orders.length.toLocaleString();
      
      const totalProfit = appData.orders
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + (o.commission || 0), 0);
      document.getElementById('admin-total-profit').innerText = totalProfit.toLocaleString();
      
      document.getElementById('admin-active-merchants').innerText = appData.merchants.filter(m => m.status === 'active').length;

      // Merchant Requests
      const reqList = document.getElementById('merchant-requests-list');
      reqList.innerHTML = appData.merchantRequests.map(req => `
        <div class="flex justify-between items-center p-3 bg-bg rounded-lg border border-border">
            <div>
                <div class="font-bold">${req.store}</div>
                <div class="text-xs text-text-mute">${req.city} - ${req.phone} (${req.name})</div>
            </div>
            <button class="btn text-sm py-1.5 px-4" onclick="openApproveModal('${req.id}')">مراجعة</button>
        </div>
      `).join('') || '<div class="text-center text-text-mute py-4">لا توجد طلبات جديدة</div>';

      initAdminChart();
  }

  function renderAdminAccounting() {
      const tbody = document.getElementById('admin-accounting-body');
      const merchantSelect = document.getElementById('admin-filter-merchant');
      
      // Populate select if empty
      if(merchantSelect.options.length <= 1) {
          appData.merchants.forEach(m => {
              const opt = document.createElement('option');
              opt.value = m.id;
              opt.text = m.name;
              merchantSelect.add(opt);
          });
      }

      const filterMerchant = merchantSelect.value;
      
      let filteredOrders = appData.orders;
      if(filterMerchant !== 'all') {
          filteredOrders = filteredOrders.filter(o => o.merchantId === filterMerchant);
      }
      
      // Sort by date desc
      filteredOrders.sort((a,b) => new Date(b.date) - new Date(a.date));

      tbody.innerHTML = filteredOrders.map(o => {
          const merchant = getMerchant(o.merchantId);
          let badgeClass = o.status === 'completed' ? 'active' : (o.status === 'pending' ? 'pending' : 'bg-blue-600');
          let statusText = o.status === 'completed' ? 'مكتمل' : (o.status === 'pending' ? 'بانتظار التجهيز' : 'قيد الشحن');
          
          return `
          <tr class="border-b border-border/50 hover:bg-bg transition-colors">
            <td class="p-3">#${o.id}</td>
            <td class="p-3">${merchant ? merchant.name : 'غير معروف'}</td>
            <td class="p-3 font-bold text-accent">${formatMoney(o.total)}</td>
            <td class="p-3 text-success">${formatMoney(o.commission || 0)}</td>
            <td class="p-3">${o.date}</td>
            <td class="p-3"><span class="badge ${badgeClass}">${statusText}</span></td>
          </tr>
      `}).join('');
  }

  function renderAdminMerchants() {
      const tbody = document.getElementById('admin-merchants-body');
      tbody.innerHTML = appData.merchants.map(m => `
        <tr class="border-b border-border/50 hover:bg-bg transition-colors">
            <td class="p-3 font-bold">${m.name}</td>
            <td class="p-3">${m.owner}</td>
            <td class="p-3">${m.city}</td>
            <td class="p-3">
                <button class="btn secondary text-xs py-1" onclick="viewStoreAsAdmin('${m.slug}')">معاينة المتجر</button>
            </td>
            <td class="p-3"><span class="badge ${m.status==='active'?'active':'danger'}">${m.status==='active'?'نشط':'موقوف'}</span></td>
            <td class="p-3">
                <button class="text-accent hover:text-white ml-2" onclick="toggleMerchantStatus('${m.id}')" title="${m.status==='active'?'إيقاف':'تفعيل'}">
                    <span class="material-symbols-outlined text-sm">${m.status==='active'?'block':'check_circle'}</span>
                </button>
            </td>
        </tr>
      `).join('');
  }
  
  function viewStoreAsAdmin(slug) {
      if(appData.currentUser && appData.currentUser.role === 'admin') {
          // Switch context temporarily to customer to view store
          const prevUser = appData.currentUser;
          appData.currentUser = appData.users.find(u => u.role === 'customer');
          viewSpecificStore(slug);
          
          // Add a back to admin button
          const nav = document.getElementById('app-nav');
          nav.innerHTML += `<button onclick="restoreAdminView()">العودة للإدارة</button>`;
      }
  }
  
  function restoreAdminView() {
      appData.currentUser = appData.users.find(u => u.role === 'admin');
      renderNav();
      showTab('admin-merchants');
  }

  function toggleMerchantStatus(id) {
      const m = getMerchant(id);
      if(m) {
          m.status = m.status === 'active' ? 'suspended' : 'active';
          renderAdminMerchants();
      }
  }

  function saveSettings() {
      appData.settings.defaultCommission = parseFloat(document.getElementById('setting-commission').value) || 10;
      appData.settings.defaultShippingBgw = parseInt(document.getElementById('setting-shipping-bgw').value) || 5000;
      alert('تم حفظ الإعدادات بنجاح');
  }

  function initAdminChart() {
      const ctx = document.getElementById('adminSalesChart');
      if(!ctx) return;
      if(chartInstance) chartInstance.destroy();
      
      chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
              labels: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
              datasets: [{
                  label: 'المبيعات (بالملايين د.ع)',
                  data: [2.1, 3.4, 2.8, 4.5, 3.9, 5.2, 6.1],
                  borderColor: '#C9A24B',
                  backgroundColor: 'rgba(201, 162, 75, 0.1)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4
              }]
          },
          options: {
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                  y: { grid: { color: '#2D2836' }, ticks: { color: '#A19BAD' } },
                  x: { grid: { color: '#2D2836' }, ticks: { color: '#A19BAD' } }
              }
          }
      });
  }

  // --- MERCHANT LOGIC ---
  function renderMerchantDashboard() {
      const mId = appData.currentUser.merchantId;
      const merchant = getMerchant(mId);
      
      document.getElementById('merchant-store-link').value = `billionaire.app/?store=${merchant.slug}`;

      const myOrders = appData.orders.filter(o => o.merchantId === mId);
      
      const balance = myOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total - (o.commission||0)), 0);
      document.getElementById('merchant-balance').innerText = balance.toLocaleString();
      
      const pendingOrders = myOrders.filter(o => o.status === 'pending');
      document.getElementById('merchant-pending-orders').innerText = pendingOrders.length;
      
      const myProducts = appData.products.filter(p => p.merchantId === mId);
      document.getElementById('merchant-total-products').innerText = myProducts.length;

      const orderList = document.getElementById('merchant-orders-list');
      orderList.innerHTML = pendingOrders.map(o => {
          const item = o.items[0];
          const prod = getProduct(item.productId);
          return `
          <div class="product-card">
            <div class="bg-bg w-16 h-16 rounded flex items-center justify-center border border-border overflow-hidden">
                ${prod && prod.image ? `<img src="${prod.image}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-text-mute text-3xl">${prod?prod.icon:'inventory_2'}</span>`}
            </div>
            <div class="flex-1">
                <div class="font-bold text-lg">${prod?prod.name:'منتج محذوف'}</div>
                <div class="text-sm text-text-mute mb-1">الزبون: ${o.customerName} - ${o.city} (${o.customerPhone})</div>
                <div class="text-accent font-bold">${formatMoney(o.total)} <span class="text-xs text-text-mute font-normal">(الكمية: ${item.qty})</span></div>
            </div>
            <div class="flex flex-col gap-2">
                <button class="btn text-sm py-2 px-6" onclick="openConfirmModal('accept_order', '${o.id}')">قبول وتجهيز</button>
                <button class="btn danger text-sm py-2 px-6" onclick="openCancelModal('${o.id}')">رفض الطلب</button>
            </div>
          </div>
      `}).join('') || '<div class="text-center text-text-mute py-4">لا توجد طلبات جديدة حالياً</div>';
  }

  function copyStoreLink() {
      const copyText = document.getElementById("merchant-store-link");
      copyText.select();
      copyText.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(copyText.value);
      alert("تم نسخ الرابط");
  }
  
  function viewMyStore() {
      const mId = appData.currentUser.merchantId;
      const merchant = getMerchant(mId);
      
      // Temporarily become a customer to view store
      appData.currentUser = appData.users.find(u => u.role === 'customer');
      viewSpecificStore(merchant.slug);
      
      // Add a back to merchant button
      const nav = document.getElementById('app-nav');
      nav.innerHTML += `<button onclick="restoreMerchantView()">العودة للوحة التحكم</button>`;
  }
  
  function restoreMerchantView() {
      appData.currentUser = appData.users.find(u => u.role === 'merchant');
      renderNav();
      showTab('merchant-dashboard');
  }

  function handleQuickAddProduct(e) {
      e.preventDefault();
      const mId = appData.currentUser.merchantId;
      const newProd = {
          id: generateId('p'),
          merchantId: mId,
          name: document.getElementById('quick-prod-name').value,
          price: parseFloat(document.getElementById('quick-prod-price').value),
          category: document.getElementById('quick-prod-cat').value,
          image: document.getElementById('quick-prod-img').value,
          active: true,
          icon: 'inventory_2'
      };
      appData.products.push(newProd);
      e.target.reset();
      renderMerchantDashboard();
      alert('تمت الإضافة بنجاح');
  }

  function renderMerchantAccounting() {
      const mId = appData.currentUser.merchantId;
      const myOrders = appData.orders.filter(o => o.merchantId === mId && o.status === 'completed');
      
      const tbody = document.getElementById('merchant-accounting-body');
      tbody.innerHTML = myOrders.map(o => {
          const prod = getProduct(o.items[0].productId);
          const net = o.total - (o.commission||0);
          return `
          <tr class="border-b border-border/50 hover:bg-bg transition-colors">
            <td class="p-3">#${o.id}</td>
            <td class="p-3">${prod?prod.name:'منتج محذوف'}</td>
            <td class="p-3 font-bold text-success">${formatMoney(net)}</td>
            <td class="p-3">${o.date}</td>
          </tr>
      `}).join('') || '<tr><td colspan="4" class="text-center p-4 text-text-mute">لا توجد حركات مسجلة</td></tr>';
  }

  function renderMerchantProducts() {
      const mId = appData.currentUser.merchantId;
      const myProducts = appData.products.filter(p => p.merchantId === mId);
      
      const tbody = document.getElementById('merchant-products-body');
      tbody.innerHTML = myProducts.map(p => `
          <tr class="border-b border-border/50 hover:bg-bg transition-colors">
            <td class="p-3 w-16 h-16">
                 ${p.image ? `<img src="${p.image}" class="w-10 h-10 object-cover rounded">` : `<div class="w-10 h-10 bg-bg rounded flex items-center justify-center border border-border"><span class="material-symbols-outlined text-text-mute text-sm">${p.icon}</span></div>`}
            </td>
            <td class="p-3 font-bold">
                 ${p.name}
            </td>
            <td class="p-3 text-accent">${formatMoney(p.price)}</td>
            <td class="p-3">${p.category}</td>
            <td class="p-3"><span class="badge ${p.active?'active':'danger'}">${p.active?'متاح':'مخفي'}</span></td>
            <td class="p-3">
                <button class="text-text-mute hover:text-white ml-2" onclick="editProduct('${p.id}')" title="تعديل"><span class="material-symbols-outlined text-sm">edit</span></button>
                <button class="text-text-mute hover:text-accent ml-2" onclick="toggleProductStatus('${p.id}')" title="إخفاء/إظهار"><span class="material-symbols-outlined text-sm">${p.active?'visibility_off':'visibility'}</span></button>
                <button class="text-danger hover:text-red-400" onclick="openConfirmModal('delete_product', '${p.id}')" title="حذف"><span class="material-symbols-outlined text-sm">delete</span></button>
            </td>
          </tr>
      `).join('') || '<tr><td colspan="6" class="text-center p-4 text-text-mute">لا توجد منتجات</td></tr>';
  }

  function openProductModal() {
      document.getElementById('product-form').reset();
      document.getElementById('product-id').value = '';
      document.getElementById('product-modal-title').innerText = 'إضافة منتج جديد';
      openModal('product-modal');
  }

  function editProduct(id) {
      const p = getProduct(id);
      if(!p) return;
      document.getElementById('product-id').value = p.id;
      document.getElementById('product-name').value = p.name;
      document.getElementById('product-price').value = p.price;
      document.getElementById('product-category').value = p.category;
      document.getElementById('product-image').value = p.image || '';
      document.getElementById('product-modal-title').innerText = 'تعديل منتج';
      openModal('product-modal');
  }

  function saveProduct(e) {
      e.preventDefault();
      const id = document.getElementById('product-id').value;
      const mId = appData.currentUser.merchantId;
      
      const pData = {
          name: document.getElementById('product-name').value,
          price: parseFloat(document.getElementById('product-price').value),
          category: document.getElementById('product-category').value,
          image: document.getElementById('product-image').value,
      };

      if(id) {
          const p = getProduct(id);
          if(p) Object.assign(p, pData);
      } else {
          appData.products.push({
              id: generateId('p'),
              merchantId: mId,
              ...pData,
              active: true,
              icon: 'inventory_2'
          });
      }
      closeModal('product-modal');
      renderMerchantProducts();
  }

  function toggleProductStatus(id) {
      const p = getProduct(id);
      if(p) { p.active = !p.active; renderMerchantProducts(); }
  }

  // --- SHIPPING LOGIC ---
  function renderShippingDashboard() {
      const cityFilter = document.getElementById('shipping-city-filter').value;
      let shippingOrders = appData.orders.filter(o => o.status === 'shipping');
      
      if(cityFilter !== 'all') {
          shippingOrders = shippingOrders.filter(o => o.city === cityFilter);
      }

      document.getElementById('shipping-pending').innerText = shippingOrders.length;
      document.getElementById('shipping-delivered').innerText = appData.orders.filter(o => o.status === 'completed' && o.date === new Date().toISOString().split('T')[0]).length;

      const list = document.getElementById('shipping-orders-list');
      list.innerHTML = shippingOrders.map(o => {
          const merchant = getMerchant(o.merchantId);
          return `
          <div class="product-card">
            <div class="bg-surface p-3 rounded-lg border border-border flex-1">
                <div class="flex justify-between items-start mb-2">
                    <div class="font-bold text-lg text-accent">فاتورة #${o.id}</div>
                    <span class="badge pending">قيد التوصيل</span>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                        <div class="text-text-mute mb-1">من (التاجر):</div>
                        <div class="font-bold">${merchant?merchant.name:'غير معروف'}</div>
                        <div class="text-xs text-text-mute mt-1">${merchant?merchant.phone:''}</div>
                    </div>
                    <div>
                        <div class="text-text-mute mb-1">إلى (الزبون):</div>
                        <div class="font-bold">${o.address}، ${o.city}</div>
                        <div class="text-xs text-text-mute mt-1">${o.customerPhone} - ${o.customerName}</div>
                    </div>
                </div>
                <div class="mt-4 pt-3 border-t border-border flex justify-between items-center">
                    <div class="text-sm">المبلغ المطلوب تحصيله: <span class="font-bold text-accent text-lg">${formatMoney(o.total + o.shippingCost)}</span></div>
                </div>
            </div>
            <div class="flex flex-col gap-2 min-w-[150px]">
                <button class="btn" onclick="updateOrderStatus('${o.id}', 'completed')">تم التوصيل</button>
                <button class="btn danger" onclick="updateOrderStatus('${o.id}', 'returned')">راجع (رفض)</button>
            </div>
          </div>
      `}).join('') || '<div class="text-center text-text-mute py-4">لا توجد شحنات حالياً</div>';
  }

  function updateOrderStatus(id, status) {
      const o = appData.orders.find(o => o.id === id);
      if(o) {
          o.status = status;
          if(status === 'completed') o.date = new Date().toISOString().split('T')[0];
          alert(`تم تحديث حالة الطلب #${id}`);
          if(appData.currentUser.role === 'shipping') renderShippingDashboard();
          if(appData.currentUser.role === 'admin') renderAdminAccounting();
      }
  }

  // --- CUSTOMER LOGIC ---
  function viewSpecificStore(slug) {
      appData.currentStoreSlug = slug;
      renderNav();
      showStoreCategory('all');
  }
  
  function viewGlobalStore() {
      appData.currentStoreSlug = null;
      renderNav();
      showStoreCategory('all');
  }

  function showStoreCategory(cat) {
      appData.currentCategoryFilter = cat;
      const titles = { 'all': 'وصل حديثاً', 'electronics': 'الإلكترونيات', 'fashion': 'الأزياء' };
      document.getElementById('storefront-title').innerText = titles[cat] || 'المنتجات';
      
      document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
      event && event.currentTarget ? event.currentTarget.classList.add('active') : null;
      
      showTab('customer-store');
      renderStorefront();
  }

  function renderStorefront() {
      const grid = document.getElementById('customer-store-grid');
      const sort = document.getElementById('store-sort').value;
      const headerDiv = document.getElementById('storefront-header');
      const globalHeader = document.getElementById('global-storefront-header');
      
      let prods = appData.products.filter(p => p.active);
      
      if(appData.currentStoreSlug) {
          const merchant = getMerchantBySlug(appData.currentStoreSlug);
          if(merchant) {
              prods = prods.filter(p => p.merchantId === merchant.id);
              headerDiv.innerHTML = `
                  <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" class="store-banner">
                  <h2 class="text-4xl font-bold text-accent mb-2">${merchant.name}</h2>
                  <p class="text-text-mute">تسوق أحدث المنتجات من متجرنا</p>
              `;
              headerDiv.classList.remove('hidden');
              globalHeader.classList.add('hidden');
          }
      } else {
          headerDiv.classList.add('hidden');
          globalHeader.classList.remove('hidden');
      }

      if(appData.currentCategoryFilter !== 'all') {
          prods = prods.filter(p => p.category === appData.currentCategoryFilter);
      }

      if(sort === 'price_asc') prods.sort((a,b) => a.price - b.price);
      else if(sort === 'price_desc') prods.sort((a,b) => b.price - a.price);
      // else 'newest' - leave as is

      grid.innerHTML = prods.map(p => {
          const m = getMerchant(p.merchantId);
          return `
          <div class="store-item">
            ${p.image ? `<img src="${p.image}" class="w-full h-48 object-cover border-b border-border">` : `<div class="h-48 bg-gray-800 flex items-center justify-center text-gray-600 border-b border-border"><span class="material-symbols-outlined text-5xl">${p.icon}</span></div>`}
            <div class="store-item-content">
                ${!appData.currentStoreSlug ? `<div class="text-xs text-accent mb-1 cursor-pointer hover:underline" onclick="viewSpecificStore('${m?m.slug:''}')">${m?m.name:''}</div>` : ''}
                <h4 class="font-bold text-lg mb-2">${p.name}</h4>
                <div class="mt-auto">
                    <div class="font-bold text-xl text-ink mb-3">${formatMoney(p.price)}</div>
                    <button class="btn w-full flex items-center justify-center gap-2" onclick="addToCart('${p.id}', this)">
                        <span class="material-symbols-outlined text-sm">add_shopping_cart</span>
                        أضف للسلة
                    </button>
                </div>
            </div>
          </div>
      `}).join('') || '<div class="col-span-full text-center text-text-mute py-10">لا توجد منتجات في هذا التصنيف</div>';
  }

  function addToCart(pId, btn) {
      const productToAdd = getProduct(pId);
      
      if(appData.cart.length > 0) {
          const firstItemProduct = getProduct(appData.cart[0].productId);
          if(firstItemProduct && productToAdd && firstItemProduct.merchantId !== productToAdd.merchantId) {
              alert("عذراً، لا يمكن خلط منتجات من تجار مختلفين في طلب واحد. يرجى إتمام الطلب الحالي أو تفريغ السلة.");
              return;
          }
      }

      const item = appData.cart.find(i => i.productId === pId);
      if(item) item.qty++;
      else appData.cart.push({ productId: pId, qty: 1 });
      
      updateCartBadge();
      
      const originalText = btn.innerHTML;
      btn.innerHTML = `<span class="material-symbols-outlined text-sm">check</span> تمت الإضافة`;
      btn.classList.add('bg-success');
      setTimeout(() => {
          btn.innerHTML = originalText;
          btn.classList.remove('bg-success');
      }, 1500);
  }

  function updateCartBadge() {
      const count = appData.cart.reduce((sum, i) => sum + i.qty, 0);
      document.getElementById('cart-count').innerText = count;
  }

  function renderCart() {
      const container = document.getElementById('cart-items-container');
      const errorMsg = document.getElementById('cart-error-message');
      
      // Check for mixed merchants just in case
      let merchantsInCart = new Set();
      appData.cart.forEach(item => {
          const p = getProduct(item.productId);
          if(p) merchantsInCart.add(p.merchantId);
      });
      
      if(merchantsInCart.size > 1) {
          errorMsg.classList.remove('hidden');
      } else {
          errorMsg.classList.add('hidden');
      }

      if(appData.cart.length === 0) {
          container.innerHTML = '<div class="text-center text-text-mute py-4">السلة فارغة</div>';
          document.getElementById('cart-subtotal').innerText = '0 د.ع';
          document.getElementById('cart-total').innerText = '0 د.ع';
          return;
      }

      let subtotal = 0;
      container.innerHTML = appData.cart.map(i => {
          const p = getProduct(i.productId);
          if(!p) return '';
          subtotal += p.price * i.qty;
          return `
          <div class="flex justify-between items-center p-3 bg-bg rounded-lg border border-border">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-gray-800 rounded flex items-center justify-center overflow-hidden">
                    ${p.image ? `<img src="${p.image}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-gray-500">${p.icon}</span>`}
                </div>
                <div>
                    <div class="font-bold">${p.name}</div>
                    <div class="text-accent text-sm">${formatMoney(p.price)}</div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <button class="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center hover:text-accent" onclick="updateCartQty('${p.id}', -1)">-</button>
                <span>${i.qty}</span>
                <button class="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center hover:text-accent" onclick="updateCartQty('${p.id}', 1)">+</button>
                <button class="text-danger ml-2 hover:bg-danger/10 p-1 rounded" onclick="removeFromCart('${p.id}')"><span class="material-symbols-outlined text-sm">delete</span></button>
            </div>
          </div>
      `}).join('');

      const shipping = parseInt(document.getElementById('shipping-zone').value) || 0;
      
      document.getElementById('cart-subtotal').innerText = formatMoney(subtotal);
      document.getElementById('cart-shipping-cost').innerText = formatMoney(shipping);
      document.getElementById('cart-total').innerText = formatMoney(subtotal + shipping);
  }

  function updateCartQty(pId, delta) {
      const item = appData.cart.find(i => i.productId === pId);
      if(item) {
          item.qty += delta;
          if(item.qty <= 0) removeFromCart(pId);
          else { updateCartBadge(); renderCart(); }
      }
  }

  function removeFromCart(pId) {
      appData.cart = appData.cart.filter(i => i.productId !== pId);
      updateCartBadge();
      renderCart();
  }

  function checkout() {
      if(appData.cart.length === 0) return alert('السلة فارغة');
      
      // Validation for mixed merchants
      let merchantsInCart = new Set();
      appData.cart.forEach(item => {
          const p = getProduct(item.productId);
          if(p) merchantsInCart.add(p.merchantId);
      });
      
      if(merchantsInCart.size > 1) {
          return alert('لا يمكن إتمام الطلب لأن السلة تحتوي على منتجات من تجار مختلفين. يرجى تفريغ السلة والمحاولة مجدداً.');
      }
      
      const name = document.getElementById('checkout-name').value;
      const phone = document.getElementById('checkout-phone').value;
      const address = document.getElementById('checkout-address').value;
      const zoneSelect = document.getElementById('shipping-zone');
      const city = zoneSelect.options[zoneSelect.selectedIndex].text.split(' ')[0];
      const shippingCost = parseInt(zoneSelect.value);

      if(!name || !phone || !address) return alert('يرجى إكمال معلومات التوصيل');

      const merchantGroups = {};
      appData.cart.forEach(item => {
          const p = getProduct(item.productId);
          if(!p) return;
          if(!merchantGroups[p.merchantId]) merchantGroups[p.merchantId] = [];
          merchantGroups[p.merchantId].push({...item, price: p.price});
      });

      const newOrderIds = [];
      for(const mId in merchantGroups) {
          const items = merchantGroups[mId];
          const total = items.reduce((s, i) => s + (i.price * i.qty), 0);
          const orderId = generateId('ORD').toUpperCase();
          newOrderIds.push(orderId);
          
          appData.orders.push({
              id: orderId,
              customerName: name,
              customerPhone: phone,
              city: city,
              address: address,
              date: new Date().toISOString().split('T')[0],
              status: 'pending',
              items: items,
              total: total,
              shippingCost: shippingCost, // simplified: charging shipping per merchant order
              merchantId: mId,
              commission: total * (appData.settings.defaultCommission / 100)
          });
      }

      appData.cart = [];
      updateCartBadge();
      closeModal('cart-modal');
      alert(`تم استلام طلبك بنجاح! رقم الطلب: ${newOrderIds.join(', ')}`);
  }

  function trackOrder() {
      const id = document.getElementById('track-order-id').value.trim();
      const resDiv = document.getElementById('track-result');
      resDiv.classList.remove('hidden');
      
      if(!id) {
          resDiv.innerHTML = '<p class="text-danger">يرجى إدخال رقم الطلب</p>';
          return;
      }

      const order = appData.orders.find(o => o.id === id);
      if(!order) {
          resDiv.innerHTML = '<p class="text-danger">لم يتم العثور على طلب بهذا الرقم</p>';
          return;
      }

      let statusMap = {
          'pending': {text: 'قيد المراجعة لدى التاجر', color: 'text-warn', icon: 'pending_actions'},
          'shipping': {text: 'قيد الشحن والتوصيل', color: 'text-blue-500', icon: 'local_shipping'},
          'completed': {text: 'تم التوصيل بنجاح', color: 'text-success', icon: 'task_alt'},
          'returned': {text: 'تم الإرجاع', color: 'text-danger', icon: 'assignment_return'}
      };
      
      let s = statusMap[order.status] || statusMap['pending'];

      resDiv.innerHTML = `
        <div class="p-4 bg-bg rounded-lg border border-border mt-4 text-right">
            <h4 class="font-bold mb-2">تفاصيل الطلب #${order.id}</h4>
            <div class="flex items-center gap-3 mb-4">
                <span class="material-symbols-outlined text-3xl ${s.color}">${s.icon}</span>
                <span class="font-bold text-lg ${s.color}">${s.text}</span>
            </div>
            <div class="text-sm text-text-mute mb-1">الاسم: <span class="text-white">${order.customerName}</span></div>
            <div class="text-sm text-text-mute mb-1">التاريخ: <span class="text-white">${order.date}</span></div>
            <div class="text-sm text-text-mute">الإجمالي: <span class="text-white font-bold">${formatMoney(order.total + order.shippingCost)}</span></div>
        </div>
      `;
  }

  // --- JOIN REQUEST ---
  function handleJoinRequest(e) {
      e.preventDefault();
      const name = document.getElementById('join-name').value;
      const store = document.getElementById('join-store').value;
      const phone = document.getElementById('join-phone').value;
      const city = document.getElementById('join-city').value;

      appData.merchantRequests.push({
          id: generateId('req'),
          name, store, phone, city,
          date: new Date().toISOString().split('T')[0]
      });

      alert('تم إرسال طلبك بنجاح. سيتم مراجعته من قبل الإدارة.');
      e.target.reset();
      switchView('login');
  }

  // --- MODAL HELPERS ---
  function openModal(id) { 
      document.getElementById(id).classList.add('show'); 
      if(id === 'cart-modal') renderCart();
  }
  function closeModal(id) { document.getElementById(id).classList.remove('show'); }

  // Admin Approve Modal
  function openApproveModal(reqId) {
      const req = appData.merchantRequests.find(r => r.id === reqId);
      if(!req) return;
      document.getElementById('approve-merchant-id').value = reqId;
      document.getElementById('approve-merchant-name').innerText = req.store;
      document.getElementById('approve-merchant-info').innerText = `${req.city} - ${req.phone} (${req.name})`;
      openModal('approve-modal');
  }

  function confirmApproveMerchant() {
      const reqId = document.getElementById('approve-merchant-id').value;
      const req = appData.merchantRequests.find(r => r.id === reqId);
      const username = document.getElementById('approve-username').value;
      const pass = document.getElementById('approve-password').value;
      const comm = document.getElementById('approve-commission').value;

      if(!username || !pass) return alert('يرجى ملء بيانات الدخول');

      const mId = generateId('m');
      
      // Create Merchant
      appData.merchants.push({
          id: mId,
          name: req.store,
          slug: generateSlug(req.store),
          owner: req.name,
          phone: req.phone,
          city: req.city,
          status: 'active',
          commissionType: comm
      });

      // Create User
      appData.users.push({
          id: generateId('u'),
          username: username,
          passwordHash: CryptoJS.SHA256(pass).toString(),
          role: 'merchant',
          name: req.store,
          merchantId: mId
      });

      // Remove req
      appData.merchantRequests = appData.merchantRequests.filter(r => r.id !== reqId);

      closeModal('approve-modal');
      renderAdminDashboard();
      alert('تم تفعيل حساب التاجر بنجاح');
  }

  // Merchant Cancel Order Modal
  function openCancelModal(orderId) {
      document.getElementById('cancel-order-id').value = orderId;
      openModal('cancel-reason-modal');
  }
  function confirmCancelOrder() {
      const id = document.getElementById('cancel-order-id').value;
      updateOrderStatus(id, 'returned');
      closeModal('cancel-reason-modal');
  }

  // Generic Confirm Modal
  function openConfirmModal(action, id) {
      document.getElementById('confirm-action-type').value = action;
      document.getElementById('confirm-item-id').value = id;
      openModal('confirm-modal');
  }
  function executeConfirmAction() {
      const action = document.getElementById('confirm-action-type').value;
      const id = document.getElementById('confirm-item-id').value;
      
      if(action === 'delete_product') {
          appData.products = appData.products.filter(p => p.id !== id);
          renderMerchantProducts();
      } else if (action === 'accept_order') {
          updateOrderStatus(id, 'shipping');
          renderMerchantDashboard();
      }
      
      closeModal('confirm-modal');
  }

  // --- EXPORT TO EXCEL ---
  function exportExcel(tableId, filename) {
      const table = document.getElementById(tableId);
      if(!table) return;
      const wb = XLSX.utils.table_to_book(table, {sheet: "Sheet1"});
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

</script>
</body></html>
