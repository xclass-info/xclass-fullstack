import { api, seg } from "../api";

// Which field on each kind of item is its total seat count.
const KINDS = {
  research: { seatsField: "seats" },
  project: { seatsField: "seats" },
};

// null means the item has no seat count, so it can't be registered for.
export function seatsLeft(kind, item) {
  const total = Number(item[KINDS[kind].seatsField]);
  if (!total) return null;
  return Math.max(total - (item.enrolledCount || 0), 0);
}

export function totalSeats(kind, item) {
  return Number(item[KINDS[kind].seatsField]) || null;
}

// Submits the logged-in student's application for one item. The backend
// checks seats and duplicates atomically (one email = one live application
// per item; a previously REJECTED application can be replaced). The seat
// isn't taken yet - an admin must approve it (approveStudentApplication)
// before it counts against enrolledCount. Errors carry the backend's code
// as err.message: "FULL", "DUPLICATE" or "NOT_FOUND".
export async function registerForItem(kind, itemId) {
  await api.post("/registrations", { kind, itemId });
}

// Admin approves a pending application: the backend re-checks seats are
// still available, then takes the seat and approves, atomically. The
// student is emailed; the result's emailSent is false if that failed.
export async function approveStudentApplication(regId) {
  return api.post(`/admin/registrations/${seg(regId)}/approve`);
}

// Admin rejects a pending application. No seat was ever taken. The student
// is emailed the reason; emailSent is false if that failed.
export async function rejectStudentApplication(regId, reason) {
  return api.post(`/admin/registrations/${seg(regId)}/reject`, { reason: reason.trim() });
}
