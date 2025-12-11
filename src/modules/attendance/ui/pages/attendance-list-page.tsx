"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  useAttendances,
  useCreateAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
  useCheckIn,
  useCheckOut,
  useTodayAttendances,
} from "../../hooks/use-attendance";
import { attendanceService } from "../../application/attendance-service";
import { useAllEmployees } from "@/modules/employees/hooks/use-employees";
import { useAllDepartments } from "@/modules/config/hooks/use-config";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAttendanceSchema,
  updateAttendanceSchema,
  checkInSchema,
  checkOutSchema,
  type CreateAttendanceInput,
  type UpdateAttendanceInput,
  type CheckInInput,
  type CheckOutInput,
  AttendanceStatus,
} from "../../domain/attendance-schema";
import { useToast } from "@/lib/hooks";
import { usePermission } from "@/lib/hooks/use-permission";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  X,
  Download,
  Users,
  TrendingUp,
  FileText,
} from "lucide-react";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { useDebounce } from "@/lib/hooks/use-debounce";
import * as React from "react";

const statusColors: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: "bg-green-500",
  [AttendanceStatus.ABSENT]: "bg-red-500",
  [AttendanceStatus.LATE]: "bg-yellow-500",
  [AttendanceStatus.HALF_DAY]: "bg-blue-500",
  [AttendanceStatus.ON_LEAVE]: "bg-purple-500",
};

const statusLabels: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: "Present",
  [AttendanceStatus.ABSENT]: "Absent",
  [AttendanceStatus.LATE]: "Late",
  [AttendanceStatus.HALF_DAY]: "Half Day",
  [AttendanceStatus.ON_LEAVE]: "On Leave",
};

