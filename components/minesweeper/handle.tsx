"use client";

import { useMinesweeperContext } from "@/components/minesweeper/context";
import { saveRevealedPosition } from "@/lib/db";
import {
  countMines,
  generateSeed,
  getGameState,
  saveIsFirstClick,
} from "@/lib/mine";
import { useGesture } from "@use-gesture/react";
import React, { useCallback, useEffect, useRef } from "react";

const DOUBLE_CLICK_THRESHOLD = 300;
const LONG_PRESS_DURATION = 500;
const CELL_SIZE = 16;

type Tile = { x: number; y: number };

export function MinesweeperHandle({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const { cameraOffset, setCameraOffset, setIsGameOver } =
    useMinesweeperContext();
  const { setUpdateRevealed } = useMinesweeperContext();
  const cameraStartRef = useRef(cameraOffset);
  const lastTapRef = useRef<{ time: number; tile: Tile }>({
    time: 0,
    tile: { x: 0, y: 0 },
  });
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  async function revealTile(startX: number, startY: number) {
    const queue: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();

    while (queue.length) {
      const [x, y] = queue.shift()!;
      const posKey = `${x},${y}`;
      if (visited.has(posKey)) continue;
      visited.add(posKey);

      const count = countMines(x, y);
      if (count === 9) {
        setIsGameOver(true);
        return;
      }
      await saveRevealedPosition(x, y);
      setUpdateRevealed((prev) => prev + 1);

      if (count === 0) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const newKey = `${x + dx},${y + dy}`;
            if (!visited.has(newKey)) {
              queue.push([x + dx, y + dy]);
            }
          }
        }
      }
    }
  }

  const handleReveal = useCallback(
    async (x: number, y: number): Promise<void> => {
      const { isFirstClick } = getGameState();
      if (isFirstClick) {
        generateSeed(x, y);
        saveIsFirstClick(false);
      }
      await revealTile(x, y);
    },
    [revealTile]
  );

  const getTileFromClientCoords = useCallback(
    (clientX: number, clientY: number): Tile => ({
      x: Math.floor((clientX + cameraOffset.x) / CELL_SIZE),
      y: Math.floor((clientY + cameraOffset.y) / CELL_SIZE),
    }),
    [cameraOffset]
  );

  const bind = useGesture(
    {
      onDrag: ({
        down,
        movement: [mx, my],
        tap,
        xy,
        first,
      }: {
        down: boolean;
        movement: [number, number];
        tap: boolean;
        xy: [number, number];
        first: boolean;
      }) => {
        // 手勢開始時：記錄起始的相機位置，並啟動長按計時器
        if (first) {
          cameraStartRef.current = cameraOffset;
          if (longPressTimeoutRef.current)
            clearTimeout(longPressTimeoutRef.current);
          longPressTimeoutRef.current = setTimeout(() => {
            const tile = getTileFromClientCoords(xy[0], xy[1]);
            handleReveal(tile.x, tile.y);
            longPressTimeoutRef.current = null;
          }, LONG_PRESS_DURATION);
        }
        // 若拖曳距離超過一定範圍，則認定為拖曳，取消長按計時器並更新 cameraOffset
        if (down && (Math.abs(mx) > 5 || Math.abs(my) > 5)) {
          if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
          }
          setCameraOffset({
            x: cameraStartRef.current.x - mx,
            y: cameraStartRef.current.y - my,
          });
        }
        // 手勢結束時：取消長按計時器，並針對 tap 事件進行雙擊判斷
        if (!down) {
          if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
          }
          if (tap) {
            const tile = getTileFromClientCoords(xy[0], xy[1]);
            const currentTime = Date.now();
            if (
              currentTime - lastTapRef.current.time < DOUBLE_CLICK_THRESHOLD &&
              lastTapRef.current.tile.x === tile.x &&
              lastTapRef.current.tile.y === tile.y
            ) {
              // 雙擊則直接揭開格子
              handleReveal(tile.x, tile.y);
              lastTapRef.current = { time: 0, tile: { x: 0, y: 0 } };
            } else {
              lastTapRef.current = { time: currentTime, tile };
            }
          }
        }
      },
    },
    {
      // 設定 drag 選項，讓 tap 事件不被過濾掉
      drag: { filterTaps: false },
    }
  );

  useEffect(() => {
    const stored = localStorage.getItem("minesweeper-cameraOffset");
    if (stored) {
      setCameraOffset(JSON.parse(stored));
    }
  }, [setCameraOffset]);

  useEffect(() => {
    localStorage.setItem(
      "minesweeper-cameraOffset",
      JSON.stringify(cameraOffset)
    );
  }, [cameraOffset]);

  return (
    <div
      {...bind()}
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: "none" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}
