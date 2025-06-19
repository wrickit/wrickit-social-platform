import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const login = async (admissionNumber: string, password: string) => {
    const response = await apiRequest("POST", "/api/login", {
      admissionNumber,
      password,
    });
    const data = await response.json();
    queryClient.setQueryData(["/api/user"], data.user);
    return data.user;
  };



  const logout = async () => {
    await apiRequest("POST", "/api/logout");
    queryClient.setQueryData(["/api/user"], null);
    queryClient.clear();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
