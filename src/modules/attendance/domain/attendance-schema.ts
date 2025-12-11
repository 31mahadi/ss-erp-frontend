import { z } from "zod";

export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  LATE = "late",
  HALF_DAY = "half_day",
  ON_LEAVE = "on_leave",
}

export const createAttendanceSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  date: z.string().min(1, "Date is required"),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  breakDuration: z.number().min(0).max(480).optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  notes: z.string().optional(),
});

export const updateAttendanceSchema = z.object({
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  breakDuration: z.number().min(0).max(480).optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  notes: z.string().optional(),
});

export const checkInSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  date: z.string().optional(), // Optional date field for check-in
  checkInTime: z.string().optional().refine(
    (time) => {
      if (!time) return true; // Optional, so empty is valid
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const [hours, minutes] = time.split(":").map(Number);
      const checkInDateTime = new Date(`${today}T${time}:00`);
      return checkInDateTime <= now;
    },
    {
      message: "Check-in time cannot be in the future",
    }
  ),
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  checkOutTime: z.string().optional(),
  breakDuration: z.number().min(0).max(480).optional(),
  notes: z.string().optional(),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  breakDuration: number;
  totalHours?: number;
  status: AttendanceStatus;
  notes?: string;
  isLate: boolean;
  lateMinutes?: number;
  isOvertime: boolean;
  overtimeHours?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  };
}

export interface AttendanceListResponse {
  data: Attendance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AttendanceReport {
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    totalHours: number;
    totalOvertimeHours: number;
  };
  attendances: Attendance[];
}

