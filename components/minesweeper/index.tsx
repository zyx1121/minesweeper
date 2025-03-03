"use client";

import { MinesweeperProvider } from "./context";
import { MinesweeperHandle } from "./handle";
import { MinesweeperOverlay } from "./overlay";
import { MinesweeperRender } from "./render";

export default function Minesweeper() {
  return (
    <MinesweeperProvider>
      <MinesweeperHandle>
        <MinesweeperRender />
        <MinesweeperOverlay />
      </MinesweeperHandle>
    </MinesweeperProvider>
  );
}
