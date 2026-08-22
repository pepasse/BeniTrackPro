import { Entity, PrimaryColumn, Column, Index, CreateDateColumn } from 'typeorm';

// Table de séries temporelles : un point GPS par ligne.
// Convertie en hypertable TimescaleDB sur la colonne `recordedAt` (voir database.ts).
//
// Clé primaire composite (id, recordedAt) : TimescaleDB exige que toute
// contrainte d'unicité (dont la clé primaire) inclue la colonne de
// partitionnement. Un simple `id` en PK empêche la conversion en hypertable.
@Entity('vehicle_positions')
@Index(['vehicleId', 'recordedAt'])
export class VehiclePosition {
  @PrimaryColumn('uuid', { default: () => 'uuid_generate_v4()' })
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

  // Horodatage de la mesure GPS (pas forcément identique à l'heure de réception serveur).
  // Fait partie de la clé primaire (voir note ci-dessus).
  @PrimaryColumn({ type: 'timestamptz' })
  recordedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
