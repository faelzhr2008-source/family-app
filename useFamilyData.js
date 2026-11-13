import { useCallback, useMemo, useRef, useState } from 'react';
import bcrypt from 'bcryptjs';
import { db, uid } from './storage';

const monthOf = (value) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const makeLog = (type, child, points, text) => ({
  id: uid(),
  type, // approval | reward | penalty | purchase
  childId: child?.id ?? null,
  childName: child?.name ?? '—',
  points,
  text,
  at: new Date().toISOString(),
});

function validateChild({ name, age, username, password }, children, editingId, requirePassword) {
  if (!name.trim()) return 'أدخل اسم الطفل';
  const n = Number(age);
  if (!Number.isInteger(n) || n < 1 || n > 25) return 'العمر يجب أن يكون رقمًا بين 1 و 25';
  if (!/^\S{3,}$/.test(username.trim())) return 'اسم المستخدم 3 أحرف على الأقل وبدون مسافات';
  if (children.some((c) => c.id !== editingId && c.username.toLowerCase() === username.trim().toLowerCase())) {
    return 'اسم المستخدم مستخدم بالفعل';
  }
  if ((requirePassword || password) && password.length < 6) return 'كلمة مرور الطفل 6 أحرف على الأقل';
  return null;
}

function validateTask({ title, points, childId }, children) {
  if (!title.trim()) return 'أدخل عنوان المهمة';
  const p = Number(points);
  if (!Number.isInteger(p) || p < 1 || p > 1000) return 'النقاط يجب أن تكون رقمًا صحيحًا بين 1 و 1000';
  if (!children.some((c) => c.id === childId)) return 'اختر الطفل المسؤول عن المهمة';
  return null;
}

