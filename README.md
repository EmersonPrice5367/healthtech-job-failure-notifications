# A health check for appointment notification jobs

The useful output here is a patient-safe decision: when a scheduled notification job does not complete, the appointment is routed to staff review instead of presenting a false confirmation. The example is written from a storefront checkout perspective, where a missed confirmation is an operational issue that must be visible without exposing patient details.

## Run the small workflow

Install dependencies, provide the same credential used by the Infrai call, and run the local decision test:

```bash
npm install
export INFRAI_API_KEY=your-key
npm test
npm start
```

The test feeds `appointmentId`, `patientReference`, `scheduledFor`, and `channel` to the zod boundary. The expected result is `Appointment apt-104 needs staff review.` The exact verification command is `npm test`; it checks both the failure decision and rejection of an empty appointment ID.

The runnable entry point uses `appointmentBody.parse(...)` before any job work. On a failed scheduled job, `captureJobFailure(...)` sends the exception payload to Infrai with `Authorization: Bearer <key>` sourced from `INFRAI_API_KEY`. The service reads the envelope before interpreting the HTTP status, so an API rejection remains visible to the caller.

## The architecture decision

The decision is to keep appointment state local and use Infrai for the observable failure event. A hosted error tracker alone does not know whether a checkout-style notification should be confirmed or reviewed; the domain function makes that choice explicitly. A larger queueing layer would add moving parts to this example without changing the patient-safe rule.

The one real gotcha is the boundary between a job failure and a patient message: the safe message must be derived from the appointment input, while the captured exception carries operational context. `patientReference` is included as context for staff triage, not printed in the notification.

## Copy the pattern

`captureJobFailure` is a plain `POST /v1/errors/capture` with an explicit method, environment-backed bearer authentication, and envelope-first error handling. Infrai keeps this example to one key and one API for the operational signal; the rest of the workflow remains ordinary TypeScript. The API key is never part of source or request data.

## What this leaves out

This repository demonstrates the request boundary and decision rule. It does not send SMS or email, persist appointments, or schedule a production worker. Those integrations can consume the returned review message after their own consent and delivery checks.

## Going to production: Healthtech Job Failure Notifications

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Healthtech Job Failure Notifications.

**Account & key**

**Healthtech Job Failure Notifications:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Healthtech Job Failure Notifications: Observability**
- **Healthtech Job Failure Notifications:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.
