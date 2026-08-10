// ============================================================
// core.js — Billionaire platform: SHARED code
// Used by every screen: login, Firebase/storage, the public customer
// storefront (cart + checkout), and small shared helpers used by both
// the admin.js and merchant.js dashboards (order labels, cancel modal,
// live 5-second refresh + notifications...).
//
// Load order matters: this file MUST be loaded BEFORE admin.js and
// merchant.js, since it defines `data`, `currentRole`, `saveData()`,
// etc. that they both depend on.
// ============================================================

// NOTE: normal (non-module) script on purpose — module scripts have their own private scope,
// so onclick="..." handlers in the HTML can't find functions defined inside a module script.
// ---------- REAL BACKEND STORAGE (Firebase Firestore) ----------
// All merchants, customers, and the admin read/write the SAME data, from any device,
// any browser, anywhere — because it's stored centrally on Firebase, not in the local browser.
//
// IMPORTANT: Firebase is loaded below with a *dynamic* import() inside a try/catch —
// not a static "import ... from ..." at the top of the file. A static import that fails
// to load (blocked CDN, dropped connection, ad-blocker, etc.) stops this ENTIRE module
// script from ever running — meaning every button on the whole page, including the
// login button, would silently do nothing, with no visible error. A dynamic import lets
// us catch that failure here and keep the app usable (with a clear warning) instead of
// the whole page going dead.
const firebaseConfig = {
  apiKey: "AIzaSyADJJPx-5kRbohxIMHNRzAKZ83M5IWfwOE",
  authDomain: "billionaire-835c0.firebaseapp.com",
  projectId: "billionaire-835c0",
  storageBucket: "billionaire-835c0.firebasestorage.app",
  messagingSenderId: "215033234804",
  appId: "1:215033234804:web:45a3514445df63b414d821",
  measurementId: "G-33Z57QPT6C"
};

window.__usingLocalFallback = false;

async function initStorage() {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut: authSignOut, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    const firebaseApp = initializeApp(firebaseConfig);
    const db = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);

    // Secondary, fully isolated Auth instance used ONLY when the admin creates a new
    // merchant account. Firebase's client SDK auto-signs-in as whatever account you just
    // created — without this second instance, approving a merchant would silently log the
    // admin out of their own session and into the new merchant's account instead.
    const secondaryApp = initializeApp(firebaseConfig, "account-creation");
    const secondaryAuth = getAuth(secondaryApp);

    // Firebase Authentication only understands emails, not usernames — so every username
    // in this app maps deterministically to a fake, never-emailed address on a fixed domain.
    // The person never sees this; they keep typing a plain username everywhere in the UI.
    const emailFor = (username) => username.trim().toLowerCase().replace(/\s+/g, '') + '@billionaire.local';

    window.authApi = {
      emailFor,
      async signIn(username, password) {
        const cred = await signInWithEmailAndPassword(auth, emailFor(username), password);
        return cred.user.uid;
      },
      async signOutMain() { await authSignOut(auth); },
      // Lets whoever is currently signed in change their own password (must re-prove
      // their current password first — a Firebase security requirement). NOTE: username
      // (email) changes are NOT supported here — Firebase now requires verifying the new
      // address via a real, clickable email link before it takes effect, which is
      // impossible for these synthetic @billionaire.local addresses (no real inbox).
      async changeMyPassword(oldPassword, newPassword) {
        const user = auth.currentUser;
        if (!user) throw new Error('not-signed-in');
        const cred = EmailAuthProvider.credential(user.email, oldPassword);
        await reauthenticateWithCredential(user, cred); // throws auth/wrong-password if oldPassword is wrong
        await updatePassword(user, newPassword);
      },
      async createAccount(username, password) {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, emailFor(username), password);
        await authSignOut(secondaryAuth); // clean up the isolated session — admin's own login is untouched
        return cred.user.uid;
      },
      async getPublicDoc(collectionName, uid) {
        const snap = await getDoc(doc(db, collectionName, uid));
        return snap.exists() ? snap.data() : null;
      },
      async getPrivateDoc(collectionName, uid) {
        const snap = await getDoc(doc(db, collectionName, uid));
        return snap.exists() ? snap.data() : null;
      },
      async saveDoc(collectionName, uid, payload) {
        await setDoc(doc(db, collectionName, uid), payload);
      },
      async deleteDoc(collectionName, uid) {
        await deleteDoc(doc(db, collectionName, uid));
      },
      async listCollection(collectionName) {
        const snap = await getDocs(collection(db, collectionName));
        return snap.docs.map(d => ({ _uid: d.id, ...d.data() }));
      }
    };

    // Same get/set(key, value, shared) shape the rest of this file already expects,
    // so nothing else in the app needs to change — just what's underneath it.
    window.storage = {
      async get(key) {
        const ref = doc(db, "storage", key);
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error('key not found');
        return { key, value: snap.data().value };
      },
      async set(key, value) {
        const ref = doc(db, "storage", key);
        await setDoc(ref, { value });
        return { key, value };
      }
    };
  } catch (e) {
    // Firebase failed to load or connect (blocked CDN, no internet, ad-blocker, temporary
    // outage, etc). Fall back to this browser's own local storage so the app still works
    // instead of freezing completely — but flag it so we can warn whoever is using it that
    // their data is NOT syncing with other devices/browsers right now.
    console.error('Firebase failed to load — falling back to local-only storage on this browser:', e);
    window.__usingLocalFallback = true;
    window.storage = {
      async get(key) {
        const raw = localStorage.getItem('local-fallback:' + key);
        if (raw === null) throw new Error('key not found');
        return { key, value: raw };
      },
      async set(key, value) {
        localStorage.setItem('local-fallback:' + key, value);
        return { key, value };
      }
    };
  }
}

const STORAGE_KEY = 'platform-data-v1';
const IRAQ_GOVERNORATES = [
  'بغداد','البصرة','نينوى','أربيل','النجف','كربلاء','الأنبار','ديالى','كركوك',
  'واسط','ذي قار','بابل','ميسان','المثنى','القادسية','صلاح الدين','دهوك','السليمانية'
];
const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

let data = {
  version: 0,
  merchants: [],
  orders: [],
  settings: {
    feeSource: 'customer',
    feeType: 'fixed',
    feeAmount: 500,
    feeCustomer: 500,
    feeMerchant: 500,
    itemDeduction: 0,
    shippingEnabled: true,
    shippingAmount: 1000,
    shippingZones: [
      { id: 'z1', name: 'بغداد', fastPrice: 4000, slowPrice: 2000 },
      { id: 'z2', name: 'باقي المحافظات', fastPrice: 7000, slowPrice: 4000 }
    ],
    adminUsername: 'admin',
    adminPassword: 'admin123'
  },
  nextId: 1
};