export function useFamilyData() {
  const [data, setData] = useState(() => ({
    children: db.getChildren(),
    tasks: db.getTasks(),
    logs: db.getLogs(),
  }));
  const ref = useRef(data);

  // Applies a pure mutation, persists it, and rolls back if storage is full.
  const commit = useCallback((mutate) => {
    const prev = ref.current;
    const next = mutate(prev);
    try {
      db.saveChildren(next.children);
      db.saveTasks(next.tasks);
      db.saveLogs(next.logs);
    } catch {
      try {
        db.saveChildren(prev.children);
        db.saveTasks(prev.tasks);
        db.saveLogs(prev.logs);
      } catch {
        /* nothing more we can do */
      }
      return { ok: false, error: 'مساحة التخزين المحلية ممتلئة. احذف بعض الصور أو المهام القديمة.' };
    }
    ref.current = next;
    setData(next);
    return { ok: true };
  }, []);

  /* ---------- children ---------- */
  const addChild = useCallback(
    async (form) => {
      const error = validateChild(form, ref.current.children, null, true);
      if (error) return { ok: false, error };
      const passwordHash = await bcrypt.hash(form.password, 10);
      return commit((d) => ({
        ...d,
        children: [
          ...d.children,
          {
            id: uid(),
            name: form.name.trim(),
            age: Number(form.age),
            username: form.username.trim(),
            passwordHash,
            points: 0,
            avatar: form.avatar || '🦁',
photo: form.photo || '',
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    },
    [commit]
  );

  const updateChild = useCallback(
    async (id, form) => {
      const error = validateChild(form, ref.current.children, id, false);
      if (error) return { ok: false, error };
      const passwordHash = form.password ? await bcrypt.hash(form.password, 10) : null;
      return commit((d) => ({
        ...d,
        children: d.children.map((c) =>
          c.id === id
            ? {
                ...c,
                name: form.name.trim(),
                age: Number(form.age),
                username: form.username.trim(),
                avatar: form.avatar || '🦁',
photo: form.photo || '',
                ...(passwordHash ? { passwordHash } : {}),
              }
            : c
        ),
      }));
    },
    [commit]
  );

  const deleteChild = useCallback(
    (id) =>
      commit((d) => ({
        ...d,
        children: d.children.filter((c) => c.id !== id),
        tasks: d.tasks.filter((t) => t.childId !== id),
      })),
    [commit]
  );

  /* ---------- tasks ---------- */
  const addTask = useCallback(
    (form) => {
      const error = validateTask(form, ref.current.children);
      if (error) return { ok: false, error };
      return commit((d) => ({
        ...d,
        tasks: [
          {
            id: uid(),
            title: form.title.trim(),
            description: (form.description || '').trim(),
            points: Number(form.points),
            childId: form.childId,
            status: 'pending', // pending | submitted | approved | rejected
            beforeImage: null,
            afterImage: null,
            createdAt: new Date().toISOString(),
          },
          ...d.tasks,
        ],
      }));
    },
    [commit]
  );

  const updateTask = useCallback(
    (id, form) => {
      const error = validateTask(form, ref.current.children);
      if (error) return { ok: false, error };
      return commit((d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                title: form.title.trim(),
                description: (form.description || '').trim(),
                points: Number(form.points),
                childId: form.childId,
              }
            : t
        ),
      }));
    },
    [commit]
  );

  const deleteTask = useCallback(
    (id) => commit((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) })),
    [commit]
  );

  const attachEvidence = useCallback(
    (id, beforeImage, afterImage) =>
      commit((d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === id
            ? { ...t, beforeImage, afterImage, status: 'submitted', submittedAt: new Date().toISOString() }
            : t
        ),
      })),
    [commit]
  );

  /* ---------- review ---------- */
  const approveTask = useCallback(
    (id) =>
      commit((d) => {
        const task = d.tasks.find((t) => t.id === id);
        if (!task || task.status !== 'submitted') return d;
        const child = d.children.find((c) => c.id === task.childId);
        return {
          ...d,
          tasks: d.tasks.map((t) =>
            t.id === id ? { ...t, status: 'approved', reviewedAt: new Date().toISOString() } : t
          ),
          children: d.children.map((c) => (c.id === task.childId ? { ...c, points: c.points + task.points } : c)),
          logs: [makeLog('approval', child, task.points, `اعتماد مهمة: ${task.title}`), ...d.logs],
        };
      }),
    [commit]
  );

  const rejectTask = useCallback(
    (id) =>
      commit((d) => {
        const task = d.tasks.find((t) => t.id === id);
        if (!task || task.status !== 'submitted') return d;
        const child = d.children.find((c) => c.id === task.childId);
        return {
          ...d,
          tasks: d.tasks.map((t) =>
            t.id === id ? { ...t, status: 'rejected', reviewedAt: new Date().toISOString() } : t
          ),
          logs: [makeLog('approval', child, 0, `رفض مهمة: ${task.title}`), ...d.logs],
        };
      }),
    [commit]
  );

  /* ---------- rewards & penalties ---------- */
  const adjustPoints = useCallback(
    ({ childId, kind, points, reason }) => {
      const amount = Number(points);
      if (!ref.current.children.some((c) => c.id === childId)) return { ok: false, error: 'اختر الطفل' };
      if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
        return { ok: false, error: 'النقاط يجب أن تكون رقمًا صحيحًا بين 1 و 1000' };
      }
      const signed = kind === 'reward' ? amount : -amount;
      return commit((d) => {
        const child = d.children.find((c) => c.id === childId);
        const label = kind === 'reward' ? 'مكافأة' : 'خصم';
        return {
          ...d,
          children: d.children.map((c) =>
            c.id === childId ? { ...c, points: Math.max(0, c.points + signed) } : c
          ),
          logs: [
            makeLog(kind, child, signed, reason?.trim() ? `${label}: ${reason.trim()}` : label),
            ...d.logs,
          ],
        };
      });
    },
    [commit]
  );

  /* ---------- derived ---------- */
  const { children, tasks, logs } = data;

  const stats = useMemo(
    () => ({
      childrenCount: children.length,
      totalPoints: children.reduce((s, c) => s + c.points, 0),
      pendingTasks: tasks.filter((t) => t.status !== 'approved').length,
      approvedTasks: tasks.filter((t) => t.status === 'approved').length,
      awaitingReview: tasks.filter((t) => t.status === 'submitted').length,
    }),
    [children, tasks]
  );

  const leaderboard = useMemo(() => {
    const current = monthOf(new Date());
    const totals = new Map(children.map((c) => [c.id, 0]));
    logs.forEach((l) => {
      if (l.childId && totals.has(l.childId) && monthOf(l.at) === current) {
        totals.set(l.childId, totals.get(l.childId) + l.points);
      }
    });
    return children
      .map((c) => ({ id: c.id, name: c.name, monthPoints: totals.get(c.id) }))
      .sort((a, b) => b.monthPoints - a.monthPoints || a.name.localeCompare(b.name, 'ar'));
  }, [children, logs]);

  const champion = leaderboard[0] && leaderboard[0].monthPoints > 0 ? leaderboard[0] : null;

  return {
    children,
    tasks,
    logs,
    stats,
    leaderboard,
    champion,
    addChild,
    updateChild,
    deleteChild,
    addTask,
    updateTask,
    deleteTask,
    attachEvidence,
    approveTask,
    rejectTask,
    adjustPoints,
  };
}