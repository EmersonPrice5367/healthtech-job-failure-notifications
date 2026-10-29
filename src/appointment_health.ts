import { z } from "zod";
import { captureJobFailure } from "./infrai_errors.ts";

export const appointmentBody = z.object({
  appointmentId: z.string().min(1),
  patientReference: z.string().min(1),
  scheduledFor: z.string().datetime(),
  channel: z.enum(["sms", "email"])
});
export type Appointment = z.infer<typeof appointmentBody>;

export function notificationFor(appointment: Appointment, jobSucceeded: boolean): string {
  if (jobSucceeded) return `Appointment ${appointment.appointmentId} is confirmed.`;
  return `Appointment ${appointment.appointmentId} needs staff review.`;
}

export async function runAppointmentHealth(body: unknown): Promise<string> {
  const appointment = appointmentBody.parse(body);
  try {
    const notification = notificationFor(appointment, false);
    await captureJobFailure({
      name: "ScheduledAppointmentHealthJob",
      message: "Appointment notification job did not complete",
      context: { appointmentId: appointment.appointmentId, channel: appointment.channel, patientReference: appointment.patientReference }
    });
    return notification;
  } catch (error) {
    await captureJobFailure({
      name: "ScheduledAppointmentHealthJob",
      message: error instanceof Error ? error.message : "Appointment health job failed",
      context: { appointmentId: appointment.appointmentId, channel: appointment.channel, patientReference: appointment.patientReference }
    });
    return notificationFor(appointment, false);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = { appointmentId: "apt-104", patientReference: "patient-ref-104", scheduledFor: "2026-10-25T09:00:00.000Z", channel: "sms" };
  console.log(notificationFor(appointmentBody.parse(input), false));
}
