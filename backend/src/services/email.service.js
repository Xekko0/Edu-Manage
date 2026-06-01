/**
 * Gửi email qua Nodemailer + SMTP (theo SRS mục 2.9).
 */
const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const t = getTransporter();
  return t.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
};

const sendAbsenceAlert = async (parentEmail, studentName, date) =>
  sendEmail({
    to: parentEmail,
    subject: `[EduSmart] ${studentName} vắng không phép ngày ${date}`,
    html: `<p>Kính gửi Quý phụ huynh,</p>
           <p>Hệ thống EduSmart ghi nhận học sinh <b>${studentName}</b> vắng học không phép vào ngày <b>${date}</b>.</p>
           <p>Vui lòng liên hệ giáo viên chủ nhiệm nếu cần thiết.</p>`,
  });

module.exports = { sendEmail, sendAbsenceAlert };