// Passwords are never stored or compared in plain text — only their SHA-256 hash is kept.
// This means once a password is set, nobody (including the admin) can "see" it again —
// only reset it to a new value. That's the correct, secure pattern for handling credentials.
async function hashPassword(plain) {
  const bytes = new TextEncoder().encode(String(plain));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function looksHashed(str) {
  return typeof str === 'string' && /^[0-9a-f]{64}$/.test(str);
}
// One-time migration: any credential still stored as plain text (old demo data, or data
// saved before hashing existed) gets hashed in place the first time it's loaded.
async function migratePlainTextPasswords() {
  let changed = false;
  if (data.settings.adminPassword && !looksHashed(data.settings.adminPassword)) {
    data.settings.adminPassword = await hashPassword(data.settings.adminPassword);
    changed = true;
  }
  for (const m of data.merchants) {
    if (m.password && !looksHashed(m.password)) { m.password = await hashPassword(m.password); changed = true; }
  }
  if (changed) await saveData();
}

// Merchants/orders now live in their own protected Firestore documents
// (see initStorage) instead of one shared blob. This map remembers the last-synced JSON of
// every order so saveData() only re-writes orders that actually changed, instead of
// re-uploading the entire order history on every single save.
let lastSyncedOrderSnapshots = new Map();

// Shared by loadData() (full page load) AND pollForUpdates() (the every-5-seconds live
// refresh) — both need to re-fetch the same split collections the same permission-safe way.
async function fetchAllCollections() {
  if (!window.authApi) return;
  const safeList = async (name) => { try { return await window.authApi.listCollection(name); } catch (e) { return []; } };
  const safePriv = async (col, uid) => { try { return await window.authApi.getPrivateDoc(col, uid); } catch (e) { return null; } };
  const [merchantPubs, orderDocs, joinRequests] = await Promise.all([
    safeList('merchants'),
    safeList('orders'),
    safeList('join_requests')
  ]);
  const merchantPrivs = await Promise.all(merchantPubs.map(m => safePriv('merchant_private', m._uid)));
  const approvedMerchants = merchantPubs.map((m, i) => ({ ...m, ...(merchantPrivs[i] || { balance: 0, salesCount: 0 }), authUid: m._uid }));
  // Pending join requests (submitted by anyone, not yet approved — no login account exists
  // for them yet) live in their own collection so an anonymous visitor can create one
  // without needing write access to anything else.
  const pendingMerchants = joinRequests.map(r => { const { _uid, ...rest } = r; return rest; });
  data.merchants = [...approvedMerchants, ...pendingMerchants];
  data.orders = orderDocs.map(o => { const { _uid, ...rest } = o; return rest; });
  data.orders.forEach(o => lastSyncedOrderSnapshots.set(o.id, JSON.stringify(o)));
}

async function loadData() {
  try {
    // Settings + the shared id counter still live in one small doc — admin-only to write,
    // publicly readable (customers need fee/shipping-zone info to price their own orders).
    const result = await window.storage.get('platform-settings', true);
    if (result && result.value) {
      const loaded = JSON.parse(result.value);
      data.settings = loaded.settings || data.settings;
      data.nextId = loaded.nextId || data.nextId;
      data.version = loaded.version || 0;
    }
  } catch (e) {
    if (e && e.message !== 'key not found') console.error('Storage error while loading settings:', e);
  }
  loadedVersion = data.version || 0;

  try {
    await fetchAllCollections();
  } catch (e) {
    console.error('Storage error while loading merchants/shipping/orders:', e);
  }

  await migratePlainTextPasswords();
  data.merchants.forEach(ensureMerchantTheme);
  data.orders.forEach(o => {
    if (!o.status) o.status = 'accepted';
    // 'with_shipping' was the old "handed to a shipping company" state — shipping companies
    // no longer exist, so any order still carrying that state goes back to 'none' (awaiting
    // the admin to mark it delivered/returned directly).
    if (!o.deliveryStatus || o.deliveryStatus === 'with_shipping') o.deliveryStatus = 'none';
    if (typeof o.itemDeduction !== 'number') o.itemDeduction = 0;
    if (typeof o.cancelled !== 'boolean') o.cancelled = false;
  });
  if (typeof data.settings.itemDeduction !== 'number') data.settings.itemDeduction = 0;
  if (!Array.isArray(data.settings.shippingZones) || data.settings.shippingZones.length === 0) {
    data.settings.shippingZones = [
      { id: 'z1', name: 'بغداد', fastPrice: 4000, slowPrice: 2000 },
      { id: 'z2', name: 'باقي المحافظات', fastPrice: 7000, slowPrice: 4000 }
    ];
  }
  if (!data.settings.adminPassword) data.settings.adminPassword = 'admin123';
  if (!data.settings.adminUsername) data.settings.adminUsername = 'admin';
  if (!data.settings.feeType) data.settings.feeType = 'fixed';
  captureNotifyBaseline();
  routeOnLoad();
}

// ---------- ROUTING: public store link vs login screen ----------
// A merchant's unique store link looks like: yourdomain.com/page.html?store=SLUG
// Anyone opening that link goes straight to that merchant's storefront — no login, no nav, nothing else.
function routeOnLoad() {
  const params = new URLSearchParams(location.search);
  const slug = params.get('store');
  if (slug) {
    openPublicStore(decodeURIComponent(slug));
    return;
  }
  if (params.get('join') === '1') {
    showJoinScreen();
    return;
  }
  showLoginScreen();
}

let publicStoreMerchantId = null;

function openPublicStore(slug) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('join-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'none';
  document.getElementById('public-store-screen').style.display = 'block';
  const m = data.merchants.find(x => x.linkSlug === slug && x.status === 'active');
  const brandEl = document.getElementById('public-store-brand');
  const content = document.getElementById('public-storefront-content');
  if (!m) {
    brandEl.textContent = 'المتجر غير متاح';
    content.innerHTML = '<div class="card"><div class="empty">هذا الرابط غير صحيح أو المتجر غير متاح حالياً</div></div>';
    return;
  }
  publicStoreMerchantId = m.id;
  brandEl.textContent = m.shop;
  m.visits = (m.visits || 0) + 1;
  saveData();
  renderStorefrontInto(m.id, content);
}

// Backfill theme/shipping fields for merchants created before these features existed
function ensureMerchantTheme(m) {
  if (!m.theme) m.theme = { primaryColor: '#C77B4A', logo: null, banner: null };
  if (typeof m.shippingAmount !== 'number') m.shippingAmount = data.settings.shippingAmount;
  if (!m.feeType) m.feeType = 'fixed';
  if (typeof m.itemDeduction !== 'number') m.itemDeduction = data.settings.itemDeduction || 0;
  if (!m.dashboardColor) m.dashboardColor = '#C9A24B';
  if (typeof m.visits !== 'number') m.visits = 0;
  return m;
}

// ---------- IMAGE HELPERS ----------
// Reads an image file, downsizes it, and returns a compressed base64 data URL
// so uploaded photos don't blow past storage limits.
function resizeImageFile(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
          else { width = Math.round(width * maxDim / height); height = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('تعذر تحميل الصورة'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('تعذر قراءة الملف'));
    reader.readAsDataURL(file);
  });
}
// Optimistic concurrency: the shared storage has no real transactions, so before writing we
// check nobody else saved since we last synced. If someone did, we refuse to blindly overwrite
// their changes (which is what caused silent data loss before) — we warn and reload instead.
let loadedVersion = 0;
// Counts merchant document writes that are currently in flight.
// pollForUpdates() must NOT replace data.merchants/data.orders while this is
// above zero — otherwise a periodic refresh can race an in-progress save (e.g. right after
// a merchant adds a product), fetch the OLD server copy first, and silently wipe out the
// change that was just made locally before its write ever reached the server. That race was
// the cause of "add a new product and the previous one disappears".
let pendingMerchantWrites = 0;

