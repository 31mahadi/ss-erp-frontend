import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { configService } from "../application/config-service";
import type { CreateDepartmentInput, UpdateDepartmentInput } from "../domain/department-schema";
import type { CreatePositionInput, UpdatePositionInput } from "../domain/position-schema";

// Department hooks
export function useDepartments(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["config", "departments", "list", params],
    queryFn: () => configService.getDepartments(params),
  });
}

export function useAllDepartments() {
  return useQuery({
    queryKey: ["config", "departments", "all"],
    queryFn: () => configService.getAllDepartments(),
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: ["config", "departments", id],
    queryFn: () => configService.getDepartment(id),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDepartmentInput) => configService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "departments"] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentInput }) =>
      configService.updateDepartment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["config", "departments"] });
      queryClient.invalidateQueries({ queryKey: ["config", "departments", variables.id] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => configService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "departments"] });
    },
  });
}

// Position hooks
export function usePositions(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["config", "positions", "list", params],
    queryFn: () => configService.getPositions(params),
  });
}

export function useAllPositions() {
  return useQuery({
    queryKey: ["config", "positions", "all"],
    queryFn: () => configService.getAllPositions(),
  });
}

export function usePosition(id: string) {
  return useQuery({
    queryKey: ["config", "positions", id],
    queryFn: () => configService.getPosition(id),
    enabled: !!id,
  });
}

export function useCreatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePositionInput) => configService.createPosition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "positions"] });
    },
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePositionInput }) =>
      configService.updatePosition(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["config", "positions"] });
      queryClient.invalidateQueries({ queryKey: ["config", "positions", variables.id] });
    },
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => configService.deletePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "positions"] });
    },
  });
}

