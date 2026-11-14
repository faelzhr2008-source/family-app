import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import bcrypt from 'bcryptjs';
import {
  initStorage,
  pullFromCloud,
  pushToCloud,
  setActiveFamilyId,
  RECOVERY_QUESTION,
  db,
  publicUser,
  saveSession,
  clearSession,
  loadSession,
  normalizeAnswer,
  uid,
} from './storage';

export const MIN_PASSWORD_LENGTH = 8;
const RESET_TTL_MS = 10 * 60 * 1000;

initStorage();

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => loadSession());
  const resetRef = useRef(null);

  const syncUser = () => setCurrentUser(publicUser(db.getParent()));

  const registerParent = useCallback(async ({ name, email, password, recoveryAnswer }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!name || !name.trim()) return { ok: false, error: 'أدخل اسم ولي الأمر أو العائلة' };
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return { ok: false, error: 'أدخل بريداً إلكترونياً صحيحاً' };
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return { ok: false, error: `كلمة المرور يجب ألا تقل عن ${MIN_PASSWORD_LENGTH} أحرف` };
    }

    try {
      const exists = await pullFromCloud(cleanEmail);
      if (exists) {
        return { ok: false, error: 'هذا البريد الإلكتروني مسجّل بالفعل، يمكنك تسجيل الدخول به مباشرة' };
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const normAns = normalizeAnswer(recoveryAnswer || '');
      const recoveryAnswerHash = normAns.length >= 2 ? await bcrypt.hash(normAns, 10) : null;

      const newParent = {
        id: uid(),
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        usingDefaultPassword: false,
        recoveryQuestion: RECOVERY_QUESTION,
        recoveryAnswerHash,
        role: 'parent',
      };

      setActiveFamilyId(cleanEmail);
      localStorage.setItem('fam_parent', JSON.stringify(newParent));
      localStorage.setItem('fam_children', JSON.stringify([]));
      localStorage.setItem('fam_tasks', JSON.stringify([]));
      localStorage.setItem('fam_submissions', JSON.stringify([]));
      localStorage.setItem('fam_logs', JSON.stringify([]));

      await pushToCloud(cleanEmail);
      saveSession(newParent.id, true);
      setCurrentUser(publicUser(newParent));
      return { ok: true };
    } catch {
      return { ok: false, error: 'تعذّر إنشاء الحساب، تأكد من اتصالك بالإنترنت' };
    }
  }, []);

  const login = useCallback(async (email, password, remember = true) => {
    const fail = { ok: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    try {
      const cleanEmail = email.trim().toLowerCase();
      await pullFromCloud(cleanEmail);
      const parent = db.getParent();
      if (!parent || parent.email.toLowerCase() !== cleanEmail) return fail;
      if (!(await bcrypt.compare(password, parent.passwordHash))) return fail;
      setActiveFamilyId(cleanEmail);
      saveSession(parent.id, remember);
      setCurrentUser(publicUser(parent));
      return { ok: true };
    } catch {
      return fail;
    }
  }, []);

  const loginChild = useCallback(async (familyEmail, username, password, remember = true) => {
    const fail = { ok: false, error: 'بيانات الدخول غير صحيحة، تأكد من بريد العائلة واسم المستخدم وكلمة المرور' };
    try {
      const cleanEmail = (familyEmail || '').trim().toLowerCase();
      if (cleanEmail) {
        await pullFromCloud(cleanEmail);
      }
      const kids = db.getChildren ? db.getChildren() : [];
      const child = kids.find(
        (k) => k.username && k.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (!child) return fail;
      if (!(await bcrypt.compare(password, child.passwordHash))) return fail;
      if (cleanEmail) setActiveFamilyId(cleanEmail);
      saveSession(child.id, remember);
      setCurrentUser({ ...publicUser(child), role: 'child' });
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

  const forgotPassword = useCallback(async (email, answer) => {
    const generic = { ok: false, error: 'البريد الإلكتروني أو الإجابة غير صحيحة' };
    try {
      const cleanEmail = email.trim().toLowerCase();
      await pullFromCloud(cleanEmail);
      const parent = db.getParent();
      if (!parent || parent.email.toLowerCase() !== cleanEmail) return generic;
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
      registerParent,
      login,
      loginChild,
      logout,
      forgotPassword,
      changePassword,
      setRecoveryAnswer,
      updateProfile,
    }),
    [
      currentUser,
      registerParent,
      login,
      loginChild,
      logout,
      forgotPassword,
      changePassword,
      setRecoveryAnswer,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