async function saveData() {
  // Block pollForUpdates() for the ENTIRE duration of this save — not just while the
  // merchant document itself is being written. Previously the counter only went up once we
  // reached the merchant-write step below, leaving a gap right at the start (while we're
  // still awaiting the settings-version check) where a poll could slip in, fetch the OLD
  // server copy, and overwrite the change we were about to save before it ever landed. That
  // gap was the real cause of "add a product, go back and add a second one, the first
  // disappears" — and the same gap could just as easily delay a freshly placed customer
  // order from showing up immediately on the merchant's screen. Counting from the very first
  // line closes that gap completely.
  pendingMerchantWrites++;
  try {
    // Settings are admin-only to write now, so most callers here (a customer checking
    // out, a merchant accepting an order) simply
    // don't have permission to touch this doc — and that's expected, not an error. We only
    // treat it as a real problem (and only reload the page) when we DO have permission but
    // someone else changed it first, i.e. an actual conflicting write we detected.
    try {
      const current = await window.storage.get('platform-settings', true).catch(() => null);
      const remoteVersion = current && current.value ? (JSON.parse(current.value).version || 0) : 0;
      if (remoteVersion !== loadedVersion) {
        showToast('⚠️ صار تحديث من مكان ثاني — جاري تحديث الصفحة لتفادي فقدان بيانات');
        setTimeout(() => location.reload(), 1500);
        return false;
      }
      data.version = remoteVersion + 1;
      await window.storage.set('platform-settings', JSON.stringify({ settings: data.settings, nextId: data.nextId, version: data.version }), true);
      loadedVersion = data.version;
    } catch (e) {
      if (!(e && (e.code === 'permission-denied' || /permission/i.test(e.message || '')))) {
        console.error('Settings sync failed:', e);
      }
    }

    // Merchants and orders each live in their own protected Firestore documents (see
    // initStorage). A failure here (e.g. a merchant trying to touch another merchant's
    // document) is expected for cross-role calls and must never block a save the current
    // user IS allowed to make — but a failure on a save the user WAS allowed to make (their
    // own store) must be surfaced, never swallowed, or changes silently vanish.
    //
    // Orders are different from merchant documents: there's no "wrong tenant" scenario for
    // them — a customer placing a new order, a merchant accepting one, or the admin marking
    // one delivered are ALL legitimate writes that should always be allowed. So unlike the
    // merchant-write check above, ANY failure here (permission-denied included) is a real
    // problem worth surfacing — most likely the Firestore security rules for the "orders"
    // collection don't allow the write that was just attempted (e.g. a not-logged-in
    // customer creating a new order document) and need to be updated in the Firebase console.
    let ownWriteFailed = false;
    let orderWriteFailed = false;
    if (window.authApi) {
      const merchantWrites = data.merchants.filter(m => m.authUid).map(async (m) => {
        const { password: _pw, balance: _b, salesCount: _s, authUid: _a, _uid: _u, ...publicFields } = m;
        try {
          await window.authApi.saveDoc('merchants', m.authUid, publicFields);
          await window.authApi.saveDoc('merchant_private', m.authUid, { balance: m.balance || 0, salesCount: m.salesCount || 0 });
        } catch (e) {
          const isPermission = e && (e.code === 'permission-denied' || /permission/i.test(e.message || ''));
          if (!isPermission) {
            console.error('Merchant sync failed for', m.authUid, e);
            if (loggedInMerchantId === m.id) ownWriteFailed = true;
          }
        }
      });
      // Pending (not-yet-approved) merchant requests have no login account/uid yet, so they
      // go to their own collection instead — anyone can create one, only the admin can read it.
      const joinWrites = data.merchants.filter(m => !m.authUid && m.status === 'pending').map(m =>
        window.authApi.saveDoc('join_requests', String(m.id), m).catch(() => {})
      );
      // Only orders that actually changed since the last save get re-written — cheap
      // in-memory diff, so this stays fast even once order history grows large.
      const orderWrites = data.orders.filter(o => lastSyncedOrderSnapshots.get(o.id) !== JSON.stringify(o)).map(o => {
        const json = JSON.stringify(o);
        return window.authApi.saveDoc('orders', String(o.id), o)
          .then(() => lastSyncedOrderSnapshots.set(o.id, json))
          .catch(e => { console.error('order sync failed for', o.id, e); orderWriteFailed = true; });
      });
      // Wait for all of it so callers (like addProduct) know the write actually landed
      // before they consider the action "done" — instead of firing-and-forgetting it.
      await Promise.all([...merchantWrites, ...joinWrites, ...orderWrites]);
    }

    if (ownWriteFailed || orderWriteFailed) {
      showToast('⚠️ تعذر حفظ التغيير على قاعدة البيانات — تحقق من الإنترنت وحاول مرة ثانية');
      return false;
    }
    return true;
  } catch (e) {
    console.error('Storage error while saving:', e);
    return false;
  } finally {
    pendingMerchantWrites--;
  }
}

function openLegalModal() { document.getElementById('legal-modal').classList.add('show'); }
function closeLegalModal() { document.getElementById('legal-modal').classList.remove('show'); }

// Every order-mutating action (accept/reject/cancel/mark-delivered/mark-returned/removal
// approve-deny) follows the same pattern: change the order locally first (so the screen feels
// instant), THEN save. If that save genuinely fails — no internet, a Firestore rules
// rejection, etc. — the local change never actually reached the database. Leaving that fake
// "accepted" (or whatever) state sitting in the browser was exactly the bug where accepting an
// order made it disappear from "new orders", only for the very next 5-second background
// refresh to pull the real (still-pending) server copy and pop it right back up — looking
// like a brand new order, over and over. Re-fetching the real server state immediately on
// failure, instead of trusting the optimistic local change, closes that gap for good.
async function saveOrResync(successMsg) {
  const saved = await saveData();
  if (!saved) {
    showToast('⚠️ تعذر حفظ التغيير — تحقق من الإنترنت وحاول مرة ثانية', 3500);
    try { await fetchAllCollections(); data.merchants.forEach(ensureMerchantTheme); } catch (e) { console.error('Resync after failed save also failed:', e); }
  } else if (successMsg) {
    showToast(successMsg);
  }
  renderAll();
}

function showToast(msg, duration) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration || 1800);
}

// ---------- ROLE-BASED NAV ----------
// Each role only ever sees its own set of tabs — a merchant can never reach another
// merchant's dashboard.
function viewsForRole(role) {
  if (role === 'admin') return ADMIN_VIEWS;
  if (role === 'merchant') return MERCHANT_VIEWS;
  return [];
}

function buildNav(role) {
  const nav = document.getElementById('nav');
  const list = viewsForRole(role);
  // A single-tab role (merchant) doesn't need a tab bar at all
  nav.style.display = list.length > 1 ? 'flex' : 'none';
  nav.innerHTML = list.map(v => `<button data-view="${v.id}" onclick="showView('${v.id}')">${v.label}</button>`).join('');
}

