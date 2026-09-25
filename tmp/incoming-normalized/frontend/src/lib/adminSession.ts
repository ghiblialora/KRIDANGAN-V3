import { useQuery } from "@tanstack/react-query";
import { apiGet, ApiError } from "@/lib/api";
import type { AdminMe } from "@/lib/types";

export const ADMIN_ME_KEY = ["admin", "me"] as const;

export function useAdminSession() {
  return useQuery({
    queryKey: ADMIN_ME_KEY,
    queryFn: () => apiGet<AdminMe>("/admin/me"),
    retry: (count, err) => !(err instanceof ApiError && err.status === 401) && count < 1,
    staleTime: 5 * 60 * 1000,
  });
}
