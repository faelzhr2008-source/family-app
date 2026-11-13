import { useAuth } from './AuthContext';
import { useFamilyData } from './useFamilyData';
import { Alert } from './ui';
import StatCards from './StatCards';
import ChildrenSection from './ChildrenSection';
import TasksSection from './TasksSection';
import EvidenceSection from './EvidenceSection';
import LeaderboardSection from './LeaderboardSection';
import LogsSection from './LogsSection';
import SettingsSection from './SettingsSection';

export default function Admin() {
  const { currentUser } = useAuth();
  const f = useFamilyData();

  const nav = [
    ['children', 'الأطفال'],
    ['tasks', 'المهام'],
    ['evidence', f.stats.awaitingReview ? `الأدلة (${f.stats.awaitingReview})` : 'الأدلة'],
    ['leaderboard', 'الترتيب'],
    ['logs', 'السجل'],
    ['settings', 'الإعدادات'],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-emerald-900">لوحة الإدارة</h1>
        <p className="text-sm text-emerald-900/60">مرحبًا، {currentUser.name}</p>
      </div>

      {currentUser.usingDefaultPassword && (
        <Alert kind="warning">
          ما زلت تستخدم كلمة المرور الافتراضية. غيّرها من{' '}
          <a href="#settings" className="font-semibold underline">
            الإعدادات
          </a>
          .
        </Alert>
      )}
      {!currentUser.hasRecoveryAnswer && (
        <Alert kind="warning">
          لم تحدّد إجابة سؤال الاسترداد بعد، ولن تتمكن من استعادة كلمة المرور بدونها. حدّدها من{' '}
          <a href="#settings" className="font-semibold underline">
            الإعدادات
          </a>
          .
        </Alert>
      )}

      <StatCards stats={f.stats} champion={f.champion} />

      <nav aria-label="أقسام الإدارة" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {nav.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="shrink-0 rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-50"
          >
            {label}
          </a>
        ))}
      </nav>

      <ChildrenSection kids={f.children} onAdd={f.addChild} onUpdate={f.updateChild} onDelete={f.deleteChild} />
      <TasksSection
        tasks={f.tasks}
        kids={f.children}
        onAdd={f.addTask}
        onUpdate={f.updateTask}
        onDelete={f.deleteTask}
        onAttachEvidence={f.attachEvidence}
      />
      <EvidenceSection tasks={f.tasks} kids={f.children} onApprove={f.approveTask} onReject={f.rejectTask} />
      <LeaderboardSection leaderboard={f.leaderboard} />
      <LogsSection logs={f.logs} kids={f.children} onAdjust={f.adjustPoints} />
      <SettingsSection />
    </div>
  );
}
