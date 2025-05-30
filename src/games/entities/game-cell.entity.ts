import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Game } from './game.entity';

export enum CellStatus {
  Hidden = 'HIDDEN',
  Revealed = 'REVEALED',
  Flagged = 'FLAGGED',
  Detonated = 'DETONATED',
}

@Entity({ name: 'game_cells' })
export class GameCell {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Game, (game) => game.cells)
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @Column({
    type: 'enum',
    enum: CellStatus,
    enumName: 'cell_status_enum',
    default: CellStatus.Hidden,
  })
  status: CellStatus;

  @Column({ name: 'x_coordinate', default: 0 })
  xCoordinate: number;

  @Column({ name: 'y_coordinate', default: 0 })
  yCoordinate: number;

  @Column({ name: 'is_mine', default: false })
  isMine: boolean;

  @Column({ name: 'neighboring_bomb_count', default: 0 })
  neighboringBombCount: number;
}
