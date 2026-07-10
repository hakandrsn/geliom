import { QueryClient } from "@tanstack/react-query";

// Provider ve socket katmanının paylaştığı tek QueryClient instance'ı.
export const queryClient = new QueryClient();
