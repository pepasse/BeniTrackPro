import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('subscription_payments')
export class SubscriptionPayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  vehicleId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 10, default: 'XAF' })
  currency!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  method?: string; // ex: 'mobile_money', 'bank_transfer', 'cash'

  @Column({ type: 'varchar', length: 150, nullable: true })
  reference?: string; // référence de transaction externe

  // Date d'expiration de l'abonnement au moment de ce paiement (pour l'historique)
  @Column({ type: 'timestamptz' })
  newExpiresAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  paidAt!: Date;
}
