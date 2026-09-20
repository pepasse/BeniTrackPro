import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('device_api_keys')
export class DeviceApiKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  vehicleId!: string;

  // Nom donné par l'utilisateur pour identifier la balise (ex: "Traceur Teltonika #1")
  @Column({ type: 'varchar', length: 150 })
  label!: string;

  // Préfixe affiché dans l'interface pour identifier la clé sans jamais
  // révéler sa valeur complète (ex: "btp_a1b2c3d4")
  @Column({ type: 'varchar', length: 20 })
  @Index()
  keyPrefix!: string;

  // Hash SHA-256 de la clé complète — la clé en clair n'est JAMAIS stockée
  // et n'est montrée qu'une seule fois, au moment de sa création.
  @Column({ type: 'varchar', length: 255 })
  keyHash!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
