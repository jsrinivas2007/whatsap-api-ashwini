import { useState, useEffect } from 'react';

export interface PlanLimitData {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired' | 'none';
  allowed: boolean;
  plan: string;
  limits: Record<string, number>;
  features: Record<string, boolean>;
  usage: Record<string, number>;
}

export function usePlan() {
  const [data, setData] = useState<PlanLimitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch('http://localhost:3001/api/billing/subscription-status');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error('Failed to fetch plan data', e);
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, []);

  const isFeatureAllowed = (featureKey: string, amount: number = 1): boolean => {
    if (!data) return true; // Fail open if data isn't loaded yet to prevent flickering
    if (!data.allowed) return false;

    // Check boolean features
    if (data.features.hasOwnProperty(featureKey)) {
      return data.features[featureKey];
    }

    // Check limits
    if (data.limits.hasOwnProperty(featureKey)) {
      const limit = data.limits[featureKey];
      if (limit === -1) return true; // unlimited
      const current = data.usage[featureKey] || 0;
      return (current + amount) <= limit;
    }

    return true; // Default allow if unknown
  };

  const remaining = (featureKey: string): number | 'unlimited' => {
    if (!data || !data.limits.hasOwnProperty(featureKey)) return 'unlimited';
    const limit = data.limits[featureKey];
    if (limit === -1) return 'unlimited';
    const current = data.usage[featureKey] || 0;
    return Math.max(0, limit - current);
  };

  return { plan: data, loading, isFeatureAllowed, remaining };
}
