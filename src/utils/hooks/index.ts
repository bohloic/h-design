import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context';

export function useFetch(url: string) {
  const [data, setData] = useState<any>({});
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    async function fetchData() {
      try {
        const response = await fetch(url);
        const data = await response.json();
        setData(data);
      } catch (err) {
        console.log(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [url]);
  return { isLoading, data, error };
}

export function useTheme() {
  const { theme, toggleTheme } = useContext(ThemeContext) as any;
  return { theme, toggleTheme };
}
