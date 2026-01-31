import {
  buildCellSeeds,
  computeMineCount,
  countNeighboringMines,
  computeRevealPositions,
  pickMinePositions,
} from './games.logic';

describe('games.logic', () => {
  it('computes mine count with bounds', () => {
    expect(computeMineCount(1, 0.5)).toBe(0);
    expect(computeMineCount(4, 0.1)).toBe(1);
    expect(computeMineCount(10, 0.9)).toBe(9);
  });

  it('builds cell seeds with correct neighboring counts', () => {
    const minePositions = new Set<number>([0]);
    const seeds = buildCellSeeds(2, 2, minePositions);

    const byCoord = (x: number, y: number) =>
      seeds.find(
        (seed) => seed.xCoordinate === x && seed.yCoordinate === y,
      );

    expect(byCoord(0, 0)).toEqual({
      xCoordinate: 0,
      yCoordinate: 0,
      isMine: true,
      neighboringBombCount: 0,
    });
    expect(byCoord(1, 0)?.neighboringBombCount).toBe(1);
    expect(byCoord(0, 1)?.neighboringBombCount).toBe(1);
    expect(byCoord(1, 1)?.neighboringBombCount).toBe(1);
  });

  it('counts neighboring mines for a center cell', () => {
    const minePositions = new Set<number>([0, 2, 6, 8]);
    const count = countNeighboringMines(1, 1, 3, 3, minePositions);
    expect(count).toBe(4);
  });

  it('reveals only the clicked cell when count is non-zero', () => {
    const isMine = [false, false];
    const counts = [1, 0];
    const revealed = computeRevealPositions(1, 2, isMine, counts, 0, 0);
    expect(Array.from(revealed)).toEqual([1, 0]);
  });

  it('flood reveals zero regions and bordering numbers', () => {
    const isMine = [false, false, false, false];
    const counts = [0, 1, 0, 1];
    const revealed = computeRevealPositions(2, 2, isMine, counts, 0, 0);
    expect(Array.from(revealed)).toEqual([1, 1, 1, 1]);
  });

  it('does not reveal mines', () => {
    const isMine = [false, true];
    const counts = [1, 0];
    const revealed = computeRevealPositions(1, 2, isMine, counts, 0, 0);
    expect(revealed[1]).toBe(0);
  });

  it('does not reveal when starting on a mine', () => {
    const isMine = [true];
    const counts = [0];
    const revealed = computeRevealPositions(1, 1, isMine, counts, 0, 0);
    expect(revealed[0]).toBe(0);
  });

  it('picks unique mine positions', () => {
    let i = 0;
    const rng = () => (i++ % 10) / 10;
    const positions = pickMinePositions(10, 5, rng);
    expect(positions.size).toBe(5);
  });
});
