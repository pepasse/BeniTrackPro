import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import RouteIllustration from '../components/RouteIllustration';
import { APP_CONFIG } from '../config/config';

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isLoading = status === 'loading';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const action =
      mode === 'login'
        ? await dispatch(login({ email, password }))
        : await dispatch(register({ fullName, email, password }));

    if (action.type.endsWith('/fulfilled')) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Panneau gauche : identité + illustration route/GPS */}
      <div className="relative hidden w-[58%] flex-col justify-between overflow-hidden bg-ink px-16 py-12 lg:flex">
        <div>
          <span className="font-display text-xl font-semibold tracking-tight text-text">
            {APP_CONFIG.APP_NAME}
          </span>
        </div>

        <div className="flex justify-center">
          <RouteIllustration className="w-full max-w-md" />
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-3xl font-semibold leading-tight text-text">
            Chaque véhicule, localisé à la seconde près.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            Position en temps réel, historique de trajets, alertes de zone et
            consommation — toute votre flotte dans un seul tableau de bord.
          </p>
        </div>
      </div>

      {/* Panneau droit : formulaire */}
      <div className="flex w-full flex-col justify-center bg-surface px-8 py-12 sm:px-16 lg:w-[42%]">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="font-display text-2xl font-semibold text-text">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {mode === 'login'
              ? 'Accédez au suivi de votre flotte.'
              : "Renseignez vos informations pour commencer."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="fullName" className="block text-sm text-text-muted">
                  Nom complet
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-signal"
                  placeholder="Hermes Ngono"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm text-text-muted">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-signal"
                placeholder="vous@entreprise.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-text-muted">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-signal"
                placeholder="8 caractères minimum"
              />
            </div>

            {error && (
              <div className="rounded-md border border-danger-dim bg-danger-dim/30 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-amber px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-amber/90 disabled:opacity-60"
            >
              {isLoading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="mt-6 w-full text-center text-sm text-text-muted hover:text-text"
          >
            {mode === 'login'
              ? "Pas encore de compte ? Créez-en un"
              : 'Déjà un compte ? Connectez-vous'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
