import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export interface SystemMetrics {
  totalListings: number;
  totalUsers: number;
  totalBuyers: number;
  totalSellers: number;
  successfulPurchases: number;
  pendingPurchases: number;
  totalRevenue: number;
}

export function useMetrics() {
  const { toast } = useToast();

  const query = useQuery<SystemMetrics, Error>({
    queryKey: ["metrics"],
    queryFn: async (): Promise<SystemMetrics> => {
      const response = await fetch("/api/metrics", {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch metrics");
      }

      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Handle errors with useEffect
  useEffect(() => {
    if (query.error) {
      toast({
        title: "Error",
        description: query.error.message,
        variant: "destructive",
      });
    }
  }, [query.error, toast]);

  return query;
}