function showView(id) {
  // Scoped to #app-shell only — otherwise this also strips the "active" class off the
  // public storefront's own .view wrapper (any admin/merchant/shipping login in the same
  // page session would then leave the storefront permanently blank if ever shown again
  // without a full page reload).
  document.querySelectorAll('#app-shell .view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
  const viewEl = document.getElementById('view-' + id);
  if (viewEl) viewEl.classList.add('active');
  const navBtn = document.querySelector(`.nav button[data-view="${id}"]`);
  if (navBtn) navBtn.classList.add('active');
  renderAll();
}

// ---------- SESSION / AUTHENTICATION ----------
let currentRole = null; // 'admin' | 'merchant'

function showLoginScreen() {
  document.getElementById('public-store-screen').style.display = 'none';
  document.getElementById('join-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').textContent = '';
}

function showJoinScreen() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('public-store-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'none';
  document.getElementById('join-screen').style.display = 'flex';
}

// One login box, one set of credentials — the account type (admin / merchant /
// is looked up automatically and decides what the person sees next.
// The admin account is recognized by its permanent Firebase Auth UID, never by email —
// so you're free to change the admin's login email/username anytime from Firebase Console
// (Authentication → Users → edit email) without ever needing a code change again.
const ADMIN_UID = 'lAtbMGRDOkVuR4AONtckBMTVXG92';

async function platformLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const errorBox = document.getElementById('login-error');

  // NEW accounts (approved from now on) use real Firebase Authentication. We try this
  // first since it's the secure path; if it fails for any reason (this is an old-style
  // account that predates this system, wrong password, etc.) we silently fall back to
  // the legacy check below — the person never sees a difference either way.
  if (window.authApi) {
    try {
      const uid = await window.authApi.signIn(username, password);
      if (uid === ADMIN_UID) {
        errorBox.textContent = '';
        enterApp('admin');
        return;
      }
      const merchant = data.merchants.find(x => x.authUid === uid && x.status !== 'pending');
      if (merchant) {
        errorBox.textContent = '';
        loggedInMerchantId = merchant.id;
        enterApp('merchant');
        return;
      }
      // Signed in successfully via Firebase Auth but no matching local record —
      // fall through to the legacy checks below rather than silently failing the login.
    } catch (e) {
      // auth/user-not-found or auth/wrong-password just means: not a new-style account
      // (or wrong password) — fall through to the legacy check, same as before.
    }
  }

  const passwordHash = await hashPassword(password);
  if (username === data.settings.adminUsername && passwordHash === data.settings.adminPassword) {
    errorBox.textContent = '';
    enterApp('admin');
    return;
  }
  const merchant = data.merchants.find(x => x.username === username && x.password === passwordHash && x.status !== 'pending');
  if (merchant) {
    errorBox.textContent = '';
    loggedInMerchantId = merchant.id;
    enterApp('merchant');
    return;
  }
  errorBox.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
}

