export type UpdateCompanyInfoInput = {
  name?: string;
  slug?: string;
  industry?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  taxNumber?: string | null;
  commercialReg?: string | null;
  currency?: string | null;
  timezone?: string | null;
};

export type UpdateCompanySettingsInput = {
  language?: "ar" | "en";
  dateFormat?: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  fiscalYearStart?: number;
};

export type UpdateAttendanceSettingsInput = {
  workDayStart?: string;
  workDayEnd?: string;
  workingDays?: number[];
  lateGraceMinutes?: number;
  earlyLeaveGrace?: number;
  overtimeThreshold?: number;
  roundingEnabled?: boolean;
  roundingMinutes?: number;
  requireBiometric?: boolean;
  geofenceEnabled?: boolean;
  geofenceLat?: number;
  geofenceLng?: number;
  geofenceRadiusM?: number;
  locationAttendanceEnabled?: boolean;
  requireLocation?: boolean;
};

export type AttendanceSettingsUpdatePersistenceInput = {
  workDayStart?: string;
  workDayEnd?: string;
  workingDays?: number[];
  lateGraceMinutes?: number;
  earlyLeaveGrace?: number;
  overtimeThreshold?: number;
  roundingEnabled?: boolean;
  roundingMinutes?: number | null;
  requireBiometric?: boolean;
  geofenceEnabled?: boolean;
  geofenceLat?: number | null;
  geofenceLng?: number | null;
  geofenceRadiusM?: number | null;
  locationAttendanceEnabled?: boolean;
  requireLocation?: boolean;
};
