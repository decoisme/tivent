import { useState, useEffect } from 'react';
import { getPOLRate } from '@/lib/currency';

/**
 * Hook to get live POL/IDR exchange rate
 * Updates every minute
 */
export function useLivePrice() {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout;

    const fetchRate = async () => {
      try {
        setLoading(true);
        setError(null);
        const newRate = await getPOLRate();
        
        if (mounted) {
          setRate(newRate);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to fetch price');
          setLoading(false);
          // Use fallback rate
          setRate(5000);
        }
      }
    };

    // Fetch immediately
    fetchRate();

    // Update every 60 seconds
    interval = setInterval(fetchRate, 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { rate, loading, error };
}
