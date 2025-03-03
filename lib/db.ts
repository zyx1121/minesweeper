import Dexie from "dexie";

export interface RevealedPosition {
  x: number;
  y: number;
}

class MinesweeperDB extends Dexie {
  public revealedPositions: Dexie.Table<RevealedPosition, [number, number]>;
  public constructor() {
    super("minesweeper-db");
    this.version(1).stores({
      revealedPositions: "[x+y]",
    });
    this.revealedPositions = this.table("revealedPositions");
  }

  async clearAllTables() {
    return Promise.all([this.revealedPositions.clear()]);
  }
}

const db = new MinesweeperDB();

export async function saveRevealedPosition(
  x: number,
  y: number
): Promise<void> {
  await db.revealedPositions.put({ x, y });
}

export async function getRevealedPositions(): Promise<RevealedPosition[]> {
  return (await db.revealedPositions.toArray()) as RevealedPosition[];
}

export async function getRevealedPositionsInRange(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): Promise<RevealedPosition[]> {
  return await db.revealedPositions
    .where("[x+y]")
    .between([minX, minY], [maxX, maxY])
    .toArray();
}

export async function resetDB(): Promise<void> {
  return db.transaction("rw", db.revealedPositions, async () => {
    await db.revealedPositions.clear();
  });
}
