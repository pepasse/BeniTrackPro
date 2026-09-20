import { LogIn, LogOut, X } from 'lucide-react';
import type { GeofenceAlertEvent } from '../services/socket';

export interface GeofenceToast extends GeofenceAlertEvent {
  toastId: string;
  vehiclePlate: string;
}

interface GeofenceAlertStackProps {
  alerts: GeofenceToast[];
  onDismiss: (toastId: string) => void;
}

const GeofenceAlertStack = ({ alerts, onDismiss }: GeofenceAlertStackProps) => {
  if (alerts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-6 top-20 z-[99999] flex w-80 flex-col gap-2">
      {alerts.map((alert) => {
        const isEnter = alert.eventType === 'enter';
        return (
          <div
            key={alert.toastId}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border bg-surface p-3 shadow-lg ${
              isEnter ? 'border-signal/50' : 'border-amber/50'
            }`}
          >
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                isEnter ? 'bg-signal-dim text-signal' : 'bg-amber-dim text-amber'
              }`}
            >
              {isEnter ? <LogIn size={14} /> : <LogOut size={14} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text">
                <span className="font-mono font-medium">{alert.vehiclePlate}</span>{' '}
                {isEnter ? 'est entré dans' : 'a quitté'} <span className="font-medium">{alert.geofenceName}</span>
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                {new Date(alert.occurredAt).toLocaleTimeString('fr-FR')}
              </p>
            </div>
            <button
              onClick={() => onDismiss(alert.toastId)}
              className="shrink-0 text-text-muted hover:text-text"
              aria-label="Fermer"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default GeofenceAlertStack;
