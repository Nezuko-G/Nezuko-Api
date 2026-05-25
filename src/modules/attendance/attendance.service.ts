import { BadRequestError, ForbiddenError } from "@/shared/errors/errors.js";
import type { MarkAttendanceInput } from "@/shared/interfaces/attendance.interface.js";
import { attendanceRepository } from "./attendance.repository.js";

type Translator = (key: string, options?: Record<string, unknown>) => string;

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
function getDistanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000; // Earth's radius in meters
  const toRad = (x: number) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculate standard work hours from work day start and end times
 * e.g., "09:00" to "17:00" = 8 hours
 */
function calcStandardHours(workDayStart: string, workDayEnd: string): number {
  const [startH, startM] = workDayStart.split(":").map(Number);
  const [endH, endM] = workDayEnd.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return (endMinutes - startMinutes) / 60;
}

/**
 * Format date to YYYY-MM-DD string
 */
function getDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function buildOutsideGeofenceMessage(
  t: Translator,
  distance: number,
  maxDistance: number,
) {
  return t("attendance.outside_geofence", {
    distance: Math.round(distance),
    max: maxDistance,
  });
}

export const attendanceService = {
  async markAttendance(
    tenantId: string,
    userId: string,
    input: MarkAttendanceInput,
    t: Translator,
  ) {
    // Step 1: Get attendance settings
    const settings = await attendanceRepository.getAttendanceSettings(tenantId);

    if (!settings) {
      throw new ForbiddenError(t("attendance.feature_not_enabled"), "FEATURE_DISABLED");
    }

    // Step 2: Check if location attendance feature is enabled
    if (!settings.locationAttendanceEnabled) {
      throw new ForbiddenError(t("attendance.feature_not_enabled"), "FEATURE_DISABLED");
    }

    // Step 3: Check if location is required and provided
    if (
      settings.requireLocation &&
      (input.lat === undefined ||
        input.lat === null ||
        input.lng === undefined ||
        input.lng === null)
    ) {
      throw new BadRequestError(t("attendance.location_required"));
    }

    // Step 4: Validate geofence if enabled
    if (
      settings.geofenceEnabled &&
      input.lat !== undefined &&
      input.lat !== null &&
      input.lng !== undefined &&
      input.lng !== null &&
      settings.geofenceLat !== null &&
      settings.geofenceLat !== undefined &&
      settings.geofenceLng !== null &&
      settings.geofenceLng !== undefined &&
      settings.geofenceRadiusM !== null &&
      settings.geofenceRadiusM !== undefined
    ) {
      const distance = getDistanceInMeters(
        input.lat,
        input.lng,
        settings.geofenceLat,
        settings.geofenceLng,
      );

      if (distance > settings.geofenceRadiusM) {
        throw new ForbiddenError(
          buildOutsideGeofenceMessage(t, distance, settings.geofenceRadiusM),
          "OUTSIDE_GEOFENCE",
          { distance, maxDistance: settings.geofenceRadiusM },
        );
      }
    }

    // Step 5: Get today's date in YYYY-MM-DD format
    const today = getDateString(new Date());

    // Step 6: Check if timesheet exists for today
    const existingTimesheet = await attendanceRepository.getTodayTimesheet(
      tenantId,
      userId,
      today,
    );

    const now = new Date();

    // Case 1: No timesheet exists -> Create check-in record
    if (!existingTimesheet) {
      const timesheet = await attendanceRepository.createTimesheet(
        tenantId,
        userId,
        today,
        now,
      );

      return {
        action: "checked_in" as const,
        checkIn: timesheet.checkIn,
        message: t("attendance.check_in_success"),
      };
    }

    // Case 2: Check-in exists but no check-out -> Update with check-out
    if (existingTimesheet.checkIn && !existingTimesheet.checkOut) {
      const totalHours =
        (now.getTime() - existingTimesheet.checkIn.getTime()) /
        (1000 * 60 * 60);
      const standardHours = calcStandardHours(
        settings.workDayStart,
        settings.workDayEnd,
      );
      const overtimeHours = Math.max(0, totalHours - standardHours);

      const updated = await attendanceRepository.updateTimesheet(
        existingTimesheet.id,
        now,
        parseFloat(totalHours.toFixed(2)),
        parseFloat(overtimeHours.toFixed(2)),
      );

      return {
        action: "checked_out" as const,
        checkIn: updated.checkIn,
        checkOut: updated.checkOut,
        totalHours: updated.totalHours,
        overtimeHours: updated.overtimeHours,
        message: t("attendance.check_out_success"),
      };
    }

    // Case 3: Both check-in and check-out exist -> Error
    throw new BadRequestError(t("attendance.already_recorded"), "ALREADY_RECORDED");
  },

  async listTimesheets(tenantId: string, filter: any, t: Translator) {
    const timesheets = await attendanceRepository.listTimesheets(
      tenantId,
      filter,
    );
    return timesheets;
  },

  async listMyTimesheets(
    tenantId: string,
    userId: string,
    filter: any,
    t: Translator,
  ) {
    const timesheets = await attendanceRepository.listMyTimesheets(
      tenantId,
      userId,
      filter,
    );
    return timesheets;
  },
};
