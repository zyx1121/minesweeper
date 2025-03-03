"use client";

import { useMinesweeperContext } from "@/components/minesweeper/context";
import { getRevealedPositionsInRange } from "@/lib/db";
import { countMines, getCurrentSeed } from "@/lib/mine";
import { useEffect, useRef, useState } from "react";

export function MinesweeperRender() {
  const { cameraOffset, viewportSize } = useMinesweeperContext();
  const { updateRevealed } = useMinesweeperContext();
  const [isInitialized, setIsInitialized] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [currentSeed, setCurrentSeed] = useState(0);
  const [spriteSheet, setSpriteSheet] = useState<HTMLImageElement | null>(null);
  const [revealedPositions, setRevealedPositions] = useState<{
    [key: string]: { x: number; y: number };
  }>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellSize = 16;
  const spriteSize = 16;

  const renderCanvas = (width: number, height: number) => {
    if (!canvasRef.current || !spriteSheet) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const startX = Math.floor(cameraOffset.x / cellSize);
    const startY = Math.floor(cameraOffset.y / cellSize);
    const tilesX = Math.ceil(width / cellSize) + 2;
    const tilesY = Math.ceil(height / cellSize) + 2;
    const endX = startX + tilesX;
    const endY = startY + tilesY;

    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const screenX = x * cellSize - cameraOffset.x;
        const screenY = y * cellSize - cameraOffset.y;
        const posKey = `${x},${y}`;

        if (revealedPositions[posKey]) {
          const mineCount = countMines(x, y);
          const spriteIndex = Math.min(mineCount, 9);

          ctx.drawImage(
            spriteSheet,
            spriteIndex * spriteSize,
            0,
            spriteSize,
            spriteSize,
            screenX,
            screenY,
            cellSize,
            cellSize
          );
        } else {
          ctx.drawImage(
            spriteSheet,
            11 * spriteSize,
            0,
            spriteSize,
            spriteSize,
            screenX,
            screenY,
            cellSize,
            cellSize
          );
        }
      }
    }
  };

  const fetchRevealedPositions = async () => {
    const startX = Math.floor(cameraOffset.x / cellSize);
    const startY = Math.floor(cameraOffset.y / cellSize);
    const tilesX =
      Math.ceil((viewportSize.width || window.innerWidth) / cellSize) + 2;
    const tilesY =
      Math.ceil((viewportSize.height || window.innerHeight) / cellSize) + 2;
    const endX = startX + tilesX;
    const endY = startY + tilesY;

    if (isNaN(startX) || isNaN(endX) || isNaN(startY) || isNaN(endY)) {
      console.error("Invalid range values:", { startX, endX, startY, endY });
      return;
    }

    const validStartX = Number.isFinite(startX) ? startX : 0;
    const validEndX = Number.isFinite(endX) ? endX : 0;
    const validStartY = Number.isFinite(startY) ? startY : 0;
    const validEndY = Number.isFinite(endY) ? endY : 0;

    try {
      const positions = await getRevealedPositionsInRange(
        validStartX,
        validEndX,
        validStartY,
        validEndY
      );
      const posMap: { [key: string]: { x: number; y: number } } = {};
      positions.forEach((pos) => {
        posMap[`${pos.x},${pos.y}`] = pos;
      });
      setRevealedPositions(posMap);
      setUpdateTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error fetching revealed positions:", error);
    }
  };

  useEffect(() => {
    const checkSeed = () => {
      const seed = getCurrentSeed();
      if (seed !== currentSeed) {
        setCurrentSeed(seed);
        setUpdateTrigger((prev) => prev + 1);
      }
    };
    checkSeed();
    const interval = setInterval(checkSeed, 1000);
    return () => clearInterval(interval);
  }, [currentSeed]);

  useEffect(() => {
    const img = new Image();
    img.src = "/minesweeper.png";
    img.onload = () => {
      setSpriteSheet(img);
      setUpdateTrigger((prev) => prev + 1);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const width = viewportSize.width || window.innerWidth;
    const height = viewportSize.height || window.innerHeight;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    if (!isInitialized && width > 0 && height > 0) {
      setIsInitialized(true);
    }
    renderCanvas(width, height);
  }, [viewportSize, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    fetchRevealedPositions();
  }, [cameraOffset, currentSeed, isInitialized, updateRevealed]);

  useEffect(() => {
    if (!isInitialized || !canvasRef.current) return;
    renderCanvas(canvasRef.current.width, canvasRef.current.height);
  }, [cameraOffset, isInitialized, updateTrigger, currentSeed]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full absolute top-0 left-0 z-1"
    />
  );
}
