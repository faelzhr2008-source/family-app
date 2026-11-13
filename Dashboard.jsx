import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useFamilyData } from './useFamilyData';
import { btnPrimary } from './ui';
import StatCards from './StatCards';
import LeaderboardSection from './LeaderboardSection';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { stats, champion, leaderboard } = useFamilyData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">لوحة العائلة</h1>
          <p className="text-sm text-emerald-900/60">مرحبًا، {currentUser.name}</p>
        </div>
        <Link to="/admin" className={btnPrimary}>
          الذهاب إلى الإدارة
        </Link>
      </div>
      <StatCards stats={stats} champion={champion} />
      <LeaderboardSection leaderboard={leaderboard} />
    </div>
  );
}
