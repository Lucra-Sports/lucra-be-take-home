import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum GameStatus {
  PENDING = 'PENDING',
  CLEARED = 'CLEARED',
  EXPLODED = 'EXPLODED',
}

@Entity({ name: 'games' })
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: GameStatus,
    enumName: 'permission_enum',
    default: GameStatus.PENDING,
  })
  status: GameStatus;
}
