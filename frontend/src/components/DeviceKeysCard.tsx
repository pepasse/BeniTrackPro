import { type FormEvent, useEffect, useState } from 'react';
import { Copy, KeyRound, Trash2, Check } from 'lucide-react';
import apiClient from '../config/apiClient';
import { API_ENDPOINTS } from '../config/constants';

interface DeviceKey {
  id: string;
  label: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

interface DeviceKeysCardProps {
  vehicleId: string;
}

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
};

const formatLastUsed = (iso?: string): string => {
  if (!iso) return 'Jamais utilisée';
  return `Utilisée le ${new Date(iso).toLocaleDateString('fr-FR')} à ${new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
};

const DeviceKeysCard = ({ vehicleId }: DeviceKeysCardProps) => {
  const [keys, setKeys] = useState<DeviceKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Formulaire de création
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [label, setLabel] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Révélation unique de la clé en clair, juste après création
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadKeys = async () => {
    const { data } = await apiClient.get<DeviceKey[]>(API_ENDPOINTS.VEHICLES.DEVICES(vehicleId));
    setKeys(data);
  };

  useEffect(() => {
    setIsLoading(true);
    loadKeys().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setIsCreating(true);
    setCreateError(null);
    try {
      const { data } = await apiClient.post<{ apiKey: string }>(
        API_ENDPOINTS.VEHICLES.DEVICES(vehicleId),
        { label: label.trim() }
      );
      setRevealedKey(data.apiKey);
      setLabel('');
      setShowCreateForm(false);
      await loadKeys();
    } catch (error) {
      setCreateError(extractErrorMessage(error, 'Impossible de créer la clé'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!revealedKey) return;
    await navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (key: DeviceKey) => {
    const confirmed = window.confirm(
      `Révoquer la clé "${key.label}" ? La balise qui l'utilise ne pourra plus envoyer de position.`
    );
    if (!confirmed) return;
    await apiClient.delete(API_ENDPOINTS.DEVICES.DELETE(key.id));
    await loadKeys();
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-text">Balises GPS (clés API)</h2>
        {!showCreateForm && !revealedKey && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="text-xs font-semibold text-signal hover:text-signal/80"
          >
            + Nouvelle clé
          </button>
        )}
      </div>

      {/* Révélation unique de la clé nouvellement créée */}
      {revealedKey && (
        <div className="mt-3 rounded-md border border-amber/50 bg-amber-dim/20 p-3">
          <p className="text-xs text-amber">
            Copie cette clé maintenant — elle ne sera plus jamais affichée.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-surface-raised px-2 py-1.5 font-mono text-xs text-text">
              {revealedKey}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-md bg-amber p-1.5 text-ink hover:bg-amber/90"
              aria-label="Copier"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <button
            onClick={() => setRevealedKey(null)}
            className="mt-2 w-full rounded-md border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text"
          >
            J'ai copié la clé
          </button>
        </div>
      )}

      {/* Formulaire de création */}
      {showCreateForm && (
        <form onSubmit={handleCreate} className="mt-3 space-y-2">
          <input
            type="text"
            required
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Traceur Teltonika FMB920"
            className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-signal"
          />
          {createError && <p className="text-xs text-danger">{createError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="flex-1 rounded-md border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 rounded-md bg-amber px-3 py-1.5 text-xs font-semibold text-ink hover:bg-amber/90 disabled:opacity-60"
            >
              {isCreating ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      {/* Liste des clés existantes */}
      {isLoading ? (
        <p className="mt-3 text-sm text-text-muted">Chargement…</p>
      ) : keys.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">Aucune balise configurée pour ce véhicule.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {keys.map((key) => (
            <li
              key={key.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface-raised px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <KeyRound size={14} className={key.isActive ? 'text-signal' : 'text-text-muted'} />
                <div className="min-w-0">
                  <p className="truncate text-sm text-text">{key.label}</p>
                  <p className="font-mono text-xs text-text-muted">
                    {key.keyPrefix}… · {formatLastUsed(key.lastUsedAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRevoke(key)}
                className="shrink-0 text-text-muted hover:text-danger"
                aria-label="Révoquer"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DeviceKeysCard;
