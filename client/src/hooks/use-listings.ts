import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertListing } from "@shared/routes";

export function useListings(filters?: { 
  category?: string; 
  search?: string; 
  minPrice?: number; 
  maxPrice?: number; 
  minQuantity?: number; 
  maxQuantity?: number; 
  userId?: number; // Optional filter for user-specific listings
}) {
  return useQuery({
    queryKey: [api.listings.list.path, filters],
    queryFn: async () => {
      let url = api.listings.list.path;
      if (filters) {
        const params = new URLSearchParams();
        if (filters.category) params.append("category", filters.category);
        if (filters.search) params.append("search", filters.search);
        if (filters.minPrice !== undefined) params.append("minPrice", filters.minPrice.toString());
        if (filters.maxPrice !== undefined) params.append("maxPrice", filters.maxPrice.toString());
        if (filters.minQuantity !== undefined) params.append("minQuantity", filters.minQuantity.toString());
        if (filters.maxQuantity !== undefined) params.append("maxQuantity", filters.maxQuantity.toString());
        if (filters.userId !== undefined) params.append("userId", filters.userId.toString());
        if (params.toString()) url += `?${params.toString()}`;
      }
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch listings");
      return api.listings.list.responses[200].parse(await res.json());
    },
  });
}

export function useListing(id: number) {
  return useQuery({
    queryKey: [api.listings.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.listings.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch listing");
      return api.listings.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertListing) => {
      // Ensure quantity and price are strings for decimal type if needed, or numbers if schema allows
      // Schema expects decimal which usually transfers as string in JSON for precision, but Zod might handle coerce.
      // Based on schema `insertListingSchema`, inputs should be valid.
      
      const res = await fetch(api.listings.create.path, {
        method: api.listings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create listing");
      }
      return api.listings.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.listings.list.path] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.listings.delete.path, { id });
      const res = await fetch(url, {
        method: api.listings.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete listing");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.listings.list.path] });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertListing> }) => {
      const url = buildUrl(api.listings.update.path, { id });
      const res = await fetch(url, {
        method: api.listings.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update listing");
      }
      return api.listings.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.listings.list.path] });
    },
  });
}
