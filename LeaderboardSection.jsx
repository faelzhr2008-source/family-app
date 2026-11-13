import { EmptyState, Section } from './ui';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardSection({ leaderboard }) {
  const month = new Date().toLocaleDateString('ar', { month: 'long', year: 'numeric' });
  const max = Math.max(0, ...leaderboard.map((l) => l.monthPoints));

  return (
    <Section id="leaderboard" title={`الترتيب الشهري — ${month}`}>
      {leaderboard.length === 0 ? (
        <EmptyState>أضف أطفالًا لعرض الترتيب.</EmptyState>
      ) : (
        <ol className="space-y-3">
          {leaderboard.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3">
              <span aria-hidden="true" className="w-8 text-center text-xl">
                {MEDALS[i] ?? i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold text-emerald-950">{item.name}</span>
                  <span className="shrink-0 text-sm font-medium text-emerald-800">{item.monthPoints} نقطة</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${max > 0 ? Math.max(0, (item.monthPoints / max) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
