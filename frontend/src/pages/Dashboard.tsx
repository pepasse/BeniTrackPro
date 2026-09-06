import { useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-ink">
      <header className="flex items-center justify-between border-b border-border px-8 py-4">
        <span className="font-display text-lg font-semibold text-text">BeniTrackPro</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-muted">{user?.fullName}</span>
          <button
            onClick={handleLogout}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text"
          >
            Se déconnecter
          </button>
        </div>
      </header>

      <main className="px-8 py-12">
        <h1 className="font-display text-2xl font-semibold text-text">
          Bienvenue, {user?.fullName}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          La carte de suivi et la liste des véhicules arrivent à la prochaine étape.
        </p>
      </main>
    </div>
  );
};

export default DashboardPage;
