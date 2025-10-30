import nodemailer from 'nodemailer';

// Ethereal Email configuration for development/testing
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'ethereal.user@ethereal.email', // This will be replaced with actual Ethereal credentials
      pass: 'ethereal.pass' // This will be replaced with actual Ethereal credentials
    }
  });
};

// Email templates
export const emailTemplates = {
  // 24-hour appointment reminder template
  appointmentReminder24h: (appointmentData) => {
    const { patient, appointment, service, staff, clinic } = appointmentData;
    const appointmentDate = new Date(appointment.appointmentDate + ' ' + appointment.startTime);
    
    return {
      subject: `Appointment Reminder - Tomorrow at ${appointmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; color: #374151; }
            .detail-value { color: #6b7280; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .urgent { color: #dc2626; font-weight: bold; }
            .clinic-info { background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 Hopewell Community Clinic</h1>
              <h2>Appointment Reminder</h2>
            </div>
            
            <div class="content">
              <p>Dear ${patient.firstName} ${patient.lastName},</p>
              
              <p>This is a friendly reminder that you have an appointment scheduled for <strong>tomorrow</strong>:</p>
              
              <div class="appointment-details">
                <div class="detail-row">
                  <span class="detail-label">📅 Date:</span>
                  <span class="detail-value">${appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🕐 Time:</span>
                  <span class="detail-value">${appointmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date(appointment.appointmentDate + ' ' + appointment.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🏥 Service:</span>
                  <span class="detail-value">${service.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">👨‍⚕️ Provider:</span>
                  <span class="detail-value">Dr. ${staff ? staff.firstName + ' ' + staff.lastName : 'TBD'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">⏱️ Duration:</span>
                  <span class="detail-value">${service.durationMinutes} minutes</span>
                </div>
              </div>
              
              <div class="clinic-info">
                <h3>📍 Clinic Information</h3>
                <p><strong>Address:</strong> ${clinic?.address || '123 Medical Drive, Healthcare City, HC 12345'}</p>
                <p><strong>Phone:</strong> ${clinic?.phone || '(555) 123-4567'}</p>
                <p><strong>Email:</strong> ${clinic?.email || 'info@hopewellclinic.com'}</p>
              </div>
              
              <h3>📋 What to Bring:</h3>
              <ul>
                <li>Valid ID or driver's license</li>
                <li>Insurance card (if applicable)</li>
                <li>List of current medications</li>
                <li>Any relevant medical records</li>
                <li>Payment method (if copay required)</li>
              </ul>
              
              <h3>⚠️ Important Notes:</h3>
              <ul>
                <li>Please arrive 15 minutes early for check-in</li>
                <li>If you need to cancel or reschedule, please call us at least 24 hours in advance</li>
                <li>Bring a face mask as it may be required</li>
                <li>If you're feeling unwell, please call to reschedule</li>
              </ul>
              
              <div class="footer">
                <p>If you have any questions or need to make changes to your appointment, please contact us:</p>
                <a href="tel:${clinic?.phone || '555-123-4567'}" class="button">📞 Call Us</a>
                <a href="mailto:${clinic?.email || 'info@hopewellclinic.com'}" class="button">✉️ Email Us</a>
              </div>
              
              <p style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
                Thank you for choosing Hopewell Community Clinic for your healthcare needs.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hopewell Community Clinic - Appointment Reminder
        
        Dear ${patient.firstName} ${patient.lastName},
        
        This is a friendly reminder that you have an appointment scheduled for tomorrow:
        
        Date: ${appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        Time: ${appointmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date(appointment.appointmentDate + ' ' + appointment.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        Service: ${service.name}
        Provider: Dr. ${staff ? staff.firstName + ' ' + staff.lastName : 'TBD'}
        Duration: ${service.durationMinutes} minutes
        
        Clinic Information:
        Address: ${clinic?.address || '123 Medical Drive, Healthcare City, HC 12345'}
        Phone: ${clinic?.phone || '(555) 123-4567'}
        Email: ${clinic?.email || 'info@hopewellclinic.com'}
        
        What to Bring:
        - Valid ID or driver's license
        - Insurance card (if applicable)
        - List of current medications
        - Any relevant medical records
        - Payment method (if copay required)
        
        Important Notes:
        - Please arrive 15 minutes early for check-in
        - If you need to cancel or reschedule, please call us at least 24 hours in advance
        - Bring a face mask as it may be required
        - If you're feeling unwell, please call to reschedule
        
        If you have any questions or need to make changes to your appointment, please contact us at ${clinic?.phone || '555-123-4567'} or ${clinic?.email || 'info@hopewellclinic.com'}.
        
        Thank you for choosing Hopewell Community Clinic for your healthcare needs.
      `
    };
  },

  // 2-hour appointment reminder template
  appointmentReminder2h: (appointmentData) => {
    const { patient, appointment, service, staff, clinic } = appointmentData;
    const appointmentDate = new Date(appointment.appointmentDate + ' ' + appointment.startTime);
    
    return {
      subject: `URGENT: Your appointment is in 2 hours - ${appointmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Urgent Appointment Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; }
            .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; color: #374151; }
            .detail-value { color: #6b7280; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .urgent { color: #dc2626; font-weight: bold; background: #fef2f2; padding: 10px; border-radius: 6px; border: 2px solid #dc2626; }
            .clinic-info { background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .directions { background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #22c55e; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 Hopewell Community Clinic</h1>
              <h2>🚨 URGENT: Appointment in 2 Hours!</h2>
            </div>
            
            <div class="content">
              <div class="urgent">
                <h2>⚠️ URGENT REMINDER ⚠️</h2>
                <p>Your appointment is scheduled in approximately <strong>2 hours</strong>!</p>
              </div>
              
              <p>Dear ${patient.firstName} ${patient.lastName},</p>
              
              <p>This is an urgent reminder that you have an appointment scheduled for <strong>today</strong>:</p>
              
              <div class="appointment-details">
                <div class="detail-row">
                  <span class="detail-label">📅 Date:</span>
                  <span class="detail-value">${appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🕐 Time:</span>
                  <span class="detail-value">${appointmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date(appointment.appointmentDate + ' ' + appointment.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🏥 Service:</span>
                  <span class="detail-value">${service.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">👨‍⚕️ Provider:</span>
                  <span class="detail-value">Dr. ${staff ? staff.firstName + ' ' + staff.lastName : 'TBD'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">⏱️ Duration:</span>
                  <span class="detail-value">${service.durationMinutes} minutes</span>
                </div>
              </div>
              
              <div class="directions">
                <h3>🗺️ Directions to Clinic</h3>
                <p><strong>Address:</strong> ${clinic?.address || '123 Medical Drive, Healthcare City, HC 12345'}</p>
                <p><strong>Parking:</strong> Free parking available in front of the building</p>
                <p><strong>Entrance:</strong> Main entrance on Medical Drive</p>
              </div>
              
              <div class="clinic-info">
                <h3>📞 Contact Information</h3>
                <p><strong>Phone:</strong> ${clinic?.phone || '(555) 123-4567'}</p>
                <p><strong>Email:</strong> ${clinic?.email || 'info@hopewellclinic.com'}</p>
                <p><strong>Emergency:</strong> If you need to cancel urgently, call immediately</p>
              </div>
              
              <h3>📋 Last-Minute Checklist:</h3>
              <ul>
                <li>✅ Valid ID or driver's license</li>
                <li>✅ Insurance card (if applicable)</li>
                <li>✅ List of current medications</li>
                <li>✅ Face mask (required)</li>
                <li>✅ Payment method (if copay required)</li>
                <li>✅ Leave home 30 minutes early for traffic</li>
              </ul>
              
              <div class="urgent">
                <h3>⚠️ Important:</h3>
                <ul>
                  <li>Please arrive 15 minutes early for check-in</li>
                  <li>If you're running late, call us immediately</li>
                  <li>If you need to cancel, call us NOW - late cancellations may incur fees</li>
                </ul>
              </div>
              
              <div class="footer">
                <p>Need immediate assistance? Contact us now:</p>
                <a href="tel:${clinic?.phone || '555-123-4567'}" class="button">📞 Call Now</a>
                <a href="mailto:${clinic?.email || 'info@hopewellclinic.com'}" class="button">✉️ Email</a>
              </div>
              
              <p style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
                We look forward to seeing you soon at Hopewell Community Clinic.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        URGENT: Hopewell Community Clinic - Appointment in 2 Hours!
        
        ⚠️ URGENT REMINDER ⚠️
        Your appointment is scheduled in approximately 2 hours!
        
        Dear ${patient.firstName} ${patient.lastName},
        
        This is an urgent reminder that you have an appointment scheduled for today:
        
        Date: ${appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        Time: ${appointmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date(appointment.appointmentDate + ' ' + appointment.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        Service: ${service.name}
        Provider: Dr. ${staff ? staff.firstName + ' ' + staff.lastName : 'TBD'}
        Duration: ${service.durationMinutes} minutes
        
        Directions to Clinic:
        Address: ${clinic?.address || '123 Medical Drive, Healthcare City, HC 12345'}
        Parking: Free parking available in front of the building
        Entrance: Main entrance on Medical Drive
        
        Contact Information:
        Phone: ${clinic?.phone || '(555) 123-4567'}
        Email: ${clinic?.email || 'info@hopewellclinic.com'}
        Emergency: If you need to cancel urgently, call immediately
        
        Last-Minute Checklist:
        - Valid ID or driver's license
        - Insurance card (if applicable)
        - List of current medications
        - Face mask (required)
        - Payment method (if copay required)
        - Leave home 30 minutes early for traffic
        
        Important:
        - Please arrive 15 minutes early for check-in
        - If you're running late, call us immediately
        - If you need to cancel, call us NOW - late cancellations may incur fees
        
        Need immediate assistance? Contact us now at ${clinic?.phone || '555-123-4567'} or ${clinic?.email || 'info@hopewellclinic.com'}.
        
        We look forward to seeing you soon at Hopewell Community Clinic.
      `
    };
  },

  // Custom notification template
  customNotification: (patientData, subject, message) => {
    const { firstName, lastName } = patientData;
    
    return {
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 Hopewell Community Clinic</h1>
              <h2>${subject}</h2>
            </div>
            
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <div class="message">
                ${message.replace(/\n/g, '<br>')}
              </div>
              
              <div class="footer">
                <p>If you have any questions, please contact us:</p>
                <p>Phone: (555) 123-4567 | Email: info@hopewellclinic.com</p>
                <p>Thank you for choosing Hopewell Community Clinic.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hopewell Community Clinic - ${subject}
        
        Dear ${firstName} ${lastName},
        
        ${message}
        
        If you have any questions, please contact us:
        Phone: (555) 123-4567
        Email: info@hopewellclinic.com
        
        Thank you for choosing Hopewell Community Clinic.
      `
    };
  }
};

// Email service functions
export const emailService = {
  // Send appointment reminder (24h or 2h)
  sendAppointmentReminder: async (appointmentData, reminderType = '24h') => {
    console.log('📧 [emailService] Starting to send appointment reminder...');
    console.log('📧 [emailService] Reminder type:', reminderType);
    console.log('📧 [emailService] Appointment data:', appointmentData);
    
    try {
      console.log('📧 [emailService] Creating email transporter...');
      const transporter = createTransporter();
      console.log('📧 [emailService] Transporter created successfully');
      
      let emailContent;
      if (reminderType === '24h') {
        console.log('📧 [emailService] Generating 24h reminder template...');
        emailContent = emailTemplates.appointmentReminder24h(appointmentData);
      } else if (reminderType === '2h') {
        console.log('📧 [emailService] Generating 2h reminder template...');
        emailContent = emailTemplates.appointmentReminder2h(appointmentData);
      } else {
        console.error('📧 [emailService] Invalid reminder type:', reminderType);
        throw new Error('Invalid reminder type. Use "24h" or "2h".');
      }
      
      console.log('📧 [emailService] Email content generated:', {
        subject: emailContent.subject,
        hasHtml: !!emailContent.html,
        hasText: !!emailContent.text,
        htmlLength: emailContent.html?.length || 0,
        textLength: emailContent.text?.length || 0
      });
      
      const mailOptions = {
        from: '"Hopewell Community Clinic" <noreply@hopewellclinic.com>',
        to: appointmentData.patient.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      };
      
      console.log('📧 [emailService] Mail options prepared:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        textLength: mailOptions.text?.length || 0,
        htmlLength: mailOptions.html?.length || 0
      });
      
      console.log('📧 [emailService] Sending email...');
      const info = await transporter.sendMail(mailOptions);
      console.log('📧 [emailService] Email sent successfully!');
      console.log('📧 [emailService] Message ID:', info.messageId);
      console.log('📧 [emailService] Response:', info.response);
      console.log('📧 [emailService] Accepted recipients:', info.accepted);
      console.log('📧 [emailService] Rejected recipients:', info.rejected);
      
      return { success: true, messageId: info.messageId, info: info };
    } catch (error) {
      console.error('📧 [emailService] Error sending appointment reminder:', error);
      console.error('📧 [emailService] Error details:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        stack: error.stack
      });
      return { success: false, error: error.message, details: error };
    }
  },

  // Send custom notification email
  sendCustomNotification: async (patientData, subject, message) => {
    console.log('📧 [emailService] Starting to send custom notification...');
    console.log('📧 [emailService] Patient data:', patientData);
    console.log('📧 [emailService] Subject:', subject);
    console.log('📧 [emailService] Message length:', message?.length || 0);
    
    try {
      console.log('📧 [emailService] Creating email transporter...');
      const transporter = createTransporter();
      console.log('📧 [emailService] Transporter created successfully');
      
      console.log('📧 [emailService] Generating custom notification template...');
      const emailContent = emailTemplates.customNotification(patientData, subject, message);
      console.log('📧 [emailService] Custom email content generated:', {
        subject: emailContent.subject,
        hasHtml: !!emailContent.html,
        hasText: !!emailContent.text,
        htmlLength: emailContent.html?.length || 0,
        textLength: emailContent.text?.length || 0
      });
      
      const mailOptions = {
        from: '"Hopewell Community Clinic" <noreply@hopewellclinic.com>',
        to: patientData.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      };
      
      console.log('📧 [emailService] Mail options prepared:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        textLength: mailOptions.text?.length || 0,
        htmlLength: mailOptions.html?.length || 0
      });
      
      console.log('📧 [emailService] Sending custom notification email...');
      const info = await transporter.sendMail(mailOptions);
      console.log('📧 [emailService] Custom notification sent successfully!');
      console.log('📧 [emailService] Message ID:', info.messageId);
      console.log('📧 [emailService] Response:', info.response);
      console.log('📧 [emailService] Accepted recipients:', info.accepted);
      console.log('📧 [emailService] Rejected recipients:', info.rejected);
      
      return { success: true, messageId: info.messageId, info: info };
    } catch (error) {
      console.error('📧 [emailService] Error sending custom notification:', error);
      console.error('📧 [emailService] Error details:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        stack: error.stack
      });
      return { success: false, error: error.message, details: error };
    }
  },

  // Send bulk emails
  sendBulkNotification: async (patientsData, subject, message) => {
    console.log('📧 [emailService] Starting to send bulk notifications...');
    console.log('📧 [emailService] Number of patients:', patientsData.length);
    console.log('📧 [emailService] Subject:', subject);
    console.log('📧 [emailService] Message length:', message?.length || 0);
    console.log('📧 [emailService] Patient emails:', patientsData.map(p => p.email));
    
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < patientsData.length; i++) {
      const patientData = patientsData[i];
      console.log(`📧 [emailService] Processing patient ${i + 1}/${patientsData.length}:`, {
        id: patientData.id,
        name: `${patientData.firstName} ${patientData.lastName}`,
        email: patientData.email
      });
      
      try {
        console.log(`📧 [emailService] Sending email to ${patientData.email}...`);
        const result = await emailService.sendCustomNotification(patientData, subject, message);
        results.push({ patientId: patientData.id, ...result });
        
        if (result.success) {
          successCount++;
          console.log(`📧 [emailService] ✅ Successfully sent to ${patientData.email}`);
        } else {
          failureCount++;
          console.log(`📧 [emailService] ❌ Failed to send to ${patientData.email}:`, result.error);
        }
      } catch (error) {
        failureCount++;
        console.error(`📧 [emailService] ❌ Error sending to ${patientData.email}:`, error);
        results.push({ 
          patientId: patientData.id, 
          success: false, 
          error: error.message,
          details: error
        });
      }
    }
    
    console.log('📧 [emailService] Bulk email operation completed:', {
      totalPatients: patientsData.length,
      successCount: successCount,
      failureCount: failureCount,
      successRate: `${((successCount / patientsData.length) * 100).toFixed(1)}%`
    });
    
    return {
      results,
      totalSent: successCount,
      totalFailed: failureCount,
      successRate: (successCount / patientsData.length) * 100
    };
  },

  // Preview email content (for admin interface)
  previewEmail: (templateType, data) => {
    switch (templateType) {
      case '24h':
        return emailTemplates.appointmentReminder24h(data);
      case '2h':
        return emailTemplates.appointmentReminder2h(data);
      case 'custom':
        return emailTemplates.customNotification(data.patient, data.subject, data.message);
      default:
        throw new Error('Invalid template type');
    }
  },

  // Test email configuration
  testEmailConfiguration: async () => {
    try {
      const transporter = createTransporter();
      await transporter.verify();
      console.log('Email configuration is valid');
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return { success: false, error: error.message };
    }
  }
};

export default emailService;
