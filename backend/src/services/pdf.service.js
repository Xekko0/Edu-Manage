/**
 * Xuất PDF học bạ / bảng điểm / báo cáo lớp.
 * Sử dụng pdfkit (đơn giản) hoặc Puppeteer (HTML → PDF).
 */
const PDFDocument = require('pdfkit');

const generateGradebookPDF = (student, subjectAverages, overallAvg) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const buffers = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  doc.fontSize(18).text('HỌC BẠ ĐIỆN TỬ', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Họ và tên: ${student.full_name}`);
  doc.text(`Mã HS: ${student.student_code}`);
  doc.text(`Lớp: ${student.class_name || '—'}`);
  doc.moveDown();

  doc.fontSize(14).text('Bảng điểm tổng hợp');
  doc.moveDown(0.5);

  subjectAverages.forEach((s) => {
    doc.fontSize(11).text(
      `${s.subject_name.padEnd(20)}  TB: ${s.average.toFixed(2)}   Xếp loại: ${s.grade}`,
    );
  });

  doc.moveDown();
  doc.fontSize(12).text(`Trung bình chung: ${overallAvg.toFixed(2)}`);

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
};

module.exports = { generateGradebookPDF };
