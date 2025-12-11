import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceService } from "../application/attendance-service";
import type {
  CreateAttendanceInput,
  UpdateAttendanceInput,
  CheckInInput,
  CheckOutInput,
} from "../domain/attendance-schema";

export function useAttendances(params?: {
  page?: number;
  limit?: number;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  department?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["attendances", "list", params],
    queryFn: () => attendanceService.getAttendances(params),
  });
}

export function useAttendance(id: string) {
  return useQuery({
    queryKey: ["attendances", id],
    queryFn: () => attendanceService.getAttendance(id),
    enabled: !!id,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CheckInInput) => attendanceService.checkIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CheckOutInput }) =>
      attendanceService.checkOut(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAttendanceInput) => attendanceService.createAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAttendanceInput }) =>
      attendanceService.updateAttendance(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      queryClient.invalidateQueries({ queryKey: ["attendances", variables.id] });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attendanceService.deleteAttendance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
  });
}

export function useAttendanceReports(params?: {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["attendances", "reports", params],
    queryFn: () => attendanceService.getReports(params),
  });
}

export function useLateArrivals(date?: string) {
  return useQuery({
    queryKey: ["attendances", "late-arrivals", date],
    queryFn: () => attendanceService.getLateArrivals(date),
  });
}

export function useOvertime(date?: string) {
  return useQuery({
    queryKey: ["attendances", "overtime", date],
    queryFn: () => attendanceService.getOvertime(date),
  });
}

export function useTodayAttendances() {
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["attendances", "today", today],
    queryFn: async () => {
      // Fetch all today's attendances by using max limit (100)
      // For most companies, 100 employees per day should be sufficient
      // If more is needed, we can implement pagination
      const result = await attendanceService.getAttendances({ 
        startDate: today, 
        endDate: today, 
        limit: 100,
        page: 1,
      });
      return result;
    },
  });
}

