import { resetDB } from "@/lib/db";

const MINE_DENSITY = 0.15;
const DEFAULT_SEED = 0;

export function getGameState() {
  if (typeof window === "undefined")
    return { seed: DEFAULT_SEED, isFirstClick: true };

  const savedSeed = localStorage.getItem("minesweeper-seed");
  const isFirstClick =
    localStorage.getItem("minesweeper-first-click") !== "false";

  return {
    seed: savedSeed ? parseInt(savedSeed) : DEFAULT_SEED,
    isFirstClick,
  };
}

export function generateSeed(x: number, y: number) {
  while (true) {
    const seed = Math.floor(Math.random() * 1000000);
    if (!isMine(x, y, seed) && !countMines(x, y, seed)) {
      localStorage.setItem("minesweeper-seed", seed.toString());
      return seed;
    }
  }
}

export function saveIsFirstClick(isFirstClick: boolean) {
  if (typeof window === "undefined") return;

  localStorage.setItem("minesweeper-first-click", isFirstClick.toString());
}

export function getCurrentSeed(): number {
  return getGameState().seed;
}

export async function resetGame() {
  await Promise.all([
    localStorage.removeItem("minesweeper-seed"),
    localStorage.removeItem("minesweeper-first-click"),
    localStorage.removeItem("minesweeper-cameraOffset"),
    resetDB(),
  ]);
}

export function isMine(x: number, y: number, seed?: number): boolean {
  if (seed === undefined) {
    const { seed } = getGameState();
    return isMine(x, y, seed);
  }
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  const randomValue = n - Math.floor(n);
  return randomValue < MINE_DENSITY;
}

export function countMines(x: number, y: number, seed?: number) {
  if (seed === undefined) {
    const { seed } = getGameState();
    return countMines(x, y, seed);
  }
  if (isMine(x, y, seed)) return 9;
  let count = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      if (isMine(x + dx, y + dy, seed)) {
        count++;
      }
    }
  }
  return count;
}
