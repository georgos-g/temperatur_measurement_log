import jsPDF from 'jspdf';

type PDFRecord = {
  id: string;
  temperature: number;
  date: string;
  time: string;
  screenshotUrl?: string;
};

export function generateTemperaturePDF(records: PDFRecord[]): Uint8Array {
  const pdf = new jsPDF();

  // Set font
  pdf.setFont('helvetica');

  // Title
  pdf.setFontSize(20);
  pdf.text('Temperaturmessungsprotokoll', 20, 30);

  // Date range
  pdf.setFontSize(12);
  const currentDate = new Date().toLocaleDateString('de-DE');
  pdf.text(`Erstellt am: ${currentDate}`, 20, 45);

  // Headers
  pdf.setFontSize(14);
  pdf.text('Datum', 20, 65);
  pdf.text('Uhrzeit', 60, 65);
  pdf.text('Temperatur (°C)', 100, 65);
  pdf.text('Screenshot', 150, 65);

  // Draw line under headers
  pdf.line(20, 70, 190, 70);

  // Records
  pdf.setFontSize(10);
  let yPosition = 80;

  records.forEach((record) => {
    if (yPosition > 270) {
      // New page if needed
      pdf.addPage();
      yPosition = 30;
    }

    pdf.text(record.date, 20, yPosition);
    pdf.text(record.time, 60, yPosition);
    pdf.text(record.temperature.toString(), 100, yPosition);

    if (record.screenshotUrl) {
      pdf.text('✓', 150, yPosition);
    } else {
      pdf.text('-', 150, yPosition);
    }

    yPosition += 10;
  });

  // Summary
  yPosition += 10;
  if (yPosition > 250) {
    pdf.addPage();
    yPosition = 30;
  }

  pdf.setFontSize(12);
  pdf.text('Zusammenfassung:', 20, yPosition);
  yPosition += 10;

  const temperatures = records.map((r) => r.temperature);
  const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
  const minTemp = Math.min(...temperatures);
  const maxTemp = Math.max(...temperatures);

  pdf.setFontSize(10);
  pdf.text(`Gesamtanzahl: ${records.length}`, 30, yPosition);
  yPosition += 8;
  pdf.text(`Durchschnittstemperatur: ${avgTemp.toFixed(1)}°C`, 30, yPosition);
  yPosition += 8;
  pdf.text(`Mindesttemperatur: ${minTemp.toFixed(1)}°C`, 30, yPosition);
  yPosition += 8;
  pdf.text(`Höchsttemperatur: ${maxTemp.toFixed(1)}°C`, 30, yPosition);

  return new Uint8Array(pdf.output('arraybuffer'));
}
