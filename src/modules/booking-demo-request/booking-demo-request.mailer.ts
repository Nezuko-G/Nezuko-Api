import { EmployeeCount, Interest } from "@prisma/client";
import { mailer } from "@/shared/config/mailer.js";

type BookingDemoMailPayload = {
  id: string;
  fullName: string;
  email: string;
  companyName: string;
  jobTitle: string;
  phone: string;
  employeeCount: EmployeeCount;
  interests: Interest[];
  createdAt: Date;
};

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function formatEmployeeCount(value: EmployeeCount): string {
  const labelMap: Record<EmployeeCount, string> = {
    FROM_1_TO_25: "1 to 25 employees",
    FROM_26_TO_100: "26 to 100 employees",
    FROM_101_TO_250: "101 to 250 employees",
    MORE_THAN_250: "More than 250 employees",
  };

  return labelMap[value];
}

function formatInterests(values: Interest[]): string {
  const labelMap: Record<Interest, string> = {
    ALL: "All",
    CORE_HR: "Core HR Suite",
    TALENT: "Talent Suite",
    SPEND: "Spend Suite",
  };

  return values.map((value) => labelMap[value]).join(", ");
}

export const bookingDemoRequestMailer = {
  async sendNewBookingDetails(payload: BookingDemoMailPayload) {
    const to = getEnv("BOOKING_NOTIFICATION_EMAIL");
    const interests = formatInterests(payload.interests);
    const employeeCount = formatEmployeeCount(payload.employeeCount);
    const createdAt = payload.createdAt.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    });

    const subject = `New Demo Request from ${payload.fullName} (${payload.companyName})`;
    const textBody = [
      "New demo request submitted",
      "",
      `Contact Name: ${payload.fullName}`,
      `Contact Email: ${payload.email}`,
      `Company Name: ${payload.companyName}`,
      `Job Title: ${payload.jobTitle}`,
      `Phone Number: ${payload.phone}`,
      `Team Size: ${employeeCount}`,
      `Interested In: ${interests}`,
      `Submitted At (UTC): ${createdAt}`,
      `Request ID: ${payload.id}`,
    ].join("\n");

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
        <h2 style="margin-bottom: 8px; color: #0f172a;">New Demo Request</h2>
        <p style="margin-top: 0;">A new company requested a demo through the website.</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 680px;">
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Contact Name</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${payload.fullName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Contact Email</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${payload.email}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Company Name</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${payload.companyName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Job Title</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${payload.jobTitle}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Phone Number</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${payload.phone}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Team Size</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${employeeCount}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Interested In</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${interests}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Submitted At (UTC)</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${createdAt}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Request ID</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${payload.id}</td></tr>
        </table>
      </div>
    `;

    await mailer.sendMail({
      from: payload.email,
      to,
      replyTo: payload.email,
      subject,
      text: textBody,
      html: htmlBody,
    });
  },
};
