import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import bcrypt from 'bcryptjs';
import {
  initStorage,
  db,
  publicUser,
  saveSession,
  clearSession,
  loadSession,
  normalizeAnswer,
  uid,
} from '../utils/storage';

export const MIN_PASSWORD_LENGTH = 8;
const RESET_TTL_MS = 10 * 60 * 1000;

initStorage();

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => loadSession());
  const resetRef = useRef(null); // { token, expires } — kept in memory only

  const syncUser = () => setCurrentUser(publicUser(db.getParent()));

  const login = useCallback(async (email, password, remember = true) => {
    const fail = { ok: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    try {
      const parent = db.getParent();
      if (!parent || parent.email.toLowerCase() !== email.trim().toLowerCase()) return fail;
      if (!(await bcrypt.compare(password, parent.passwordHash))) return fail;
      saveSession(parent.id, remember);
      setCurrentUser(publicUser(parent));
      return { ok: true };
    } catch {
      return fail;
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    resetRef.current = null;
    setCurrentUser(null);
  }, []);

  // Verifies email + recovery answer. On success returns a short-lived reset token.
  const forgotPassword = useCallback(async (email, answer) => {
    const generic = { ok: false, error: 'البريد الإلكتروني أو الإجابة غير صحيحة' };
    try {
      const parent = db.getParent();
      if (!parent || parent.email.toLowerCase() !== email.trim().toLowerCase()) return generic;
      if (!parent.recoveryAnswerHash) {
        return {
          ok: false,
          error: 'لم تُحدَّد إجابة الاسترداد بعد. سجّل الدخول وحدّدها من قسم الإعدادات.',
        };
      }
      const match = await bcrypt.compare(normalizeAnswer(answer), parent.recoveryAnswerHash);
      if (!match) return generic;
      const token = uid();
      resetRef.current = { token, expires: Date.now() + RESET_TTL_MS };
      return { ok: true, resetToken: token };
    } catch {
      return generic;
    }
  }, []);

  // Reset flow: changePassword({ newPassword, resetToken })
  // Logged-in flow: changePassword({ newPassword, currentPassword })
  const changePassword = useCallback(
    async ({ newPassword, currentPassword, resetToken }) => {
      if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
        return { ok: false, error: `كلمة المرور يجب ألا تقل عن ${MIN_PASSWORD_LENGTH} أحرف` };
      }
      try {
        const parent = db.getParent();
        if (resetToken) {
          const r = resetRef.current;
          if (!r || r.token !== resetToken || Date.now() > r.expires) {
            return { ok: false, error: 'انتهت صلاحية الطلب، أعد التحقق من البريد والإجابة' };
          }
        } else {
          if (!currentUser) return { ok: false, error: 'يجب تسجيل الدخول أولًا' };
          if (!(await bcrypt.compare(currentPassword || '', parent.passwordHash))) {
            return { ok: false, error: 'كلمة المرور الحالية غير صحيحة' };
          }
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        db.saveParent({ ...parent, passwordHash, usingDefaultPassword: false });
        resetRef.current = null;
        if (currentUser) syncUser();
        return { ok: true };
      } catch {
        return { ok: false, error: 'تعذّر تحديث كلمة المرور' };
      }
    },
    [currentUser]
  );

  const setRecoveryAnswer = useCallback(
    async (answer, currentPassword) => {
      const normalized = normalizeAnswer(answer || '');
      if (normalized.length < 2) return { ok: false, error: 'أدخل إجابة صحيحة' };
      try {
        const parent = db.getParent();
        if (!(await bcrypt.compare(currentPassword || '', parent.passwordHash))) {
          return { ok: false, error: 'كلمة المرور الحالية غير صحيحة' };
        }
        db.saveParent({ ...parent, recoveryAnswerHash: await bcrypt.hash(normalized, 10) });
        if (currentUser) syncUser();
        return { ok: true };
      } catch {
        return { ok: false, error: 'تعذّر حفظ الإجابة' };
      }
    },
    [currentUser]
  );

  const updateProfile = useCallback(async ({ name }) => {
    if (!name || !name.trim()) return { ok: false, error: 'أدخل الاسم' };
    db.saveParent({ ...db.getParent(), name: name.trim() });
    syncUser();
    return { ok: true };
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: !!currentUser,
      role: currentUser?.role ?? null,
      login,
      logout,
      forgotPassword,
      changePassword,
      setRecoveryAnswer,
      updateProfile,
    }),
    [currentUser, login, logout, forgotPassword, changePassword, setRecoveryAnswer, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
