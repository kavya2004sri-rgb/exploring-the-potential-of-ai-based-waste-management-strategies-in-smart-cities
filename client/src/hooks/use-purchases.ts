import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Purchase } from "@shared/routes";

type CreatePurchaseRequest = {
  listingId: number;
  quantity: number;
};

export function useMyPurchases() {
  return useQuery({
    queryKey: [api.purchases.myPurchases.path],
    queryFn: async () => {
      const res = await fetch(api.purchases.myPurchases.path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch purchases");
      return res.json();
    },
  });
}

export function useMySales() {
  return useQuery({
    queryKey: [api.purchases.mySales.path],
    queryFn: async () => {
      const res = await fetch(api.purchases.mySales.path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch sales");
      return res.json();
    },
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (purchase: CreatePurchaseRequest) => {
      const res = await fetch(api.purchases.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchase),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to create purchase request" }));
        throw new Error(error.message || "Failed to create purchase request");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate both buyer's purchases and seller's sales
      queryClient.invalidateQueries({ queryKey: [api.purchases.myPurchases.path] });
      queryClient.invalidateQueries({ queryKey: [api.purchases.mySales.path] });
    },
  });
}

export function useUpdatePurchaseStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "PENDING" | "ACCEPTED" | "REJECTED" }) => {
      const res = await fetch(api.purchases.updateStatus.path.replace(":id", String(id)), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update purchase status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.purchases.mySales.path] });
    },
  });
}
