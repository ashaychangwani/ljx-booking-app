import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';

export enum BookingType {
  ONE_TIME = 'one_time',
  RECURRING = 'recurring'
}

export enum BookingStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALWAYS = 'always'
}

@Entity()
export class BookingJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // User information stored directly
  @Column()
  userEmail: string;

  @Column()
  userLastName: string;

  @Column()
  userUnitNumber: string;

  @Column()
  amenityId: string;

  @Column()
  amenityName: string;

  @Column({
    type: 'simple-enum',
    enum: BookingType
  })
  bookingType: BookingType;

  @Column({
    type: 'simple-enum',
    enum: BookingStatus,
    default: BookingStatus.ACTIVE
  })
  status: BookingStatus;

  // For one-time bookings
  @Column({ nullable: true })
  targetDate: Date;

  @Column({ nullable: true })
  targetTime: string; // Format: "HH:MM"

  // For recurring bookings
  @Column({
    type: 'simple-enum',
    enum: RecurrenceFrequency,
    nullable: true
  })
  recurrenceFrequency: RecurrenceFrequency;

  @Column({ nullable: true })
  preferredTime: string; // Format: "HH:MM"

  @Column({ type: 'simple-array', nullable: true })
  preferredDaysOfWeek: number[]; // 0-6 for Sunday-Saturday

  @Column({ nullable: true })
  endDate: Date; // When to stop recurring bookings

  @Column({ default: 1 })
  partySize: number;

  @Column({ default: 0 })
  successfulBookings: number;

  @Column({ default: 0 })
  failedAttempts: number;

  @Column({ nullable: true })
  lastAttempt: Date;

  @Column({ nullable: true })
  lastSuccessfulBooking: Date;

  @Column({ nullable: true, type: 'text' })
  errorMessage: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => BookedSlot, (slot) => slot.bookingJob, { cascade: true, eager: true })
  bookedSlots: BookedSlot[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity()
export class BookedSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => BookingJob, (job) => job.bookedSlots)
  bookingJob: BookingJob;

  @Column()
  reservationId: string;

  @Column()
  accessCode: string;

  @Column()
  bookedDate: string;

  @Column()
  bookedTime: string;

  @CreateDateColumn()
  createdAt: Date;
} 