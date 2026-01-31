import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { GameCell } from './game-cell.entity';

export enum GameStatus {
  Active = 'ACTIVE',
  Cleared = 'CLEARED',
  Detonated = 'DETONATED',
}

@Entity({ name: 'games' })
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: GameStatus,
    enumName: 'permission_enum',
    default: GameStatus.Active,
  })
  status: GameStatus;

  @OneToMany(() => GameCell, (cell) => cell.game)
  cells: GameCell[];

  @Column()
  rows: number;

  @Column()
  columns: number;
}
