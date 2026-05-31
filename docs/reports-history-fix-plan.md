# Reports History Endpoint — Bug Analysis & Fix Plan

**Endpoint:** `GET /api/v1/reports/history`  
**Source:** `src/modules/reports/reports.service.ts`

---

## Observed Issues

### 1. `type: "unknown"` on all records

**Current code** (line 756):
```ts
type: customContext.reportType ?? "unknown",
```

**Root cause:** Cloudinary's `context` metadata isn't being persisted during upload. The `uploadReportFile` function passes `context` as a JS object (lines 563–571):

```ts
context: {
  reportType,
  generatedBy,
  filters: JSON.stringify({ ... }),
},
```

Cloudinary's upload API expects context in `key=value|key=value` flat-string format. The Node.js SDK serializes the object to that format, but the `filters` value is a JSON string containing `"`, `{`, `}`, `:`, `,`, etc. — these special characters break the pipe-delimited context format and the **entire context is silently dropped**.

### 2. `generatedBy: null` on all records

**Current code** (lines 757–760):
```ts
generatedBy:
  typeof customContext.generatedBy === "string"
    ? customContext.generatedBy
    : null,
```

**Root cause:** Same as #1 — context never persisted, so `customContext.generatedBy` is always `undefined`.

### 3. `filters: {}` on all records

**Current code** (line 765):
```ts
filters: parseHistoryFilters(customContext.filters),
```

**Root cause:** Same as #1 — `customContext.filters` is `undefined`, and `parseHistoryFilters(undefined)` returns `{}` at line 592.

### 4. Double file extension on CSV records (`.csv.csv`)

**Current code** (line 763):
```ts
fileName: `${resource.public_id}.${resource.format}`,
```

**Root cause:** For `raw` resource types (CSV), Cloudinary's `resource.public_id` **already includes the extension** — e.g., `reports/.../leave-summary-20260529-180439.csv`. The code unconditionally appends `resource.format`, producing `leave-summary-20260529-180439.csv.csv`.

For `image` resource types (PDF), Cloudinary strips the extension from `public_id`, so the code works by accident.

---

## Fix Plan

### Fix 1 — Properly serialize context for Cloudinary upload

**File:** `src/modules/reports/reports.service.ts` — `uploadReportFile` function (lines 563–571)

Replace the object-form `context` with a flat pipe-delimited string where the filters JSON is **base64-encoded** to avoid special-character corruption.

```ts
context: [
  `reportType=${reportType}`,
  `generatedBy=${generatedBy}`,
  `filters=${Buffer.from(JSON.stringify({
    startDate: filters.startDate?.toISOString() ?? null,
    endDate: filters.endDate?.toISOString() ?? null,
    departmentId: filters.departmentId ?? null,
    userId: filters.userId ?? null,
  })).toString("base64")}`,
].join("|"),
```

### Fix 2 — Decode base64 filters in `parseHistoryFilters`

**File:** `src/modules/reports/reports.service.ts` — `parseHistoryFilters` function (lines 591–601)

Update to detect and decode base64-encoded filters:

```ts
const parseHistoryFilters = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "string" || value.trim() === "") {
    return {};
  }
  try {
    const decoded = Buffer.from(value, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return {};
  }
};
```

### Fix 3 — Derive fileName without double extension

**File:** `src/modules/reports/reports.service.ts` — `getHistory` method (line 763)

Check if `public_id` already ends with the format extension:

```ts
fileName: resource.public_id.endsWith(`.${resource.format}`)
  ? resource.public_id
  : `${resource.public_id}.${resource.format}`,
```

### Fix 4 — Add type fallback from filename for legacy records

**File:** `src/modules/reports/reports.service.ts` — `getHistory` method (line 756)

When context is missing, derive the type from the original file name prefix:

```ts
type: customContext.reportType ?? deriveTypeFromFileName(resource),
```

Add a helper:
```ts
const deriveTypeFromFileName = (resource: any): string => {
  const fileName = resource.public_id.split("/").pop() ?? "";
  const knownTypes: string[] = ["headcount", "leave-summary", "overtime", "asset-custody", "task-completion"];
  for (const t of knownTypes) {
    if (fileName.startsWith(t)) return t;
  }
  return "unknown";
};
```

---

## Migration

After deploying, existing reports in Cloudinary will still lack context metadata. Fix 4 handles this via filename fallback. A one-time backfill script (optional) could re-upload context metadata to existing Cloudinary resources using the Admin API.

---

## Files to modify

| File | Changes |
|------|---------|
| `src/modules/reports/reports.service.ts` | Fixes 1–4 (context serialization, filter parsing, fileName construction, type fallback) |
| `src/shared/interfaces/report.interface.ts` | Verify `ReportHistoryItem` type still matches (no changes expected) |
