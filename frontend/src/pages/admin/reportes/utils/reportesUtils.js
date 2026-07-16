import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

// 🟢 1. ESTILOS COMPARTIDOS PARA TODAS LAS TABLAS EN PDF
export const baseTableStyles = {
  theme: 'striped',
  headStyles: { fillColor: [15, 118, 110], fontSize: 10, halign: 'center' },
  bodyStyles: { fontSize: 9, valign: 'middle' },
  styles: { cellPadding: 4, overflow: 'linebreak' },
  margin: { top: 12 }
};

// 🟢 2. INICIALIZADOR DE DOCUMENTOS PDF (Configura título, fechas y página)
export const inicializarPDF = (titulo, subTextoRango, filtroEspecialidad) => {
  const doc = new jsPDF();
  const anioActual = new Date().getFullYear();
  let currentY = 14;

  const checkPageBreak = (espacioNecesario) => {
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    if (currentY + espacioNecesario >= pageHeight - 10) {
      doc.addPage();
      currentY = 14;
    }
  };

  // Título
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(`${titulo} ${anioActual}`, 14, currentY);
  currentY += 7;

  // Subtítulo con rango de fechas
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Gris suave (#64748b)
  doc.text(subTextoRango, 14, currentY);
  currentY += 8;

  // Filtro
  if (filtroEspecialidad) {
    doc.setFontSize(10);
    doc.setTextColor(15, 118, 110);
    doc.text(`Filtro aplicado: ${filtroEspecialidad}`, 14, currentY);
    doc.setTextColor(0, 0, 0);
    currentY += 8;
  } else {
    currentY += 2;
  }

  return { doc, currentY, checkPageBreak };
};

// 🟢 3. FORMATEADOR DE CABECERAS PARA HOJAS DE EXCEL
export const generarPrefacioExcel = (titulo, subTextoRango) => {
  return [
    [titulo.toUpperCase()],
    [subTextoRango.toUpperCase()],
    [] // Fila vacía de separación
  ];
};

// 🟢 4. EXPORTADOR DE HOJAS EXCEL COMPLETO (Omitiendo hojas de forma dinámica si incluir === false)
export const exportarAExcel = (filename, laminas) => {
  const wb = XLSX.utils.book_new();
  
  laminas.forEach(lamina => {
    if (lamina.incluir !== false) {
      const ws = XLSX.utils.aoa_to_sheet(lamina.data);
      if (lamina.cols) ws['!cols'] = lamina.cols;
      XLSX.utils.book_append_sheet(wb, ws, lamina.nombre);
    }
  });

  XLSX.writeFile(wb, filename);
};