// import { mailer } from "@/shared/config/mailer";


// export const emailService = {

//   async sendEmployeeWelcome({
//     to,
//     name,
//     employeeCode,
//     tempPassword,
//   }: {
//     to: string;
//     name: string;
//     employeeCode: string;
//     tempPassword: string;
//   }) {
//     await mailer.sendMail({
//       from: `"HR System" <${process.env.SMTP_USER}>`,
//       to,
//       subject: "🎉 Welcome! Your Account Credentials",
//       html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
//         <h2 style="color: #1f2937;">Welcome, ${name}! 👋</h2>
//         <p style="color: #4b5563;">Your account has been created. Here are your login credentials:</p>
        
//         <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
//           <p style="margin: 8px 0;"><strong>Employee Code:</strong> ${employeeCode}</p>
//           <p style="margin: 8px 0;"><strong>Email:</strong> ${to}</p>
//           <p style="margin: 8px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
//         </div>

//         <p style="color: #ef4444; font-size: 14px;">⚠️ Please change your password after your first login.</p>
//       </div>
//     `,
//     });
//   },

// };