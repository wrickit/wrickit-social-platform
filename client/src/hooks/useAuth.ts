import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
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

  const register = async (admissionNumber: string, password: string, name: string, email?: string) => {
    const response = await apiRequest("POST", "/api/register", {
      admissionNumber,
      password,
      name,
      email,
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
    register,
    logout,
  };
}
