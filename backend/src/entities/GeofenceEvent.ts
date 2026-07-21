import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum GeofenceEventType {
  ENTER = 'enter',
  EXIT = 'exit',
}

@Entity('geofence_events')
@Index(['geofenceId', 'vehicleId', 'createdAt'])
export class GeofenceEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  geofenceId!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'enum', enum: GeofenceEventType })
  eventType!: GeofenceEventType;

  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'double precision' })
  longitude!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