// Utility function to format date as dd/mm/yyyy
const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Utility function to format time as AM/PM (12-hour format)
const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return '-';
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes || 0, seconds || 0);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export function AttendanceListPage() {
  // Initialize date filters with today's date
  const today = new Date().toISOString().split("T")[0];
  
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [employeeFilter, setEmployeeFilter] = React.useState<string>("");
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("");
  const [startDateFilter, setStartDateFilter] = React.useState<string>(today);
  const [endDateFilter, setEndDateFilter] = React.useState<string>(today);
  const [editingAttendanceId, setEditingAttendanceId] = React.useState<string | null>(null);
  const [deletingAttendanceId, setDeletingAttendanceId] = React.useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = React.useState(false);
  const [checkingOutId, setCheckingOutId] = React.useState<string | null>(null);
  const [bulkCheckOutIds, setBulkCheckOutIds] = React.useState<Set<string>>(new Set());
  const [accumulatedData, setAccumulatedData] = React.useState<any[]>([]);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  const canRead = usePermission("hr:attendance:attendance-list:read");
  const canCreate = usePermission("hr:attendance:attendance-management:create");
  const canUpdate = usePermission("hr:attendance:attendance-management:update");
  const canDelete = usePermission("hr:attendance:attendance-management:delete");
  const canCheckIn = usePermission("hr:attendance:check-in:create");
  const canCheckOut = usePermission("hr:attendance:check-out:create");

  const { data: attendancesData, isLoading } = useAttendances({
    page,
    limit: 20,
    employeeId: employeeFilter || undefined,
    department: departmentFilter || undefined,
    startDate: startDateFilter || undefined,
    endDate: endDateFilter || undefined,
    search: debouncedSearch || undefined,
  });

  // Reset accumulated data when filters change
  React.useEffect(() => {
    if (attendancesData?.data) {
      if (page === 1) {
        // First page - replace data
        setAccumulatedData(attendancesData.data);
      } else {
        // Subsequent pages - append data
        setAccumulatedData((prev) => [...prev, ...attendancesData.data]);
      }
      setHasMore(attendancesData.page < attendancesData.totalPages);
    }
  }, [attendancesData]);

  // Reset when filters change
  React.useEffect(() => {
    setPage(1);
    setAccumulatedData([]);
    setHasMore(true);
  }, [debouncedSearch, employeeFilter, departmentFilter, startDateFilter, endDateFilter]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore && attendancesData) {
      setIsLoadingMore(true);
      setPage((prev) => prev + 1);
      // Reset loading state after a short delay to allow query to complete
      setTimeout(() => setIsLoadingMore(false), 500);
    }
  };
  const { data: todayAttendances } = useTodayAttendances();
  const createAttendance = useCreateAttendance();
  const updateAttendance = useUpdateAttendance();
  const deleteAttendance = useDeleteAttendance();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const toast = useToast();

  const { data: allEmployees } = useAllEmployees();
  const { data: allDepartments } = useAllDepartments();

  // Create a map of employee IDs to today's check-in times
  const todayCheckInsMap = React.useMemo(() => {
    const map = new Map<string, { checkIn: string; id: string }>();
    if (todayAttendances?.data) {
      todayAttendances.data.forEach((attendance) => {
        if (attendance.checkIn && attendance.employeeId) {
          map.set(attendance.employeeId, {
            checkIn: attendance.checkIn,
            id: attendance.id,
          });
        }
      });
    }
    return map;
  }, [todayAttendances]);

  // Filter employees list for main filter (respect department filter)
  const filteredEmployeesForList = React.useMemo(() => {
    if (!allEmployees) return [];
    if (!departmentFilter) return allEmployees;
    return allEmployees.filter((emp) => emp.department === departmentFilter);
  }, [allEmployees, departmentFilter]);

  // Group employees by department for check-in modal
  const groupedEmployeesForCheckIn = React.useMemo(() => {
    if (!allEmployees) return [];
    
    // Filter by department if selected
    let employees = allEmployees;
    if (departmentFilter) {
      employees = employees.filter((emp) => emp.department === departmentFilter);
    }
    
    // Group by department
    const grouped = new Map<string, typeof employees>();
    employees.forEach((emp) => {
      const dept = emp.department || "No Department";
      if (!grouped.has(dept)) {
        grouped.set(dept, []);
      }
      grouped.get(dept)!.push(emp);
    });
    
    // Sort employees within each department by name
    grouped.forEach((emps) => {
      emps.sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    });
    
    // Sort departments alphabetically
    const sortedDepartments = Array.from(grouped.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    
    return sortedDepartments;
  }, [allEmployees, departmentFilter]);

  // Prepare employee options for filter combobox (grouped by department)
  const employeeFilterOptions: ComboboxOption[] = React.useMemo(() => {
    if (!allEmployees || !allDepartments) return [];
    const options: ComboboxOption[] = [];
    
    // Group employees by department
    const grouped = new Map<string, typeof allEmployees>();
    allEmployees.forEach((emp) => {
      const dept = emp.department || "No Department";
      if (!grouped.has(dept)) {
        grouped.set(dept, []);
      }
      grouped.get(dept)!.push(emp);
    });
    
    // Sort employees within each department
    grouped.forEach((emps) => {
      emps.sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    });
    
    // Sort departments alphabetically
    const sortedDepartments = Array.from(grouped.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    
    sortedDepartments.forEach(([departmentName, employees]) => {
      const dept = allDepartments.find(
        (d) => 
          d.name.toLowerCase().trim() === departmentName.toLowerCase().trim() ||
          d.code?.toLowerCase().trim() === departmentName.toLowerCase().trim()
      );
      
      const groupLabel = dept 
        ? (dept.code ? `${dept.name} (${dept.code})` : dept.name)
        : departmentName;
      
      employees.forEach((emp) => {
        options.push({
          value: emp.id,
          label: `${emp.firstName} ${emp.lastName} (${emp.employeeId})`,
          group: groupLabel,
        });
      });
    });
    
    return options;
  }, [allEmployees, allDepartments]);

  // Prepare department options for combobox (name (code) format)
  const departmentOptions: ComboboxOption[] = React.useMemo(() => {
    if (!allDepartments) return [];
    return allDepartments.map((dept) => ({
      value: dept.name,
      label: dept.code ? `${dept.name} (${dept.code})` : dept.name,
    }));
  }, [allDepartments]);

  // Prepare employee options for check-in combobox (with department grouping)
  const checkInEmployeeOptions: ComboboxOption[] = React.useMemo(() => {
    if (!allEmployees || !allDepartments) return [];
    const options: ComboboxOption[] = [];
    
    groupedEmployeesForCheckIn.forEach(([departmentName, employees]) => {
      // Find department by name or code to get the code
      const dept = allDepartments.find(
        (d) => 
          d.name.toLowerCase().trim() === departmentName.toLowerCase().trim() ||
          d.code.toLowerCase().trim() === departmentName.toLowerCase().trim()
      );
      
      // Format department group label as "Name (Code)" or just "Name" if no code
      const groupLabel = dept 
        ? (dept.code ? `${dept.name} (${dept.code})` : dept.name)
        : departmentName;
      
      employees.forEach((emp) => {
        const todayCheckIn = todayCheckInsMap.get(emp.id);
        options.push({
          value: emp.id,
          label: `${emp.firstName} ${emp.lastName} (${emp.employeeId})`,
          group: groupLabel,
          badge: todayCheckIn ? `Checked in at ${formatTime(todayCheckIn.checkIn)}` : undefined,
        });
      });
    });
    
    return options;
  }, [groupedEmployeesForCheckIn, todayCheckInsMap, allDepartments]);


  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    control: controlCreate,
    formState: { errors: errorsCreate },
  } = useForm<CreateAttendanceInput>({
    resolver: zodResolver(createAttendanceSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      breakDuration: 0,
      status: AttendanceStatus.PRESENT,
    },
  });

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    reset: resetUpdate,
    formState: { errors: errorsUpdate },
    setValue: setValueUpdate,
  } = useForm<UpdateAttendanceInput>({
    resolver: zodResolver(updateAttendanceSchema),
  });

  // Get current time in HH:mm format for max attribute (updates dynamically)
  const getCurrentTime = React.useCallback(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }, []);

  const {
    register: registerCheckIn,
    handleSubmit: handleSubmitCheckIn,
    reset: resetCheckIn,
    control: controlCheckIn,
    formState: { errors: errorsCheckIn },
  } = useForm<CheckInInput>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      date: today,
      checkInTime: getCurrentTime(),
    },
  });

  const {
    register: registerCheckOut,
    handleSubmit: handleSubmitCheckOut,
    reset: resetCheckOut,
    formState: { errors: errorsCheckOut },
  } = useForm<CheckOutInput>({
    resolver: zodResolver(checkOutSchema),
  });

  // Load attendance data for editing
  React.useEffect(() => {
    if (editingAttendanceId && attendancesData?.data) {
      const attendance = attendancesData.data.find((a) => a.id === editingAttendanceId);
      if (attendance) {
        setValueUpdate("checkIn", attendance.checkIn);
        setValueUpdate("checkOut", attendance.checkOut);
        setValueUpdate("breakDuration", attendance.breakDuration);
        setValueUpdate("status", attendance.status);
        setValueUpdate("notes", attendance.notes);
      }
    }
  }, [editingAttendanceId, attendancesData, setValueUpdate]);

  const onSubmitCreate = async (data: CreateAttendanceInput) => {
    try {
      await createAttendance.mutateAsync(data);
      resetCreate();
      setIsCreateDialogOpen(false);
      toast.success("Attendance created successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create attendance");
    }
  };

  const onSubmitUpdate = async (data: UpdateAttendanceInput) => {
    if (!editingAttendanceId) return;
    try {
      await updateAttendance.mutateAsync({ id: editingAttendanceId, data });
      setEditingAttendanceId(null);
      resetUpdate();
      toast.success("Attendance updated successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update attendance");
    }
  };

  const onSubmitCheckIn = async (data: CheckInInput) => {
    try {
      await checkIn.mutateAsync(data);
      resetCheckIn();
      setIsCheckInDialogOpen(false);
      toast.success("Checked in successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to check in");
    }
  };

  const onSubmitCheckOut = async (data: CheckOutInput) => {
    if (!checkingOutId) return;
    try {
      await checkOut.mutateAsync({ id: checkingOutId, data });
      setCheckingOutId(null);
      resetCheckOut();
      toast.success("Checked out successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to check out");
    }
  };

  const handleDelete = async () => {
    if (!deletingAttendanceId) return;
    try {
      await deleteAttendance.mutateAsync(deletingAttendanceId);
      setDeletingAttendanceId(null);
      toast.success("Attendance deleted successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete attendance");
    }
  };

  // Calculate summary statistics for today
  const todayStats = React.useMemo(() => {
    if (!todayAttendances?.data) {
      return { checkedIn: 0, pendingCheckOut: 0, lateArrivals: 0, totalHours: 0 };
    }
    const checkedIn = todayAttendances.data.filter((a) => a.checkIn).length;
    const pendingCheckOut = todayAttendances.data.filter((a) => a.checkIn && !a.checkOut).length;
    const lateArrivals = todayAttendances.data.filter((a) => a.isLate).length;
    const totalHours = todayAttendances.data.reduce((sum, a) => {
      const hours = a.totalHours != null ? Number(a.totalHours) : 0;
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0);
    return { 
      checkedIn, 
      pendingCheckOut, 
      lateArrivals, 
      totalHours: isNaN(totalHours) ? 0 : Math.round(totalHours * 100) / 100 
    };
  }, [todayAttendances]);

  // Filter presets
  const applyFilterPreset = (preset: "today" | "week" | "month") => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);
    end.setHours(23, 59, 59, 999);

    switch (preset) {
      case "today":
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case "week":
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case "month":
        start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    setStartDateFilter(start.toISOString().split("T")[0]);
    setEndDateFilter(end.toISOString().split("T")[0]);
    setPage(1);
  };

  // Export to CSV - Fetch all data with current filters
  const handleExportCSV = async () => {
    try {
      setIsLoadingMore(true);
      // Fetch all data with current filters using pagination
      const allData: any[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const limit = 100; // Use larger limit for export

      while (hasMorePages) {
        const response = await attendanceService.getAttendances({
          page: currentPage,
          limit,
          employeeId: employeeFilter || undefined,
          department: departmentFilter || undefined,
          startDate: startDateFilter || undefined,
          endDate: endDateFilter || undefined,
          search: debouncedSearch || undefined,
        });

        if (response.data && response.data.length > 0) {
          allData.push(...response.data);
          hasMorePages = currentPage < response.totalPages;
          currentPage++;
        } else {
          hasMorePages = false;
        }
      }

      if (allData.length === 0) {
        toast.error("No data to export");
        setIsLoadingMore(false);
        return;
      }

      const headers = ["Date", "Employee", "Employee ID", "Department", "Check-in", "Check-out", "Hours", "Status", "Late", "Overtime"];
      const rows = allData.map((attendance) => [
        formatDate(attendance.date),
        attendance.employee ? `${attendance.employee.firstName} ${attendance.employee.lastName}` : "",
        attendance.employee?.employeeId || "",
        attendance.employee?.department || "",
        formatTime(attendance.checkIn),
        formatTime(attendance.checkOut),
        attendance.totalHours?.toFixed(2) || "",
        attendance.status,
        attendance.isLate ? "Yes" : "No",
        attendance.isOvertime ? attendance.overtimeHours?.toFixed(2) : "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const todayFormatted = formatDate(new Date()).replace(/\//g, '-');
      a.download = `attendance-${todayFormatted}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Exported ${allData.length} attendance records successfully`);
      setIsLoadingMore(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to export attendance data");
      setIsLoadingMore(false);
    }
  };

  // Bulk check-out handler
  const handleBulkCheckOut = async () => {
    if (bulkCheckOutIds.size === 0) return;
    try {
      const checkOutPromises = Array.from(bulkCheckOutIds).map((id) =>
        checkOut.mutateAsync({
          id,
          data: { checkOutTime: getCurrentTime() },
        })
      );
      await Promise.all(checkOutPromises);
      setBulkCheckOutIds(new Set());
      toast.success(`Successfully checked out ${bulkCheckOutIds.size} employee(s)`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to bulk check out");
    }
  };

  // Auto-calculate hours when updating check-in/out times
  const handleUpdateTimeChange = React.useCallback(() => {
    const checkIn = (document.getElementById("edit-checkIn") as HTMLInputElement)?.value;
    const checkOut = (document.getElementById("edit-checkOut") as HTMLInputElement)?.value;
    const breakDuration = Number((document.getElementById("edit-breakDuration") as HTMLInputElement)?.value || 0);

    if (checkIn && checkOut) {
      const checkInTime = new Date(`1970-01-01T${checkIn}`);
      const checkOutTime = new Date(`1970-01-01T${checkOut}`);
      const totalMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60) - breakDuration;
      const totalHours = Math.max(0, totalMinutes / 60);
      
      // Update the form value (visual feedback could be shown here)
      if (totalHours > 0) {
        // You could show this in a read-only field or tooltip
      }
    }
  }, []);

  if (!canRead) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You don't have permission to view attendance.</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Attendance Management"
        description="Track and manage employee attendance records"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.checkedIn}</div>
            <p className="text-xs text-muted-foreground">Employees checked in</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Check-out</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.pendingCheckOut}</div>
            <p className="text-xs text-muted-foreground">Awaiting check-out</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.lateArrivals}</div>
            <p className="text-xs text-muted-foreground">Late check-ins today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isNaN(todayStats.totalHours) || todayStats.totalHours === null ? 0 : todayStats.totalHours}h
            </div>
            <p className="text-xs text-muted-foreground">Hours worked today</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Row - Above Attendance Records Table */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Filter Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Quick Filters:</span>
              <Button
                variant={startDateFilter === today && endDateFilter === today ? "default" : "outline"}
                size="sm"
                onClick={() => applyFilterPreset("today")}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyFilterPreset("week")}
              >
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyFilterPreset("month")}
              >
                This Month
              </Button>
            </div>
            
            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="space-y-2">
                <Label htmlFor="employee-filter" className="text-sm">Employee</Label>
                <Combobox
                  options={employeeFilterOptions}
                  value={employeeFilter}
                  onChange={(value) => {
                    setEmployeeFilter(value);
                    setPage(1);
                  }}
                  placeholder="All Employees"
                  searchPlaceholder="Search employee..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department-filter" className="text-sm">Department</Label>
                <Combobox
                  options={departmentOptions}
                  value={departmentFilter}
                  onChange={(value) => {
                    setDepartmentFilter(value);
                    // Clear employee filter if it doesn't match the new department
                    if (value && employeeFilter) {
                      const selectedEmployee = allEmployees?.find((emp) => emp.id === employeeFilter);
                      if (selectedEmployee?.department !== value) {
                        setEmployeeFilter("");
                      }
                    }
                    setPage(1);
                  }}
                  placeholder="All Departments"
                  searchPlaceholder="Search department..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-date-filter" className="text-sm">Start Date</Label>
                <Input
                  id="start-date-filter"
                  type="date"
                  value={startDateFilter}
                  max={today}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Validate: cannot be greater than today or end date
                    if (value > today) {
                      return;
                    }
                    if (endDateFilter && value > endDateFilter) {
                      return;
                    }
                    setStartDateFilter(value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date-filter" className="text-sm">End Date</Label>
                <Input
                  id="end-date-filter"
                  type="date"
                  value={endDateFilter}
                  max={today}
                  min={startDateFilter}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Validate: cannot be greater than today
                    if (value > today) {
                      return;
                    }
                    setEndDateFilter(value);
                    // Adjust start date if it's greater than end date
                    if (startDateFilter && startDateFilter > value) {
                      setStartDateFilter(value);
                    }
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-2 flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmployeeFilter("");
                    setDepartmentFilter("");
                    setStartDateFilter(today);
                    setEndDateFilter(today);
                    setPage(1);
                  }}
                  disabled={!employeeFilter && !departmentFilter && startDateFilter === today && endDateFilter === today}
                  className="text-xs w-auto"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">Attendance Records</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                View and manage attendance records
              </p>
            </div>
            <div className="flex gap-2">
              {canCheckIn && (
                <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Check In
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Check In</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitCheckIn(onSubmitCheckIn)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="checkIn-employeeId">Employee *</Label>
                        <Controller
                          name="employeeId"
                          control={controlCheckIn}
                          render={({ field }) => (
                            <div className="space-y-2">
                              <Combobox
                                options={checkInEmployeeOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select employee"
                                searchPlaceholder="Search employee..."
                              />
                              {field.value && todayCheckInsMap.has(field.value) && (
                                <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                                      Already checked in today
                                    </p>
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                      Check-in time: {formatTime(todayCheckInsMap.get(field.value)?.checkIn)}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700">
                                    Checked In
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                        />
                        {errorsCheckIn.employeeId && (
                          <p className="text-xs text-destructive">{errorsCheckIn.employeeId.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkIn-time">Check-in Time</Label>
                        <Input
                          id="checkIn-time"
                          type="time"
                          max={getCurrentTime()}
                          {...registerCheckIn("checkInTime", {
                            validate: (value) => {
                              if (!value) return true; // Optional
                              const now = new Date();
                              const [hours, minutes] = value.split(":").map(Number);
                              const checkInTime = new Date();
                              checkInTime.setHours(hours, minutes, 0, 0);
                              if (checkInTime > now) {
                                return "Check-in time cannot be in the future";
                              }
                              return true;
                            },
                          })}
                          defaultValue={getCurrentTime()}
                        />
                        {errorsCheckIn.checkInTime && (
                          <p className="text-xs text-destructive">{errorsCheckIn.checkInTime.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkIn-notes">Notes</Label>
                        <Textarea id="checkIn-notes" rows={3} {...registerCheckIn("notes")} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCheckInDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={checkIn.isPending}>
                          {checkIn.isPending ? "Checking in..." : "Check In"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
              {canCreate && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      New Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Attendance Record</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="create-employeeId">Employee *</Label>
                          <Controller
                            name="employeeId"
                            control={controlCreate}
                            render={({ field }) => (
                              <select
                                id="create-employeeId"
                                {...field}
                                className="w-full p-2 border rounded-md bg-background"
                              >
                                <option value="">Select employee</option>
                                {allEmployees?.map((emp) => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                                  </option>
                                ))}
                              </select>
                            )}
                          />
                          {errorsCreate.employeeId && (
                            <p className="text-xs text-destructive">{errorsCreate.employeeId.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-date">Date *</Label>
                          <Input id="create-date" type="date" {...registerCreate("date")} />
                          {errorsCreate.date && (
                            <p className="text-xs text-destructive">{errorsCreate.date.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="create-checkIn">Check-in Time</Label>
                          <Input id="create-checkIn" type="time" {...registerCreate("checkIn")} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-checkOut">Check-out Time</Label>
                          <Input id="create-checkOut" type="time" {...registerCreate("checkOut")} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="create-breakDuration">Break Duration (minutes)</Label>
                          <Input
                            id="create-breakDuration"
                            type="number"
                            {...registerCreate("breakDuration", { valueAsNumber: true })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-status">Status</Label>
                          <select
                            id="create-status"
                            {...registerCreate("status")}
                            className="w-full p-2 border rounded-md bg-background"
                          >
                            {Object.values(AttendanceStatus).map((status) => (
                              <option key={status} value={status}>
                                {statusLabels[status]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-notes">Notes</Label>
                        <Textarea id="create-notes" rows={3} {...registerCreate("notes")} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createAttendance.isPending}>
                          {createAttendance.isPending ? "Creating..." : "Create"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
              {canCheckOut && bulkCheckOutIds.size > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBulkCheckOut}
                  disabled={checkOut.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Check Out ({bulkCheckOutIds.size})
                </Button>
              )}
              {accumulatedData && accumulatedData.length > 0 && (
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV ({accumulatedData.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name, ID, or department..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                className="pl-10 pr-10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {debouncedSearch && (
              <p className="text-xs text-muted-foreground mt-2">
                Searching for: <span className="font-medium">{debouncedSearch}</span>
              </p>
            )}
          </div>

          {isLoading && page === 1 ? (
            <SkeletonTable rows={5} columns={8} />
          ) : accumulatedData && accumulatedData.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accumulatedData.map((attendance) => (
                      <TableRow key={attendance.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(attendance.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {attendance.employee ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {attendance.employee.firstName} {attendance.employee.lastName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {attendance.employee.employeeId}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {attendance.employee?.department ? (() => {
                            // Try to find department by name first, then by code (case-insensitive)
                            const dept = allDepartments?.find(
                              (d) => {
                                const empDept = attendance.employee?.department?.toLowerCase().trim();
                                return (
                                  d.name.toLowerCase().trim() === empDept || 
                                  d.code.toLowerCase().trim() === empDept
                                );
                              }
                            );
                            if (dept) {
                              return (
                                <div>
                                  <div className="font-medium">
                                    {dept.name}
                                  </div>
                                  {dept.code && (
                                    <div className="text-xs text-muted-foreground">
                                      ({dept.code})
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            // Fallback: show what's stored if department not found
                            return (
                              <div>
                                <div className="font-medium">
                                  {attendance.employee.department}
                                </div>
                              </div>
                            );
                          })() : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {attendance.checkIn ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-green-500" />
                              <span>{formatTime(attendance.checkIn)}</span>
                              {attendance.isLate && attendance.lateMinutes != null && (
                                <Badge variant="destructive" className="text-xs">
                                  Late ({Number(attendance.lateMinutes).toFixed(0)}m)
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {attendance.checkOut ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-500" />
                              <span>{formatTime(attendance.checkOut)}</span>
                              {attendance.isOvertime && attendance.overtimeHours != null && (
                                <Badge variant="default" className="text-xs">
                                  OT ({Number(attendance.overtimeHours).toFixed(1)}h)
                                </Badge>
                              )}
                            </div>
                          ) : attendance.checkIn ? (
                            canCheckOut ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCheckingOutId(attendance.id)}
                              >
                                Check Out
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">Pending</span>
                            )
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {attendance.totalHours != null ? (
                            <span>{Number(attendance.totalHours).toFixed(2)}h</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={statusColors[attendance.status as AttendanceStatus] || "bg-gray-500"}
                          >
                            {statusLabels[attendance.status as AttendanceStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingAttendanceId(attendance.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingAttendanceId(attendance.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {accumulatedData.map((attendance) => (
                  <Card key={attendance.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold">
                              {attendance.employee
                                ? `${attendance.employee.firstName} ${attendance.employee.lastName}`
                                : "Unknown"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {attendance.employee?.employeeId}
                            </div>
                          </div>
                          <Badge className={statusColors[attendance.status as AttendanceStatus] || "bg-gray-500"}>
                            {statusLabels[attendance.status as AttendanceStatus]}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Date:</span>{" "}
                            {formatDate(attendance.date)}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Department:</span>{" "}
                            {attendance.employee?.department || "-"}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Check-in:</span>{" "}
                            {formatTime(attendance.checkIn)}
                            {attendance.isLate && attendance.lateMinutes != null && (
                              <Badge variant="destructive" className="ml-1 text-xs">
                                Late ({Number(attendance.lateMinutes).toFixed(0)}m)
                              </Badge>
                            )}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Check-out:</span>{" "}
                            {attendance.checkOut ? formatTime(attendance.checkOut) : (attendance.checkIn ? (
                              canCheckOut ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCheckingOutId(attendance.id)}
                                  className="ml-1"
                                >
                                  Check Out
                                </Button>
                              ) : (
                                "Pending"
                              )
                            ) : "-")}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Hours:</span>{" "}
                            {attendance.totalHours != null
                              ? `${Number(attendance.totalHours).toFixed(2)}h`
                              : "-"}
                          </div>
                          {attendance.isOvertime && attendance.overtimeHours != null && (
                            <div>
                              <Badge variant="default" className="text-xs">
                                OT: {Number(attendance.overtimeHours).toFixed(1)}h
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          {canUpdate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingAttendanceId(attendance.id)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingAttendanceId(attendance.id)}
                              className="flex-1"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Load More Pagination */}
              {attendancesData && (
                <div className="flex flex-col items-center justify-center mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-4">
                    Showing {accumulatedData.length} of {attendancesData.total} records
                  </div>
                  {hasMore && (
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore || isLoading}
                      className="min-w-[120px]"
                    >
                      {isLoadingMore || isLoading ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More
                          <TrendingUp className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                  {!hasMore && accumulatedData.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      All records loaded
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No attendance records found</p>
              {canCreate && (
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Record
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingAttendanceId && (
        <Dialog open={!!editingAttendanceId} onOpenChange={() => setEditingAttendanceId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Attendance</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitUpdate(onSubmitUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-checkIn">Check-in Time</Label>
                  <Input
                    id="edit-checkIn"
                    type="time"
                    {...registerUpdate("checkIn", {
                      onChange: handleUpdateTimeChange,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-checkOut">Check-out Time</Label>
                  <Input
                    id="edit-checkOut"
                    type="time"
                    {...registerUpdate("checkOut", {
                      onChange: handleUpdateTimeChange,
                      validate: (value, formValues) => {
                        const checkIn = formValues.checkIn || (document.getElementById("edit-checkIn") as HTMLInputElement)?.value;
                        if (value && checkIn && value <= checkIn) {
                          return "Check-out time must be after check-in time";
                        }
                        return true;
                      },
                    })}
                  />
                  {errorsUpdate.checkOut && (
                    <p className="text-xs text-destructive">{errorsUpdate.checkOut.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-breakDuration">Break Duration (minutes)</Label>
                  <Input
                    id="edit-breakDuration"
                    type="number"
                    {...registerUpdate("breakDuration", {
                      valueAsNumber: true,
                      onChange: handleUpdateTimeChange,
                      validate: (value, formValues) => {
                        const checkIn = formValues.checkIn || (document.getElementById("edit-checkIn") as HTMLInputElement)?.value;
                        const checkOut = formValues.checkOut || (document.getElementById("edit-checkOut") as HTMLInputElement)?.value;
                        if (checkIn && checkOut && value) {
                          const checkInTime = new Date(`1970-01-01T${checkIn}`);
                          const checkOutTime = new Date(`1970-01-01T${checkOut}`);
                          const totalMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60);
                          if (value >= totalMinutes) {
                            return "Break duration cannot exceed total hours worked";
                          }
                        }
                        return true;
                      },
                    })}
                  />
                  {errorsUpdate.breakDuration && (
                    <p className="text-xs text-destructive">{errorsUpdate.breakDuration.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <select
                    id="edit-status"
                    {...registerUpdate("status")}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    {Object.values(AttendanceStatus).map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea id="edit-notes" rows={3} {...registerUpdate("notes")} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingAttendanceId(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateAttendance.isPending}>
                  {updateAttendance.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Check Out Dialog */}
      {checkingOutId && (
        <Dialog open={!!checkingOutId} onOpenChange={() => setCheckingOutId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Check Out</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitCheckOut(onSubmitCheckOut)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="checkOut-time">Check-out Time</Label>
                <Input
                  id="checkOut-time"
                  type="time"
                  {...registerCheckOut("checkOutTime")}
                  defaultValue={new Date().toTimeString().slice(0, 5)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut-breakDuration">Break Duration (minutes)</Label>
                <Input
                  id="checkOut-breakDuration"
                  type="number"
                  {...registerCheckOut("breakDuration", { valueAsNumber: true })}
                  defaultValue={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut-notes">Notes</Label>
                <Textarea id="checkOut-notes" rows={3} {...registerCheckOut("notes")} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCheckingOutId(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={checkOut.isPending}>
                  {checkOut.isPending ? "Checking out..." : "Check Out"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {deletingAttendanceId && (
        <ConfirmDialog
          open={!!deletingAttendanceId}
          onOpenChange={() => setDeletingAttendanceId(null)}
          onConfirm={handleDelete}
          title="Delete Attendance"
          description="Are you sure you want to delete this attendance record? This action cannot be undone."
          confirmText="Delete"
          variant="destructive"
        />
      )}
    </PageContainer>
  );
}

