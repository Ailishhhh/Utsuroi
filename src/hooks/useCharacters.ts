/**
 * useCharacters — loads the character catalog and exposes loading/error/data state.
 *
 * Thin wrapper over services/characters.ts so screens stay declarative: they read
 * { characters, isLoading, error } and can call reload() to retry after a failure.
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchCharacters } from '@/services/characters';
import type { Character } from '@/types/character';

export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await fetchCharacters();
    setCharacters(result.data);
    setError(result.error);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { characters, isLoading, error, reload: load };
}
