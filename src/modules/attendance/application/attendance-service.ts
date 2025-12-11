import { API_ENDPOINTS } from "@/config/api";
import { apiClient } from "@/lib/api/api-client";
import type {
  Attendance,
  AttendanceListResponse,
  CreateAttendanceInput,
  UpdateAttendanceInput,
  CheckInInput,
  CheckOutInput,
  AttendanceReport,
} from "../domain/attendance-schema";

export class AttendanceService {
  async getAttendances(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    department?: string;
    search?: string;
  }): Promise<AttendanceListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.employeeId) queryParams.append("employeeId", params.employeeId);
    if (params?.department) queryParams.append("department", params.department);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.search) queryParams.append("search", params.search);

    const url = params
      ? `${API_ENDPOINTS.attendance.list}?${queryParams.toString()}`
      : API_ENDPOINTS.attendance.list;
    const response = await apiClient.get<AttendanceListResponse>(url);
    return response.data || { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  async getAttendance(id: string): Promise<Attendance> {
    const response = await apiClient.get<Attendance>(API_ENDPOINTS.attendance.get(id));
    if (!response.data) {
      throw new Error(response.message || "Failed to fetch attendance");
    }
    return response.data;
  }

  async checkIn(data: CheckInInput): Promise<Attendance> {
    const response = await apiClient.post<Attendance>(API_ENDPOINTS.attendance.checkIn, data);
    if (!response.data) {
      throw new Error(response.message || "Failed to check in");
    }
    return response.data;
  }

  async checkOut(id: string, data: CheckOutInput): Promise<Attendance> {
    const response = await apiClient.post<Attendance>(
      API_ENDPOINTS.attendance.checkOut(id),
      data,
    );
    if (!response.data) {
      throw new Error(response.message || "Failed to check out");
    }
    return response.data;
  }

  async createAttendance(data: CreateAttendanceInput): Promise<Attendance> {
    const response = await apiClient.post<Attendance>(API_ENDPOINTS.attendance.create, data);
    if (!response.data) {
      throw new Error(response.message || "Failed to create attendance");
    }
    return response.data;
  }

  async updateAttendance(id: string, data: UpdateAttendanceInput): Promise<Attendance> {
    const response = await apiClient.put<Attendance>(
      API_ENDPOINTS.attendance.update(id),
      data,
    );
    if (!response.data) {
      throw new Error(response.message || "Failed to update attendance");
    }
    return response.data;
  }

  async deleteAttendance(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.attendance.delete(id));
  }

  async getReports(params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AttendanceReport> {
    const queryParams = new URLSearchParams();
    if (params?.employeeId) queryParams.append("employeeId", params.employeeId);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const url = params
      ? `${API_ENDPOINTS.attendance.reports}?${queryParams.toString()}`
      : API_ENDPOINTS.attendance.reports;
    const response = await apiClient.get<AttendanceReport>(url);
    if (!response.data) {
      throw new Error(response.message || "Failed to fetch reports");
    }
    return response.data;
  }

  async getLateArrivals(date?: string): Promise<Attendance[]> {
    const queryParams = new URLSearchParams();
    if (date) queryParams.append("date", date);

    const url = date
      ? `${API_ENDPOINTS.attendance.lateArrivals}?${queryParams.toString()}`
      : API_ENDPOINTS.attendance.lateArrivals;
    const response = await apiClient.get<Attendance[]>(url);
    return response.data || [];
  }

  async getOvertime(date?: string): Promise<Attendance[]> {
    const queryParams = new URLSearchParams();
    if (date) queryParams.append("date", date);

    const url = date
      ? `${API_ENDPOINTS.attendance.overtime}?${queryParams.toString()}`
      : API_ENDPOINTS.attendance.overtime;
    const response = await apiClient.get<Attendance[]>(url);
    return response.data || [];
  }
}

export const attendanceService = new AttendanceService();