function enterApp(role) {
  currentRole = role;
  // Reset the notification baseline to "right now" so the first poll tick after logging in
  // doesn't treat things that were ALREADY sitting there before login as if they just arrived.
  captureNotifyBaseline();
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('join-screen').style.display = 'none';
  document.getElementById('public-store-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'block';

  const roleLabels = { admin: 'أدمن', merchant: 'تاجر' };
  document.getElementById('topbar-role').textContent = roleLabels[role] || '';
  let name = '';
  if (role === 'admin') { name = data.settings.adminDisplayName || data.settings.adminUsername; applyMerchantDashboardColor(null); }
  if (role === 'merchant') { const m = data.merchants.find(x => x.id === loggedInMerchantId); name = m ? m.shop : ''; applyMerchantDashboardColor(m); }
  document.getElementById('topbar-name').textContent = name;

  buildNav(role);
  if (role === 'admin') showView('dashboard');
  else if (role === 'merchant') showView('merchant');
}

function platformLogout() {
  // Close any confirm/action modal that might still be open (the admin delivery-control
  // screen in particular opens one for "mark delivered" / "cancel" actions). A modal overlay
  // is position:fixed, covers the whole screen, and sits above everything else (z-index 200)
  // — if it was left open when logout was clicked, it kept covering the login screen
  // underneath and silently swallowed every click on it, making login look broken right
  // after leaving that page. Explicitly hiding every modal here guarantees the login screen
  // is actually reachable afterward.
  document.querySelectorAll('.modal-overlay.show').forEach(el => el.classList.remove('show'));

  currentRole = null;
  loggedInMerchantId = null;
  applyMerchantDashboardColor(null);
  // Also end the real Firebase session, not just the local "who's logged in" variables —
  // otherwise the browser stays authenticated as the account that just "logged out", which
  // is the wrong state to be sitting in on a shared/public device and can make the very next
  // sign-in behave unpredictably (e.g. the polling loop briefly querying with stale
  // permissions while the old session and the new one overlap).
  if (window.authApi) window.authApi.signOutMain().catch(() => {});
  showLoginScreen();
}

// ---------- MERCHANT REQUESTS ----------
async function submitRequest() {
  const name = document.getElementById('req-name').value.trim();
  const shop = document.getElementById('req-shop').value.trim();
  const phone = document.getElementById('req-phone').value.trim();
  const governorate = document.getElementById('req-governorate').value;
  const area = document.getElementById('req-area').value.trim();
  if (!name || !shop || !phone) { showToast('عبي كل الحقول'); return; }

  const submitBtn = document.querySelector('#join-screen .btn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'جاري الإرسال...'; }

  const s = data.settings;
  const newId = Date.now() * 1000 + Math.floor(Math.random() * 1000);
  data.merchants.push({
    id: newId,
    name, shop, phone, governorate, area,
    status: 'pending',
    username: '', password: '',
    products: [],
    theme: { primaryColor: '#C77B4A', logo: null, banner: null },
    dashboardColor: '#C9A24B', visits: 0,
    balance: 0, salesCount: 0,
    linkSlug: shop.trim().replace(/\s+/g, '-') + '-' + newId, // unique even if two shops share a name
    feeSource: s.feeSource,
    feeType: s.feeType || 'fixed',
    feeAmount: s.feeAmount,
    feeCustomer: s.feeCustomer,
    feeMerchant: s.feeMerchant,
    itemDeduction: s.itemDeduction || 0,
    shippingAmount: s.shippingAmount
  });

  // IMPORTANT: the join-request document itself is written directly here (not through the
  // generic saveData() sweep), so we get an honest yes/no about whether it actually reached
  // the database before telling the person it worked — a silent background failure there
  // used to show "success" to the customer while the admin never saw the request at all.
  let ok = false;
  if (window.authApi) {
    try {
      await window.authApi.saveDoc('join_requests', String(newId), data.merchants.find(m => m.id === newId));
      ok = true;
    } catch (e) {
      console.error('Join request save failed:', e);
      ok = false;
    }
  } else {
    ok = await saveData();
  }
  if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'إرسال الطلب'; }

  if (!ok) {
    // Roll back the local addition so the in-memory data doesn't drift from what's actually saved.
    data.merchants = data.merchants.filter(m => m.id !== newId);
    showToast('⚠️ صار خطأ ولم يتم إرسال الطلب — تأكد من الاتصال بالإنترنت وحاول مرة ثانية');
    return;
  }

  document.getElementById('req-name').value = '';
  document.getElementById('req-shop').value = '';
  document.getElementById('req-phone').value = '';
  document.getElementById('req-area').value = '';
  showToast('تم إرسال طلبك بنجاح ✅ راح تراجعه الإدارة وترسلك بيانات دخولك');
  showLoginScreen();
}

let loggedInMerchantId = null;

// ---------- LIVE NOTIFICATIONS (poll every 5s) ----------
// Purely a "heads up, something new arrived" layer on top of the existing 5-second refresh
// below — it never touches product-adding or order-flow logic, it only WATCHES the counts
// that flow already produces and pops a toast the moment one of them goes up. Baselines are
// re-captured (silently, no toast) right after login and right after every poll tick, so it
// only ever fires for things that are genuinely new since the last time this screen looked.
let notifyState = { pendingRequests: 0, adminAwaitingDelivery: 0, merchantPendingOrders: {} };
function captureNotifyBaseline() {
  notifyState.pendingRequests = data.merchants.filter(m => m.status === 'pending').length;
  notifyState.adminAwaitingDelivery = data.orders.filter(o => o.status === 'accepted' && !o.cancelled && o.deliveryStatus === 'none').length;
  data.merchants.forEach(m => {
    notifyState.merchantPendingOrders[m.id] = data.orders.filter(o => o.merchantId === m.id && o.status === 'pending' && !o.cancelled).length;
  });
}

function shadeColor(hex, percent) {
  hex = (hex || '#C9A24B').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

// Applies (or resets) the merchant-chosen dashboard color. Pass null to restore the
// platform's default gold accent (used for admin / logged-out screens).
function applyMerchantDashboardColor(m) {
  const root = document.documentElement;
  if (m && m.dashboardColor) {
    root.style.setProperty('--accent', m.dashboardColor);
    root.style.setProperty('--accent-dark', shadeColor(m.dashboardColor, -20));
    root.style.setProperty('--accent-light', shadeColor(m.dashboardColor, 20));
    root.style.setProperty('--accent-soft', shadeColor(m.dashboardColor, 85));
  } else {
    root.style.setProperty('--accent', '#C9A24B');
    root.style.setProperty('--accent-dark', '#9C7A2F');
    root.style.setProperty('--accent-light', '#E4C688');
    root.style.setProperty('--accent-soft', '#F6EDD3');
  }
}

function orderStatusLabel(status) {
  if (status === 'accepted') return 'مقبول';
  if (status === 'rejected') return 'مرفوض';
  if (status === 'removed') return 'محذوفة من الفاتورة';
  return 'بانتظار ردك';
}

// The single "final status" for a line item, layering cancellation and delivery on top of
// the base order status — this is what should show in lists and Excel exports, since a
// cancelled order matters more than whatever its earlier status was.
function orderFullStatusLabel(o) {
  if (o.cancelled) return '❌ ملغي';
  if (o.deliveryStatus === 'delivered') return '✅ واصل';
  if (o.deliveryStatus === 'returned') return '↩️ مرجّع';
  return orderStatusLabel(o.status);
}
function cancelByLabel(role) {
  if (role === 'admin') return 'الأدمن';
  if (role === 'merchant') return 'التاجر';
  if (role === 'shipping') return 'شركة الشحن';
  return '—';
}
// Small reason line shown under a cancelled order/group, wherever it appears.
function cancelReasonLine(o) {
  if (!o.cancelled) return '';
  const when = o.cancelAt ? new Date(o.cancelAt).toLocaleString('ar-IQ') : '';
  return `<div style="font-size:11px; color:#B3261E; margin-top:4px; border-top:1px dashed #EEC9C6; padding-top:4px;">
    ❌ ملغي بواسطة ${o.cancelByName ? o.cancelByName + ' (' + cancelByLabel(o.cancelBy) + ')' : cancelByLabel(o.cancelBy)}${when ? ' — ' + when : ''}
    <br>السبب: ${o.cancelReason || '—'}
  </div>`;
}

// ---------- ORDER CANCELLATION (admin or merchant — with a reason) ----------
let currentCancelTarget = null;
function openCancelReasonModal(groupId, role, roleName) {
  currentCancelTarget = { groupId, role, roleName };
  document.getElementById('cancel-reason-input').value = '';
  document.getElementById('cancel-reason-modal').classList.add('show');
}
function closeCancelReasonModal() {
  currentCancelTarget = null;
  document.getElementById('cancel-reason-modal').classList.remove('show');
}
async function confirmCancelOrderGroup() {
  if (!currentCancelTarget) return;
  const reason = document.getElementById('cancel-reason-input').value.trim();
  if (!reason) { showToast('لازم تكتب سبب الإلغاء'); return; }
  const { groupId, role, roleName } = currentCancelTarget;
  const items = data.orders.filter(o => (o.orderGroupId || o.id) === groupId && !o.cancelled);
  if (items.length === 0) { closeCancelReasonModal(); return; }
  const now = new Date().toISOString();
  const m = data.merchants.find(x => x.id === items[0].merchantId);
  items.forEach(o => {
    // If this order had already been accepted (money credited to the merchant), reverse it —
    // otherwise cancelling an accepted invoice silently leaves the merchant's balance inflated.
    if (o.status === 'accepted' && m) {
      m.balance -= (o.price - o.feeFromMerchant - (o.itemDeduction || 0));
      if (m.salesCount > 0) m.salesCount--;
    }
    // The piece is no longer going out the door, so give it back to inventory —
    // matches the reject/removal behavior and the app's own stated policy.
    const p = m && o.productId ? m.products.find(x => x.id === o.productId) : null;
    if (p && typeof p.stock === 'number') p.stock += 1;
    o.cancelled = true;
    o.cancelReason = reason;
    o.cancelBy = role;
    o.cancelByName = roleName;
    o.cancelAt = now;
  });
  closeCancelReasonModal();
  await saveOrResync('تم إلغاء الطلب وتسجيل السبب وإرجاع المخزون والرصيد');
}

function orderCustomerLine(o) {
  if (!o.customerName) return '';
  const speedLabel = o.shippingSpeed === 'fast' ? 'سريع' : (o.shippingSpeed === 'slow' ? 'بطيء' : '');
  return `<div style="font-size:11px; color:#888; margin-top:2px;">
    👤 ${o.customerName} — ${o.customerPhone} — ${o.customerAddress}${o.governorate ? ' — ' + o.governorate : ''}${speedLabel ? ' — شحن ' + speedLabel : ''}
  </div>`;
}

// Mini invoice shown to the merchant for a single order: exactly what the customer paid for
// (item + service fee + delivery), and — separately — what the platform deducts from the
// merchant and what the merchant nets from this specific sale.
function orderFinanceLine(o) {
  const customerTotal = o.price + (o.feeFromCustomer || 0) + (o.shippingFee || 0);
  const net = o.price - (o.feeFromMerchant || 0) - (o.itemDeduction || 0);
  let breakdown = `القطعة ${o.price.toLocaleString()} د`;
  if (o.feeFromCustomer) breakdown += ` + رسوم خدمة ${o.feeFromCustomer.toLocaleString()} د`;
  if (o.shippingFee) breakdown += ` + توصيل ${o.shippingFee.toLocaleString()} د`;
  let deducted = `رسم المنصة المستقطع مني: ${(o.feeFromMerchant || 0).toLocaleString()} د`;
  if (o.itemDeduction) deducted += ` + استقطاع القطعة: ${o.itemDeduction.toLocaleString()} د`;
  return `<div style="font-size:11px; color:#888; margin-top:3px; border-top:1px dashed #EEE; padding-top:3px;">
    🧾 فاتورة الزبون: ${breakdown} = <b>${customerTotal.toLocaleString()} د</b>
    <br>💰 ${deducted}${o.status === 'accepted' && !o.cancelled ? ' — صافيّ من هذا الطلب: ' + net.toLocaleString() + ' د' : ''}
  </div>`;
}

function deliveryStatusLabel(status) {
  if (status === 'delivered') return '✅ تم التسليم';
  if (status === 'returned') return '↩️ مرجّع';
  return '';
}
function deliveryStatusBadgeClass(status) {
  if (status === 'delivered') return 'active';
  if (status === 'returned') return 'rejected';
  return 'pending';
}

// Orders the merchant has already accepted and are now waiting on the admin to mark
// delivered/returned — grouped into invoices (same orderGroupId = one customer checkout)
// so they're shown/actioned as a single package rather than piece by piece. The merchant
// can still cancel one from here (e.g. found out the piece can't actually be delivered);
// marking it delivered/returned itself is handled by the admin.
function groupOrders(orders) {
  const groups = {};
  const list = [];
  orders.forEach(o => {
    const key = o.orderGroupId || o.id;
    if (!groups[key]) { groups[key] = { groupId: key, orders: [] }; list.push(groups[key]); }
    groups[key].orders.push(o);
  });
  return list;
}

function renderStorefrontInto(merchantId, content, opts) {
  const { ignoreDisabled = false } = opts || {};
  const m = data.merchants.find(x => x.id === merchantId);
  if (!m) { content.innerHTML = ''; return; }
  ensureMerchantTheme(m);

  // ignoreDisabled is used by the merchant's own "لens" preview: the merchant should always
  // be able to see their real store/products, even while the admin has it disabled (e.g. before
  // launch). Real customers (public link) and the admin's store-browser still get blocked as before.
  if (m.status === 'disabled' && !ignoreDisabled) {
    content.innerHTML = `<div class="card"><div class="empty">المتجر غير متاح حالياً</div></div>`;
    return;
  }

  const color = m.theme.primaryColor || '#C77B4A';

  content.innerHTML = `
    <div class="card">
      ${ignoreDisabled && m.status === 'disabled' ? `
        <div class="subtitle" style="background:#FFF4E5; border:1px solid #F0C879; border-radius:8px; padding:8px 10px; margin-bottom:10px; color:#8A5A00;">
          ⚠️ هذي معاينة بس — متجرك حالياً معطّل من الأدمن وما يشوفه الزبون لين يتفعّل.
        </div>` : ''}
      ${m.theme.banner ? `<img class="store-banner" src="${m.theme.banner}">` : ''}
      <div class="store-header">
        ${m.theme.logo ? `<img class="store-logo" src="${m.theme.logo}">` : ''}
        <div class="card-title" style="color:${color};">${m.shop}</div>
      </div>
      ${cart.length && cart[0].merchantId === m.id ? `
        <div class="cart-bar" onclick="openCartModal()">
          <span>🛒 السلة (${cartCount()} قطعة)</span>
          <span>${cartSubtotal().toLocaleString()} د — إتمام الشراء ›</span>
        </div>
      ` : ''}
      ${m.products.length === 0 ? '<div class="empty">ما فيه منتجات معروضة</div>' : m.products.map(p => {
        const outOfStock = typeof p.stock === 'number' && p.stock <= 0;
        return `
        <div class="store-product">
          <div class="store-product-top">
            <div class="store-product-info">
              ${p.image ? `<img class="thumb" src="${p.image}">` : `<div class="thumb-placeholder">🖼️</div>`}
              <span>${p.name} — ${p.price.toLocaleString()} د ${outOfStock ? '<span class="badge rejected">نفدت الكمية</span>' : ''}</span>
            </div>
            ${outOfStock
              ? `<button class="btn small secondary" style="flex-shrink:0;" disabled>غير متوفر</button>`
              : `<button class="btn small" style="background:${color}; flex-shrink:0;" onclick="addToCart(${m.id}, ${p.id})">أضف للسلة</button>`}
          </div>
          ${p.description ? `<div class="product-desc">${p.description}</div>` : ''}
          ${p.sizes && p.sizes.length ? `
            <div>
              <div class="product-sizes-label">اختر المقاس</div>
              <select class="size-select" id="size-select-${p.id}">
                ${p.sizes.map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
            </div>
          ` : ''}
        </div>
      `;
      }).join('')}
    </div>
  `;
}

// "العدسة": يفتح للتاجر معاينة حية لمتجره بالضبط متل ما يشوفه الزبون — الشعار، الألوان،
// البنر، والمنتجات بأسعارها — حتى لو المتجر لسا قيد المراجعة وما انفعّل من الأدمن بعد.
// الوحيد اللي يوقف المعاينة هو إذا الأدمن عطّل المتجر (status === 'disabled')، متل حال الزبون تماماً.
function calcFee(m, price) {
  // If a merchant is passed, use that merchant's own fee settings; otherwise fall back to global (for the settings-page preview)
  const s = m || data.settings;
  const isPercent = s.feeType === 'percent';
  const toAmount = (v) => isPercent ? Math.round(((price || 0) * v) / 100) : v;
  if (s.feeSource === 'both') return {customer: toAmount(s.feeCustomer), merchant: toAmount(s.feeMerchant)};
  if (s.feeSource === 'customer') return {customer: toAmount(s.feeAmount), merchant: 0};
  return {customer: 0, merchant: toAmount(s.feeAmount)};
}

// ---------- CART (customer can add multiple products/quantities before checking out) ----------
let cart = [];

function cartCount() { return cart.reduce((s, i) => s + i.qty, 0); }
function cartSubtotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }

function addToCart(merchantId, productId) {
  const m = data.merchants.find(x => x.id === merchantId);
  const p = m && m.products.find(x => x.id === productId);
  if (!p) return;
  const sizeSelect = document.getElementById(`size-select-${productId}`);
  const size = sizeSelect ? sizeSelect.value : null;

  // The cart holds items from one store at a time — switching stores starts a fresh cart
  if (cart.length && cart[0].merchantId !== merchantId) cart = [];

  const existing = cart.find(i => i.productId === productId && i.size === size);
  const currentQty = existing ? existing.qty : 0;
  if (typeof p.stock === 'number' && currentQty + 1 > p.stock) {
    showToast('عذراً، الكمية المتوفرة من هذي القطعة غير كافية');
    return;
  }

  if (existing) existing.qty += 1;
  else cart.push({ merchantId, productId, productName: p.name, price: p.price, size, qty: 1 });

  showToast('تمت الإضافة للسلة 🛒');
  refreshStorefrontView();
}

function changeCartQty(index, delta) {
  const item = cart[index];
  if (!item) return;
  const m = data.merchants.find(x => x.id === item.merchantId);
  const p = m && m.products.find(x => x.id === item.productId);
  const newQty = item.qty + delta;
  if (newQty <= 0) {
    cart.splice(index, 1);
  } else if (p && typeof p.stock === 'number' && newQty > p.stock) {
    showToast('ما فيه هذا القدر بالمخزون');
    return;
  } else {
    item.qty = newQty;
  }
  renderCartModal();
  refreshStorefrontView();
}

function removeCartItem(index) {
  cart.splice(index, 1);
  renderCartModal();
  refreshStorefrontView();
}

function openCartModal() {
  renderCartModal();
  document.getElementById('cart-modal').classList.add('show');
}

function closeCartModal() {
  document.getElementById('cart-modal').classList.remove('show');
}

function renderCartModal() {
  const itemsEl = document.getElementById('cart-items');
  const emptyEl = document.getElementById('cart-empty');
  const totalEl = document.getElementById('cart-total-line');
  const btn = document.getElementById('cart-checkout-btn');
  if (cart.length === 0) {
    itemsEl.innerHTML = '';
    emptyEl.style.display = 'block';
    totalEl.innerHTML = '';
    btn.disabled = true;
    btn.style.opacity = '0.5';
    return;
  }
  emptyEl.style.display = 'none';
  btn.disabled = false;
  btn.style.opacity = '1';
  itemsEl.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <span class="cart-item-name">${item.productName}${item.size ? ' (مقاس ' + item.size + ')' : ''}</span>
        <span class="cart-item-price">${item.price.toLocaleString()} د × ${item.qty}</span>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="changeCartQty(${idx}, -1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeCartQty(${idx}, 1)">+</button>
        <button class="cart-remove" onclick="removeCartItem(${idx})">🗑️</button>
      </div>
    </div>
  `).join('');
  totalEl.innerHTML = `<div class="checkout-line total"><span>مجموع القطع (${cartCount()})</span><span>${cartSubtotal().toLocaleString()} د</span></div>`;
}

// ---------- CHECKOUT (customer fills their info once, picks governorate + fast/slow shipping,
// and confirms the whole cart together — one combined delivery for every item in it) ----------
let currentCheckout = null;
let checkoutSpeed = 'fast';

// Finds the admin-configured zone for a governorate; falls back to "باقي المحافظات" if that governorate has no specific zone
function findShippingZone(governorateName) {
  const zones = data.settings.shippingZones || [];
  return zones.find(z => z.name === governorateName) || zones.find(z => z.name === 'باقي المحافظات') || null;
}

function openCheckoutFromCart() {
  if (cart.length === 0) return;
  const merchantId = cart[0].merchantId;
  const m = data.merchants.find(x => x.id === merchantId);

  // Re-validate stock right before checkout in case it changed while browsing
  for (const item of cart) {
    const p = m.products.find(x => x.id === item.productId);
    if (p && typeof p.stock === 'number' && item.qty > p.stock) {
      showToast(`عذراً، الكمية المتوفرة من "${item.productName}" ما تكفي`);
      renderCartModal();
      return;
    }
  }

  currentCheckout = {
    merchantId,
    items: cart.map(i => ({ productId: i.productId, productName: i.productName, price: i.price, size: i.size, qty: i.qty }))
  };
  checkoutSpeed = 'fast';

  document.getElementById('co-name').value = '';
  document.getElementById('co-phone').value = '';
  document.getElementById('co-address').value = '';
  document.getElementById('checkout-error').textContent = '';

  const govSelect = document.getElementById('co-governorate');
  govSelect.innerHTML = IRAQ_GOVERNORATES.map(g => `<option value="${g}">${g}</option>`).join('');

  updateCheckoutDelivery();
  closeCartModal();
  document.getElementById('checkout-modal').classList.add('show');
}

function setCheckoutSpeed(speed) {
  checkoutSpeed = speed;
  updateCheckoutDelivery();
}

function updateCheckoutDelivery() {
  if (!currentCheckout) return;
  const m = data.merchants.find(x => x.id === currentCheckout.merchantId);
  const governorate = document.getElementById('co-governorate').value;
  const zone = data.settings.shippingEnabled ? findShippingZone(governorate) : null;

  // If the currently-selected speed isn't offered for this governorate, switch to whichever speed is available
  if (zone && !zoneOffersSpeed(zone, checkoutSpeed)) {
    checkoutSpeed = zoneOffersSpeed(zone, 'fast') ? 'fast' : 'slow';
  }

  let deliveryFee;
  if (zone) {
    deliveryFee = checkoutSpeed === 'fast' ? zone.fastPrice : zone.slowPrice;
  } else {
    // no zones configured at all — fall back to the merchant's flat delivery price
    deliveryFee = data.settings.shippingEnabled ? (m.shippingAmount || 0) : 0;
  }

  // One combined delivery for the whole cart — service fee still applies per piece
  const subtotal = currentCheckout.items.reduce((s, i) => s + i.price * i.qty, 0);
  const serviceFee = currentCheckout.items.reduce((s, i) => s + calcFee(m, i.price).customer * i.qty, 0);
  const total = subtotal + serviceFee + deliveryFee;

  currentCheckout.deliveryFee = deliveryFee;
  currentCheckout.serviceFee = serviceFee;
  currentCheckout.subtotal = subtotal;
  currentCheckout.total = total;
  currentCheckout.governorate = governorate;
  currentCheckout.shippingSpeed = checkoutSpeed;

  let speedToggles = '';
  if (zoneOffersSpeed(zone, 'fast')) {
    speedToggles += `<span class="toggle ${checkoutSpeed==='fast'?'selected':''}" onclick="setCheckoutSpeed('fast')">🚀 سريع${zone ? ' — ' + zone.fastPrice.toLocaleString() + ' د' : ''}</span>`;
  }
  if (zoneOffersSpeed(zone, 'slow')) {
    speedToggles += `<span class="toggle ${checkoutSpeed==='slow'?'selected':''}" onclick="setCheckoutSpeed('slow')">🐢 بطيء${zone ? ' — ' + zone.slowPrice.toLocaleString() + ' د' : ''}</span>`;
  }
  document.getElementById('co-speed-toggles').innerHTML = speedToggles;

  document.getElementById('checkout-summary').innerHTML = `
    ${currentCheckout.items.map(i => `<div class="checkout-line"><span>${i.productName}${i.size ? ' (مقاس ' + i.size + ')' : ''} × ${i.qty}</span><span>${(i.price * i.qty).toLocaleString()} د</span></div>`).join('')}
    ${serviceFee > 0 ? `<div class="checkout-line"><span>رسوم خدمة</span><span>${serviceFee.toLocaleString()} د</span></div>` : ''}
    <div class="checkout-line"><span>التوصيل (${checkoutSpeed === 'fast' ? 'سريع' : 'بطيء'})</span><span>${deliveryFee > 0 ? deliveryFee.toLocaleString() + ' د' : 'مجاني'}</span></div>
    <div class="checkout-line total"><span>الإجمالي</span><span>${total.toLocaleString()} د</span></div>
    <div style="font-size:12px; color:var(--accent-dark); background:#F6F3ED; padding:8px 10px; border-radius:8px; margin-top:8px;">
      💵 <b>الدفع عند الاستلام</b> — تدفع المبلغ نقداً لمندوب التوصيل عند وصول طلبك، ما فيه دفع إلكتروني حالياً
    </div>
  `;
}

function closeCheckoutModal() {
  currentCheckout = null;
  document.getElementById('checkout-modal').classList.remove('show');
}

document.getElementById('checkout-confirm-btn').addEventListener('click', async () => {
  if (!currentCheckout) return;
  const c = currentCheckout;
  const name = document.getElementById('co-name').value.trim();
  const phone = document.getElementById('co-phone').value.trim();
  const address = document.getElementById('co-address').value.trim();
  const errorBox = document.getElementById('checkout-error');
  if (!name || !phone || !address) {
    errorBox.textContent = 'عبي اسمك، رقم هاتفك، وعنوانك قبل تأكيد الطلب';
    return;
  }
  errorBox.textContent = '';

  const m = data.merchants.find(x => x.id === c.merchantId);

  // Re-check stock right before placing the order, in case something changed
  for (const item of c.items) {
    const p = m.products.find(x => x.id === item.productId);
    if (p && typeof p.stock === 'number' && item.qty > p.stock) {
      errorBox.textContent = `عذراً، الكمية المتوفرة من "${item.productName}" نفدت أو تغيرت`;
      refreshStorefrontView();
      return;
    }
  }

  // Every item in the cart becomes its own order (so the merchant can accept/ship each piece),
  // but they all share the same customer info, delivery choice, and a single delivery fee —
  // charged once, on the very first order of the batch — plus a shared group id.
  // IDs are generated right here in the browser (timestamp + random) instead of a shared
  // counter, since the customer placing this order isn't logged in and has no write access
  // to the admin-only settings document that used to hold that counter.
  const genId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);
  const groupId = genId();
  const stockDeductions = []; // so we can roll them back if the save below fails
  const newOrders = [];
  c.items.forEach((item, idx) => {
    const fee = calcFee(m, item.price);
    const p = m.products.find(x => x.id === item.productId);
    if (p && typeof p.stock === 'number') { stockDeductions.push({ p, qty: item.qty }); p.stock = Math.max(0, p.stock - item.qty); }
    for (let n = 0; n < item.qty; n++) {
      const order = {
        id: genId(), merchantId: c.merchantId, merchantAuthUid: m.authUid || null, productId: item.productId, productName: item.productName, price: item.price, size: item.size,
        customerName: name, customerPhone: phone, customerAddress: address,
        governorate: c.governorate, shippingSpeed: c.shippingSpeed,
        feeFromCustomer: fee.customer, feeFromMerchant: fee.merchant, itemDeduction: m.itemDeduction || 0,
        shippingFee: (idx === 0 && n === 0) ? c.deliveryFee : 0,
        status: 'pending',
        deliveryStatus: 'none',
        orderGroupId: groupId, removalStatus: null,
        date: new Date().toISOString()
      };
      newOrders.push(order);
      data.orders.push(order);
    }
  });

  // Disable the button and wait for the ACTUAL database write to finish before telling the
  // customer anything — showing "sent successfully" before we know the save landed was
  // exactly why orders could silently vanish: the toast said success even when the write
  // failed (e.g. a Firestore rules rejection), the order never made it to the database, and
  // it understandably never showed up on the merchant's or admin's screen afterward.
  const btn = document.getElementById('checkout-confirm-btn');
  const originalBtnText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'جاري الإرسال...';
  const saved = await saveData();
  btn.disabled = false;
  btn.textContent = originalBtnText;

  if (!saved) {
    // Roll back — remove the orders we just added locally and restore the stock we deducted,
    // so the cart/modal are left exactly as they were and the customer can safely retry
    // without ending up with duplicate or phantom orders.
    newOrders.forEach(o => { const i = data.orders.indexOf(o); if (i !== -1) data.orders.splice(i, 1); });
    stockDeductions.forEach(({ p, qty }) => { if (typeof p.stock === 'number') p.stock += qty; });
    errorBox.textContent = '⚠️ تعذر إرسال الطلب — تحقق من الإنترنت وحاول مرة ثانية';
    return;
  }

  cart = [];
  closeCheckoutModal();
  showToast('تم إرسال طلبك بنجاح ✅ بانتظار تأكيد المتجر');
  if (publicStoreMerchantId) { refreshStorefrontView(); } else { renderAll(); }
});

// Refreshes whichever storefront view is currently on screen — the public
// customer-facing link, or the admin's internal preview tool.
function refreshStorefrontView() {
  if (publicStoreMerchantId) {
    renderStorefrontInto(publicStoreMerchantId, document.getElementById('public-storefront-content'));
  } else {
    renderStorefront();
  }
}


// ---------- PRICING SETTINGS ----------
function renderAll() {
  renderDashboard();
  renderRequests();
  renderAccounting();
  if (loggedInMerchantId) renderMerchantPanel();
  renderStoreSelect();
  renderSettings();
  renderMerchantActions();
  renderAdminShippingControl();
}

// ---------- LIVE AUTO-REFRESH ----------
// The screen only loaded data once, on page open. So if a customer placed an order from
// their phone while a merchant/admin had their screen open, the order was
// saved correctly to the shared database — but the open screen never knew to look again,
// and only showed it after a manual full page reload. This quietly re-checks the database
// every 5 seconds and refreshes the on-screen view (without a page reload) whenever new
// data has arrived, as long as nobody is mid-typing or has a popup open (so it never yanks
// away something the person is in the middle of doing).
async function pollForUpdates() {
  try {
    const openModal = document.querySelector('.modal-overlay.show');
    const active = document.activeElement;
    const isTyping = active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
    // Also skip while a merchant document save is still in flight (e.g. a product was just
    // added and its write hasn't been confirmed by the server yet). Fetching now would pull
    // the OLD server copy and overwrite the just-made local change before it ever got
    // persisted — this was the cause of a newly-added product wiping out the previous one.
    if (openModal || isTyping || pendingMerchantWrites > 0) return; // try again next tick instead of interrupting the person

    // Settings rarely change, so they're still the cheap "did anything happen at all?"
    // signal — but merchants/orders/join_requests now live in their own collections, so
    // those are always freshly re-fetched below regardless of whether settings themselves
    // changed.
    const result = await window.storage.get('platform-settings', true).catch(() => null);
    const remoteSettingsVersion = result && result.value ? (JSON.parse(result.value).version || 0) : 0;

    // Compares the FULL content of each collection (not just how many items exist), because
    // a merchant accepting an order doesn't add or remove an order — it just changes fields
    // (status, deliveryStatus) on an order that was already there. The old version of this
    // check only compared array LENGTHS before vs after the fetch, so accepting an order
    // never changed the order count, the check saw "no change", and it skipped re-rendering
    // — even though fetchAllCollections() below had already pulled in the update. The
    // admin's screen was then silently out of date until something else eventually changed a
    // count and dragged it along. Comparing full content (still cheap at this app's scale)
    // catches in-place changes like this one.
    const beforeSnapshot = JSON.stringify({ m: data.merchants, o: data.orders });
    if (remoteSettingsVersion !== loadedVersion) {
      const loaded = JSON.parse(result.value);
      data.settings = loaded.settings || data.settings;
      data.nextId = loaded.nextId || data.nextId;
      loadedVersion = remoteSettingsVersion;
    }
    await fetchAllCollections();
    const afterSnapshot = JSON.stringify({ m: data.merchants, o: data.orders });
    if (beforeSnapshot === afterSnapshot && remoteSettingsVersion === loadedVersion) return;

    data.merchants.forEach(ensureMerchantTheme);
    data.orders.forEach(o => {
      if (!o.status) o.status = 'accepted';
      if (!o.deliveryStatus || o.deliveryStatus === 'with_shipping') o.deliveryStatus = 'none';
      if (typeof o.itemDeduction !== 'number') o.itemDeduction = 0;
      if (typeof o.cancelled !== 'boolean') o.cancelled = false;
    });

    // Refresh whichever screen is actually on-screen right now, and — only for whichever
    // role is actually logged in on THIS screen — pop a toast if something genuinely new
    // showed up since the last tick. This is read-only: it never changes an order, a
    // product, or any save/accept/reject flow, it only compares counts and calls showToast.
    if (document.getElementById('app-shell').style.display !== 'none') {
      if (currentRole === 'admin') {
        const newPendingRequests = data.merchants.filter(m => m.status === 'pending').length;
        const newAwaitingDelivery = data.orders.filter(o => o.status === 'accepted' && !o.cancelled && o.deliveryStatus === 'none').length;
        const msgs = [];
        if (newPendingRequests > notifyState.pendingRequests) msgs.push('🔔 وصل طلب انضمام تاجر جديد');
        if (newAwaitingDelivery > notifyState.adminAwaitingDelivery) msgs.push('🔔 فيه طلب جديد بانتظار تسجيل حالة التوصيل');
        if (msgs.length) showToast(msgs.join(' — '), 3500);
        notifyState.pendingRequests = newPendingRequests;
        notifyState.adminAwaitingDelivery = newAwaitingDelivery;
        renderAll();
      } else if (currentRole === 'merchant') {
        const myPending = data.orders.filter(o => o.merchantId === loggedInMerchantId && o.status === 'pending' && !o.cancelled).length;
        const prevMine = notifyState.merchantPendingOrders[loggedInMerchantId] || 0;
        if (myPending > prevMine) showToast('🔔 عندك طلب جديد من زبون بانتظار ردك', 3500);
        notifyState.merchantPendingOrders[loggedInMerchantId] = myPending;
        renderMerchantPanel();
      }
    } else if (publicStoreMerchantId && document.getElementById('public-store-screen').style.display !== 'none') {
      renderStorefrontInto(publicStoreMerchantId, document.getElementById('public-storefront-content'));
    }
  } catch (e) {
    console.error('Live refresh error:', e);
  }
}
setInterval(pollForUpdates, 5000);
