import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeeService } from "../application/employee-service";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "../domain/employee-schema";

export function useEmployees(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["employees", "list", params],
    queryFn: () => employeeService.getEmployees(params),
  });
}

export function useAllEmployees() {
  return useQuery({
    queryKey: ["employees", "all"],
    queryFn: () => employeeService.getAllEmployees(),
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employees", id],
    queryFn: () => employeeService.getEmployee(id),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmployeeInput) => employeeService.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeInput }) =>
      employeeService.updateEmployee(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees", variables.id] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

