import bcrypt from 'bcryptjs';

export const RECOVERY_QUESTION = 'ما اسم أول مدرسة للطفل الأكبر؟';

const KEYS = {
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
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export const uid = () =>
  globalThis.crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Normalise Arabic answers: trim, lowercase, strip diacritics, unify alef forms
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
    write(KEYS.parent, {
      id: 'parent-1',
      name: 'ولي الأمر',
      email: 'parent@family.local',
      passwordHash: hash('12345678'),
      usingDefaultPassword: true,
      recoveryQuestion: RECOVERY_QUESTION,
      recoveryAnswerHash: null,
      role: 'parent',
    });
  }
}

export const publicUser = (p) =>
  p && {
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role,
    hasRecoveryAnswer: !!p.recoveryAnswerHash,
    usingDefaultPassword: !!p.usingDefaultPassword,
  };

// Session: localStorage when "remember me", otherwise sessionStorage
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
    return parent && parent.id === userId ? publicUser(parent) : null;
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