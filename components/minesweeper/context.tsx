import { createContext, useContext, useEffect, useState } from "react";

export type MinesweeperContextType = {
  cameraOffset: { x: number; y: number };
  setCameraOffset: (offset: { x: number; y: number }) => void;
  viewportSize: { width: number; height: number };
  setViewportSize: (size: { width: number; height: number }) => void;
  updateRevealed: number;
  setUpdateRevealed: React.Dispatch<React.SetStateAction<number>>;
  isGameOver: boolean;
  setIsGameOver: (value: boolean) => void;
};

const MinesweeperContext = createContext<MinesweeperContextType | null>(null);

export function MinesweeperProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [updateRevealed, setUpdateRevealed] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <MinesweeperContext.Provider
      value={{
        cameraOffset,
        setCameraOffset,
        viewportSize,
        setViewportSize,
        updateRevealed,
        setUpdateRevealed,
        isGameOver,
        setIsGameOver,
      }}
    >
      {children}
    </MinesweeperContext.Provider>
  );
}

export function useMinesweeperContext() {
  const context = useContext(MinesweeperContext);
  return context as MinesweeperContextType;
}
