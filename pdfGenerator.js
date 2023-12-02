const PDFDocument = require('pdfkit');
const fs = require('fs');

async function generateInvoicePDF(invoiceData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();

    // Set font and font size for the header
    doc.font('Helvetica-Bold').fontSize(14);

    // Header
    doc.text('Invoice', { align: 'center' });

    // Content
    doc.moveDown(); // Move cursor down

    // Set font and font size for the table data
    doc.font('Helvetica').fontSize(12);

    // Table data
    const tableData = [
      { label: 'Medical Name', value: 'Gopal Medical Store' },
      { label: 'Customer Name', value: invoiceData.customerName },
      { label: 'Medicine Name', value: invoiceData.medicineName },
      { label: 'Date', value: invoiceData.date.toLocaleDateString() },
      { label: 'Paying Amount', value: invoiceData.netTotal }
    ];

    // Draw table
    const tableTop = doc.y;
    const tableBottom = doc.y + tableData.length * 20;
    doc.moveTo(40, tableTop).lineTo(350, tableTop).stroke(); // Table top border

    tableData.forEach((row, index) => {
      const rowY = tableTop + index * 20 + 20; // 20 is the row height
      doc.text(row.label, 50, rowY);
      doc.text(row.value, 200, rowY);
      doc.moveTo(40, rowY + 15).lineTo(350, rowY + 15).stroke(); // Row separator
    });

     // Table bottom border

    // Save the PDF to a buffer
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });

    // Save the PDF to a file (optional)
    doc.pipe(fs.createWriteStream('invoice.pdf'));

    // End the PDF document
    doc.end();
  });
}

module.exports = { generateInvoicePDF };
