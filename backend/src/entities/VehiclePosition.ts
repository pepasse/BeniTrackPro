import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

// Table de séries temporelles : un point GPS par ligne.
// Convertie en hypertable TimescaleDB sur la colonne `recordedAt` (voir database.ts).
@Entity('vehicle_positions')
@Index(['vehicleId', 'recordedAt'])
export class VehiclePosition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'double precision' })
  longitude!: number;

  @Column({ type: 'double precision', nullable: true })
  speedKmh?: number;

  @Column({ type: 'double precision', nullable: true })
  heading?: number;

  // Horodatage de la mesure GPS (pas forcément identique à l'heure de réception serveur)
  @Column({ type: 'timestamptz' })
  recordedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
