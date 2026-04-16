import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useIdentifyWaste() {
  return useMutation({
    mutationFn: async (imageBase64: string) => {
      const res = await fetch(api.ai.identify.path, {
        method: api.ai.identify.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64 }),
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to identify waste");
      }
      return api.ai.identify.responses[200].parse(await res.json());
    },
  });
}
