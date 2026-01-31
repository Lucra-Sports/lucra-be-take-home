import { GameCell } from './entities';

export const DEFAULT_MINE_RATIO = 0.15;

export type CellSeed = Pick<
  GameCell,
  'xCoordinate' | 'yCoordinate' | 'isMine' | 'neighboringBombCount'
>;

export function computeMineCount(totalCells: number, mineRatio = DEFAULT_MINE_RATIO) {
  if (totalCells <= 1) {
    return 0;
  }

  const desired = Math.floor(totalCells * mineRatio);
  return Math.min(totalCells - 1, Math.max(1, desired));
}

export function pickMinePositions(
  totalCells: number,
  mineCount: number,
  rng: () => number = Math.random,
) {
  const positions = new Set<number>();
  const maxCount = Math.min(mineCount, totalCells);

  while (positions.size < maxCount) {
    const index = Math.floor(rng() * totalCells);
    positions.add(index);
  }

  return positions;
}

export function buildCellSeeds(
  rows: number,
  columns: number,
  minePositions: Set<number>,
) {
  const cells: CellSeed[] = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const index = y * columns + x;
      const isMine = minePositions.has(index);
      const neighboringBombCount = isMine
        ? 0
        : countNeighboringMines(x, y, rows, columns, minePositions);

      cells.push({
        xCoordinate: x,
        yCoordinate: y,
        isMine,
        neighboringBombCount,
      });
    }
  }

  return cells;
}

export function countNeighboringMines(
  x: number,
  y: number,
  rows: number,
  columns: number,
  minePositions: Set<number>,
) {
  let count = 0;

  for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
    for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
      if (xOffset === 0 && yOffset === 0) {
        continue;
      }

      const neighborX = x + xOffset;
      const neighborY = y + yOffset;

      if (
        neighborX < 0 ||
        neighborX >= columns ||
        neighborY < 0 ||
        neighborY >= rows
      ) {
        continue;
      }

      const neighborIndex = neighborY * columns + neighborX;
      if (minePositions.has(neighborIndex)) {
        count += 1;
      }
    }
  }

  return count;
}

export function computeRevealPositions(
  rows: number,
  columns: number,
  isMine: boolean[],
  neighborCounts: number[],
  startX: number,
  startY: number,
) {
  const total = rows * columns;
  const revealed = new Uint8Array(total);

  const startIndex = startY * columns + startX;
  if (startIndex < 0 || startIndex >= total || isMine[startIndex]) {
    return revealed;
  }

  const queue: number[] = [startIndex];

  for (let i = 0; i < queue.length; i += 1) {
    const index = queue[i];
    if (revealed[index] === 1) {
      continue;
    }

    if (isMine[index]) {
      continue;
    }

    revealed[index] = 1;

    if (neighborCounts[index] !== 0) {
      continue;
    }

    const y = Math.floor(index / columns);
    const x = index - y * columns;

    for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
      for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
        if (xOffset === 0 && yOffset === 0) {
          continue;
        }

        const nx = x + xOffset;
        const ny = y + yOffset;

        if (nx < 0 || nx >= columns || ny < 0 || ny >= rows) {
          continue;
        }

        const neighborIndex = ny * columns + nx;
        if (revealed[neighborIndex] === 0) {
          queue.push(neighborIndex);
        }
      }
    }
  }

  return revealed;
}
