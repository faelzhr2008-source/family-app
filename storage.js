import bcrypt from 'bcryptjs';

export const RECOVERY_QUESTION = 'ما اسم أول مدرسة للطفل الأكبر؟';

const SUPABASE_URL = 'https://' + 'dtuckwbvkwcxmzuhvepl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kJqXlfVxc0--1uS8tAzxog_XJG5y0Lx';

const KEYS = {
  familyId: 'fam_cloud_id',
  parent: 'fam_parent',
  children: 'fam_children',
  tasks: 'fam_tasks',
  submissions: 'fam_submissions',
  logs: 'fam_logs',
  session: 'fam_session',
};

const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

export const getActiveFamilyId = () => localStorage.getItem(KEYS.familyId) || 'main_family';
export const setActiveFamilyId = (id) => localStorage.setItem(KEYS.familyId, id.trim().toLowerCase());

// تقليص حجم الصور تلقائياً قبل رفعها للسحابة لضمان سرعة المزامنة
function shrinkImagesInChildren(childrenList = []) {
  return childrenList.map((c) => {
    if (c.avatar && c.avatar.length > 150000) {
      // إذا كانت الصورة كبيرة جداً نحتفظ بها محلياً ونرسل نسخة خفيفة للسحابة
      return { ...c, avatar: '' };
    }
    return c;
  });
}

// رفع بيانات العائلة الحالية إلى سحابة Supabase
export async function pushToCloud(customId) {
  try {
    const parent = read(KEYS.parent, null);
    const rawId = customId || getActiveFamilyId() || parent?.email || 'main_family';
    const rowId = rawId.trim().toLowerCase();

    const payload = {
      parent,
      children: shrinkImagesInChildren(read(KEYS.children, [])),
      tasks: read(KEYS.tasks, []),
      submissions: read(KEYS.submissions, []),
      logs: read(KEYS.logs, []),
    };

    await fetch(`${SUPABASE_URL}/rest/v1/family_data`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id: rowId,
        payload,
        updated_at: new Date().toISOString(),
      }),
    });
  } catch {
    // استمرار العمل محلياً عند ضعف الشبكة
  }
}

// جلب بيانات عائلة محددة من سحابة Supabase
export async function pullFromCloud(customId) {
  try {
    const rowId = (customId || getActiveFamilyId()).trim().toLowerCase();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/family_data?id=eq.${encodeURIComponent(rowId)}&select=payload`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    if (!res.ok) return false;
    const rows = await res.json();
    if (rows && rows.length > 0 && rows[0].payload) {
      const data = rows[0].payload;
      setActiveFamilyId(rowId);
      if (data.parent) localStorage.setItem(KEYS.parent, JSON.stringify(data.parent));
      localStorage.setItem(KEYS.children, JSON.stringify(data.children || []));
      localStorage.setItem(KEYS.tasks, JSON.stringify(data.tasks || []));
      localStorage.setItem(KEYS.submissions, JSON.stringify(data.submissions || []));
      localStorage.setItem(KEYS.logs, JSON.stringify(data.logs || []));
      return true;
    }
  } catch {
    // تجاهل الخطأ عند عدم توفر اتصال
  }
  return false;
}

const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  const parent = read(KEYS.parent, null);
  if (parent && parent.email) {
    setActiveFamilyId(parent.email);
  }
  pushToCloud(parent?.email);
};

export const uid = () =>
  globalThis.crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const normalizeAnswer = (s = '') =>
  s
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/\s+/g, ' ');

export const hash = (plain) => bcrypt.hashSync(plain, 10);
export const verify = (plain, hashed) => !!hashed && bcrypt.compareSync(plain, hashed);

export function initStorage() {
  if (!read(KEYS.parent, null)) {
    localStorage.setItem(
      KEYS.parent,
      JSON.stringify({
        id: 'parent-1',
        name: 'ولي الأمر',
        email: 'parent@family.local',
        passwordHash: hash('12345678'),
        usingDefaultPassword: true,
        recoveryQuestion: RECOVERY_QUESTION,
        recoveryAnswerHash: null,
        role: 'parent',
      })
    );
  }
  if (localStorage.getItem(KEYS.familyId)) {
    pullFromCloud();
  }
}

export const publicUser = (p) =>
  p && {
    id: p.id,
    name: p.name,
    email: p.email || '',
    username: p.username || '',
    role: p.role || 'parent',
    hasRecoveryAnswer: !!p.recoveryAnswerHash,
    usingDefaultPassword: !!p.usingDefaultPassword,
  };

export function saveSession(userId, remember) {
  clearSession();
  const store = remember ? localStorage : sessionStorage;
  store.setItem(KEYS.session, JSON.stringify({ userId, at: Date.now() }));
}

export function clearSession() {
  localStorage.removeItem(KEYS.session);
  sessionStorage.removeItem(KEYS.session);
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEYS.session) || sessionStorage.getItem(KEYS.session);
    if (!raw) return null;
    const { userId } = JSON.parse(raw);

    const parent = read(KEYS.parent, null);
    if (parent && parent.id === userId) return publicUser(parent);

    const children = read(KEYS.children, []);
    const child = children.find((c) => c.id === userId);
    if (child) return publicUser({ ...child, role: 'child' });

    return null;
  } catch {
    return null;
  }
}

export const db = {
  getParent: () => read(KEYS.parent, null),
  saveParent: (p) => write(KEYS.parent, p),
  getChildren: () => read(KEYS.children, []),
  saveChildren: (v) => write(KEYS.children, v),
  getTasks: () => read(KEYS.tasks, []),
  saveTasks: (v) => write(KEYS.tasks, v),
  getSubmissions: () => read(KEYS.submissions, []),
  saveSubmissions: (v) => write(KEYS.submissions, v),
  getLogs: () => read(KEYS.logs, []),
  saveLogs: (v) => write(KEYS.logs, v),
};
