import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum GeofenceType {
  CIRCLE = 'circle',
  POLYGON = 'polygon',
}

export interface PolygonPoint {
  latitude: number;
  longitude: number;
}

@Entity('geofences')
export class Geofence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'enum', enum: GeofenceType })
  type!: GeofenceType;

  // Utilisé si type = circle
  @Column({ type: 'double precision', nullable: true })
  centerLatitude?: number;

  @Column({ type: 'double precision', nullable: true })
  centerLongitude?: number;

  @Column({ type: 'double precision', nullable: true })
  radiusMeters?: number;

  // Utilisé si type = polygon : liste de points [{ latitude, longitude }, ...]
  @Column({ type: 'jsonb', nullable: true })
  polygon?: PolygonPoint[];

  // null = s'applique à tous les véhicules de la flotte ; sinon scopée à un véhicule précis
  @Column({ type: 'uuid', nullable: true })
  vehicleId?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
