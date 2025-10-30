/**
 * Report Export Utilities
 * Provides functions to export analytics reports in various formats (CSV, JSON, PDF)
 */

export interface AppointmentStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
}

export interface ServiceUsage {
  serviceId: string;
  serviceName: string;
  usageCount: number;
}

export interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  appointmentCount: number;
}

export interface ExportData {
  appointmentStats?: AppointmentStats;
  serviceUsage?: ServiceUsage[];
  revenueData?: RevenueData;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  generatedAt: string;
}

/**
 * Converts data to CSV format
 */
export const exportToCSV = (data: ExportData, filename: string = 'report'): void => {
  const rows: string[] = [];
  
  // Header
  rows.push('Hopewell Clinic Analytics Report');
  rows.push(`Generated: ${data.generatedAt}`);
  if (data.dateRange) {
    rows.push(`Date Range: ${data.dateRange.startDate} to ${data.dateRange.endDate}`);
  }
  rows.push('');
  
  // Appointment Statistics
  if (data.appointmentStats) {
    rows.push('Appointment Statistics');
    rows.push('Metric,Value');
    rows.push(`Total Appointments,${data.appointmentStats.total}`);
    rows.push(`Confirmed,${data.appointmentStats.confirmed}`);
    rows.push(`Pending,${data.appointmentStats.pending}`);
    rows.push(`Cancelled,${data.appointmentStats.cancelled}`);
    rows.push(`Completed,${data.appointmentStats.completed || 0}`);
    rows.push('');
  }
  
  // Service Usage
  if (data.serviceUsage && data.serviceUsage.length > 0) {
    rows.push('Service Usage');
    rows.push('Service Name,Usage Count');
    data.serviceUsage.forEach(service => {
      rows.push(`${service.serviceName},${service.usageCount}`);
    });
    rows.push('');
  }
  
  // Revenue Data
  if (data.revenueData) {
    rows.push('Revenue Report');
    rows.push('Metric,Value');
    rows.push(`Total Revenue,$${data.revenueData.totalRevenue.toFixed(2)}`);
    rows.push(`Monthly Revenue,$${data.revenueData.monthlyRevenue.toFixed(2)}`);
    rows.push(`Appointment Count,${data.revenueData.appointmentCount}`);
  }
  
  // Create CSV blob and download
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exports data to JSON format
 */
export const exportToJSON = (data: ExportData, filename: string = 'report'): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generates a PDF report (simple HTML-based PDF)
 * Note: For production, consider using a library like jsPDF or Puppeteer
 */
export const exportToPDF = (data: ExportData, filename: string = 'report'): void => {
  // Create HTML content
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Hopewell Clinic Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #2563eb; }
        h2 { color: #1e40af; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #2563eb; color: white; }
        .header { margin-bottom: 30px; }
        .metric { margin: 10px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Hopewell Clinic Analytics Report</h1>
        <p><strong>Generated:</strong> ${data.generatedAt}</p>
        ${data.dateRange ? `<p><strong>Date Range:</strong> ${data.dateRange.startDate} to ${data.dateRange.endDate}</p>` : ''}
      </div>
  `;
  
  // Appointment Statistics
  if (data.appointmentStats) {
    htmlContent += `
      <h2>Appointment Statistics</h2>
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Appointments</td><td>${data.appointmentStats.total}</td></tr>
        <tr><td>Confirmed</td><td>${data.appointmentStats.confirmed}</td></tr>
        <tr><td>Pending</td><td>${data.appointmentStats.pending}</td></tr>
        <tr><td>Cancelled</td><td>${data.appointmentStats.cancelled}</td></tr>
        <tr><td>Completed</td><td>${data.appointmentStats.completed || 0}</td></tr>
      </table>
    `;
  }
  
  // Service Usage
  if (data.serviceUsage && data.serviceUsage.length > 0) {
    htmlContent += `
      <h2>Service Usage</h2>
      <table>
        <tr><th>Service Name</th><th>Usage Count</th></tr>
    `;
    data.serviceUsage.forEach(service => {
      htmlContent += `<tr><td>${service.serviceName}</td><td>${service.usageCount}</td></tr>`;
    });
    htmlContent += `</table>`;
  }
  
  // Revenue Data
  if (data.revenueData) {
    htmlContent += `
      <h2>Revenue Report</h2>
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Revenue</td><td>$${data.revenueData.totalRevenue.toFixed(2)}</td></tr>
        <tr><td>Monthly Revenue</td><td>$${data.revenueData.monthlyRevenue.toFixed(2)}</td></tr>
        <tr><td>Appointment Count</td><td>${data.revenueData.appointmentCount}</td></tr>
      </table>
    `;
  }
  
  htmlContent += `
      <div class="footer">
        <p>This report was generated automatically by Hopewell Clinic Management System.</p>
      </div>
    </body>
    </html>
  `;
  
  // Open in new window for printing/saving as PDF
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

/**
 * Prepares export data from dashboard data
 */
export const prepareExportData = (
  appointments: any[],
  services: any[],
  dateRange?: { startDate: string; endDate: string }
): ExportData => {
  const appointmentStats: AppointmentStats = {
    total: appointments.length,
    confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
    pending: appointments.filter(apt => apt.status === 'pending').length,
    cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
  };
  
  const serviceUsage: ServiceUsage[] = services.map(service => ({
    serviceId: service.id,
    serviceName: service.name,
    usageCount: appointments.filter(apt => apt.service?.id === service.id).length,
  }));
  
  const confirmedAppointments = appointments.filter(
    apt => apt.status === 'confirmed' || apt.status === 'completed'
  );
  
  const totalRevenue = confirmedAppointments.reduce(
    (total, apt) => total + (apt.service?.price || 0),
    0
  );
  
  const now = new Date();
  const monthlyRevenue = confirmedAppointments
    .filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate.getMonth() === now.getMonth() && 
             aptDate.getFullYear() === now.getFullYear();
    })
    .reduce((total, apt) => total + (apt.service?.price || 0), 0);
  
  const revenueData: RevenueData = {
    totalRevenue,
    monthlyRevenue,
    appointmentCount: confirmedAppointments.length,
  };
  
  return {
    appointmentStats,
    serviceUsage,
    revenueData,
    dateRange,
    generatedAt: new Date().toLocaleString(),
  };
};

