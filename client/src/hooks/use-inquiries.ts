import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertInquiry } from "@shared/routes";

export function useCreateInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertInquiry) => {
      const res = await fetch(api.inquiries.create.path, {
        method: api.inquiries.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to send inquiry");
      }
      return api.inquiries.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      // Could invalidate messages query if we had one
    },
  });
}
