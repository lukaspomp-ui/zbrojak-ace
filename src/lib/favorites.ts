import { useEffect, useState } from "react";

const KEY = "zbrojak:favorites";
const EVT = "zbrojak:favorites-change";

function read(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr)
      ? arr.filter((x): x is number => typeof x === "number")
      : [];
  } catch {
    return [];
  }
}

function write(ids: number[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(EVT));
  } catch {
    /* best-effort */
  }
}

export function getFavorites(): number[] {
  return read();
}

export function toggleFavorite(id: number): number[] {
  const cur = read();
  const next = cur.includes(id)
    ? cur.filter((x) => x !== id)
    : [...cur, id];
  write(next);
  return next;
}

/** Starred questions, kept in sync across components on the device. */
export function useFavorites(): {
  favorites: number[];
  isFavorite: (id: number) => boolean;
  toggle: (id: number) => void;
} {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    setIds(read());
    const sync = () => setIds(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    favorites: ids,
    isFavorite: (id) => ids.includes(id),
    toggle: (id) => {
      toggleFavorite(id);
      setIds(read());
    },
  };
}
