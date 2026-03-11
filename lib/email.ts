import { Resend } from "resend"

const resendConfigured =
  !!process.env.RESEND_API_KEY &&
  !process.env.RESEND_API_KEY.includes("your_resend")

const resend = resendConfigured ? new Resend(process.env.RESEND_API_KEY) : null

export interface BookingEmailData {
  to: string
  guestName: string
  clinicName: string
  confirmationCode: string
  serviceName: string
  providerName: string
  date: string       // e.g. "Monday, March 11, 2026"
  time: string       // e.g. "10:00 AM"
  isVirtual: boolean
  locationName?: string
  fromEmail?: string
}

function buildHtml(d: BookingEmailData): string {
  const location = d.isVirtual
    ? "Telehealth — video link will be sent before your appointment"
    : (d.locationName ?? d.clinicName)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Appointment Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;max-width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0ea5e9;padding:28px 32px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">${d.clinicName}</p>
              <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">Appointment Confirmation</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Hi ${d.guestName},</p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                Your appointment has been confirmed. We look forward to seeing you.
              </p>

              <!-- Confirmation badge -->
              <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px 16px;margin-bottom:24px;text-align:center;">
                <p style="margin:0;font-size:11px;font-weight:600;color:#0369a1;text-transform:uppercase;letter-spacing:0.05em;">Confirmation</p>
                <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#0c4a6e;letter-spacing:0.05em;">#${d.confirmationCode}</p>
              </div>

              <!-- Details table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                ${[
                  ["Service", d.serviceName],
                  ["Provider", d.providerName],
                  ["Date", d.date],
                  ["Time", d.time],
                  ["Location", location],
                ].map(([label, value], i) => `
                <tr style="border-bottom:${i < 4 ? "1px solid #f3f4f6" : "none"};">
                  <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;width:110px;">${label}</td>
                  <td style="padding:12px 16px;font-size:14px;color:#111827;">${value}</td>
                </tr>`).join("")}
              </table>

              <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
                Need to reschedule or cancel? Sign in to your patient portal or reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">${d.clinicName} · Sent via Lumen Clinic</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildText(d: BookingEmailData): string {
  const location = d.isVirtual
    ? "Telehealth (video link will be sent before your appointment)"
    : (d.locationName ?? d.clinicName)
  return [
    `${d.clinicName} — Appointment Confirmed`,
    ``,
    `Hi ${d.guestName},`,
    `Your appointment has been confirmed.`,
    ``,
    `Confirmation: #${d.confirmationCode}`,
    `Service:      ${d.serviceName}`,
    `Provider:     ${d.providerName}`,
    `Date:         ${d.date}`,
    `Time:         ${d.time}`,
    `Location:     ${location}`,
    ``,
    `Need to reschedule or cancel? Sign in to your patient portal.`,
  ].join("\n")
}

export async function sendBookingConfirmation(data: BookingEmailData): Promise<void> {
  if (!resend) {
    // Resend not configured — log in dev so it's visible
    console.info("[email] Resend not configured. Would have sent to:", data.to)
    console.info("[email] Subject: Your appointment is confirmed — #" + data.confirmationCode)
    return
  }

  const from = data.fromEmail ?? `${data.clinicName} <noreply@lumenclinic.health>`

  await resend.emails.send({
    from,
    to: data.to,
    subject: `Your appointment is confirmed — #${data.confirmationCode}`,
    html: buildHtml(data),
    text: buildText(data),
  })
}
