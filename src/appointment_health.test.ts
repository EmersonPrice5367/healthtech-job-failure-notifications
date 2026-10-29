import assert from "node:assert/strict";
import { appointmentBody, notificationFor } from "./appointment_health.ts";

const appointment = appointmentBody.parse({ appointmentId: "apt-104", patientReference: "patient-ref-104", scheduledFor: "2026-10-25T09:00:00.000Z", channel: "sms" });
assert.equal(notificationFor(appointment, false), "Appointment apt-104 needs staff review.");
assert.throws(() => appointmentBody.parse({ appointmentId: "", patientReference: "patient-ref-104", scheduledFor: "2026-10-25T09:00:00.000Z", channel: "sms" }));
console.log("appointment failure decision passed");
