import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum VehicleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

export enum VehicleType {
  CAR = 'car',
  TRUCK = 'truck',
  MOTORCYCLE = 'motorcycle',
  VAN = 'van',
  OTHER = 'other',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  @Index()
  plateNumber!: string;

  @Column({ type: 'varchar', length: 100 })
  brand!: string;

  @Column({ type: 'varchar', length: 100 })
  model!: string;

  @Column({ type: 'int', nullable: true })
  year?: number;

  @Column({ type: 'enum', enum: VehicleType, default: VehicleType.CAR })
  type!: VehicleType;

  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.INACTIVE })
  status!: VehicleStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  rfidTag?: string;

  // Dernière position connue (mise à jour par le flux GPS temps réel)
  @Column({ type: 'double precision', nullable: true })
  lastLatitude?: number;

  @Column({ type: 'double precision', nullable: true })
  lastLongitude?: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastLocationAt?: Date;

  @Column({ type: 'double precision', nullable: true })
  lastSpeedKmh?: number;

  // Consommation moyenne déclarée pour ce véhicule (L/100km), utilisée pour
  // estimer la consommation totale à partir de la distance parcourue,
  // faute de capteur carburant réel branché sur le tracker.
  @Column({ type: 'double precision', default: 10 })
  fuelConsumptionL100km!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
