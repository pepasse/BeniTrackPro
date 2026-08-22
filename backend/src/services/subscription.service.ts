import { getConnection } from '../config/database';
import { VehicleSubscription, SubscriptionStatus } from '../entities/VehicleSubscription';
import { SubscriptionPayment } from '../entities/SubscriptionPayment';
import logger from '../config/logger';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const NOTIFICATION_WINDOW_DAYS = 30; // dernier mois avant expiration
const NOTIFICATION_INTERVAL_DAYS = 7; // au maximum 1 notification par semaine

const subscriptionRepository = () => getConnection().getRepository(VehicleSubscription);
const paymentRepository = () => getConnection().getRepository(SubscriptionPayment);

// Appelé à la création d'un véhicule : ouvre un abonnement d'un an.
export const createInitialSubscription = async (vehicleId: string): Promise<VehicleSubscription> => {
  const now = new Date();
  const subscription = subscriptionRepository().create({
    vehicleId,
    status: SubscriptionStatus.ACTIVE,
    startedAt: now,
    expiresAt: new Date(now.getTime() + ONE_YEAR_MS),
  });
  return subscriptionRepository().save(subscription);
};

// Vérification "live" : ne fait jamais confiance au champ `status` seul,
// car il n'est mis à jour que lors des accès ou d'une tâche planifiée.
// La vraie source de vérité est toujours `expiresAt` comparé à maintenant.
export const isSubscriptionActive = async (vehicleId: string): Promise<boolean> => {
  const subscription = await subscriptionRepository().findOneBy({ vehicleId });
  if (!subscription) return false; // pas d'abonnement = pas d'accès

  const isActive = subscription.expiresAt.getTime() > Date.now();

  // Met à jour paresseusement le statut stocké s'il est désynchronisé
  // (utile pour les tableaux de bord/rapports sans dépendre d'un cron)
  const expectedStatus = isActive ? SubscriptionStatus.ACTIVE : SubscriptionStatus.EXPIRED;
  if (subscription.status !== expectedStatus) {
    subscription.status = expectedStatus;
    await subscriptionRepository().save(subscription);
  }

  return isActive;
};

export const getSubscription = async (vehicleId: string): Promise<VehicleSubscription | null> => {
  return subscriptionRepository().findOneBy({ vehicleId });
};

interface RenewParams {
  vehicleId: string;
  amount: number;
  currency?: string;
  method?: string;
  reference?: string;
}

// Enregistre un paiement et prolonge l'abonnement d'un an.
// Si l'abonnement n'est pas encore expiré, la nouvelle échéance part de
// l'ancienne date d'expiration (pas de temps "perdu" pour un paiement anticipé).
// S'il est déjà expiré, elle part d'aujourd'hui.
export const renewSubscription = async (params: RenewParams): Promise<VehicleSubscription> => {
  const { vehicleId, amount, currency, method, reference } = params;
  const repo = subscriptionRepository();

  let subscription = await repo.findOneBy({ vehicleId });
  const now = new Date();

  if (!subscription) {
    subscription = repo.create({
      vehicleId,
      status: SubscriptionStatus.ACTIVE,
      startedAt: now,
      expiresAt: now,
    });
  }

  const base = subscription.expiresAt.getTime() > now.getTime() ? subscription.expiresAt.getTime() : now.getTime();
  subscription.expiresAt = new Date(base + ONE_YEAR_MS);
  subscription.status = SubscriptionStatus.ACTIVE;
  subscription.lastNotifiedAt = undefined;
  await repo.save(subscription);

  const payment = paymentRepository().create({
    vehicleId,
    amount,
    currency: currency || 'XAF',
    method,
    reference,
    newExpiresAt: subscription.expiresAt,
  });
  await paymentRepository().save(payment);

  logger.info(`Abonnement renouvelé pour le véhicule ${vehicleId}, nouvelle échéance : ${subscription.expiresAt.toISOString()}`);

  return subscription;
};

export const getPaymentHistory = async (vehicleId: string): Promise<SubscriptionPayment[]> => {
  return paymentRepository().find({ where: { vehicleId }, order: { paidAt: 'DESC' } });
};


export interface ExpirationWarning {
  vehicleId: string;
  daysRemaining: number;
  expiresAt: Date;
}

// Appelé chaque fois qu'un client consulte le suivi de son véhicule
// (position, historique, abonnement...). Si l'abonnement expire dans les
// 30 prochains jours ET qu'aucun avertissement n'a été montré depuis au
// moins 7 jours, renvoie un avertissement à afficher dans l'app — sinon
// renvoie null. Pas d'email : le message n'existe qu'au moment où le
// client regarde réellement son véhicule.
export const checkExpirationWarning = async (vehicleId: string): Promise<ExpirationWarning | null> => {
  const subscription = await subscriptionRepository().findOneBy({ vehicleId });
  if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) return null;

  const now = Date.now();
  const msRemaining = subscription.expiresAt.getTime() - now;
  const daysRemaining = Math.ceil(msRemaining / ONE_DAY_MS);

  if (daysRemaining <= 0 || daysRemaining > NOTIFICATION_WINDOW_DAYS) return null;

  const dueForWarning =
    !subscription.lastNotifiedAt ||
    now - subscription.lastNotifiedAt.getTime() >= NOTIFICATION_INTERVAL_DAYS * ONE_DAY_MS;

  if (!dueForWarning) return null;

  subscription.lastNotifiedAt = new Date(now);
  await subscriptionRepository().save(subscription);

  return { vehicleId, daysRemaining, expiresAt: subscription.expiresAt };
};
