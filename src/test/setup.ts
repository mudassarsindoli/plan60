import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

/**
 * happy-dom v20 exposes a placeholder `localStorage` (a plain object) unless a
 * `--localstorage-file` node flag is supplied. Stub a small in-memory Storage so
 * the app's persistence layer can be exercised under test.
 */
class MemoryStorage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? String(this.store.get(key)) : null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
});