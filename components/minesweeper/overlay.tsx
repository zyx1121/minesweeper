import { getRevealedPositions, RevealedPosition } from "@/lib/db";
import { resetGame } from "@/lib/mine";
import { useEffect, useState } from "react";
import { useMinesweeperContext } from "./context";

export function MinesweeperOverlay() {
  const { isGameOver, setIsGameOver } = useMinesweeperContext();
  const [revealedPositions, setRevealedPositions] = useState<
    RevealedPosition[]
  >([]);

  useEffect(() => {
    getRevealedPositions().then(setRevealedPositions);
  }, [isGameOver]);

  if (!isGameOver) return null;

  const handleReset = async () => {
    await resetGame().then(() => {
      setIsGameOver(false);
    });
  };

  return (
    <div className="absolute left-0 top-0 z-10 flex h-full w-full items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 text-white/80 text-lg font-bold">
        <div>GAME OVER</div>
        <div>REVEALED {revealedPositions.length} TILES</div>
        <button
          onClick={handleReset}
          className="bg-transparent border-transparent px-4 py-2"
        >
          RESTART
        </button>
      </div>
    </div>
  );
}
