const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });
  }

  // Generic email sending method
  async sendEmail(to, subject, html, attachments = []) {
    try {
      const mailOptions = {
        from: `"Beeja HRM" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send application confirmation email to candidate
  async sendApplicationConfirmation(application, job) {
    const subject = `Application Received - ${job.title}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .highlight { background-color: #e7f3ff; padding: 10px; border-left: 4px solid #007bff; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application Received</h1>
          </div>
          <div class="content">
            <p>Dear ${application.firstName} ${application.lastName},</p>
            
            <p>Thank you for your interest in the <strong>${job.title}</strong> position at our company.</p>
            
            <div class="highlight">
              <h3>Application Details:</h3>
              <ul>
                <li><strong>Position:</strong> ${job.title}</li>
                <li><strong>Job Code:</strong> ${job.code}</li>
                <li><strong>Applied On:</strong> ${new Date(application.appliedAt).toLocaleDateString()}</li>
                <li><strong>Application Status:</strong> ${application.status}</li>
              </ul>
            </div>
            
            <p>We have received your application and our HR team will review it shortly. We will contact you if your profile matches our requirements.</p>
            
            <p>If you have any questions, please feel free to contact our HR team.</p>
            
            <p>Best regards,<br>
            HR Team<br>
            Beeja HRM</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(application.email, subject, html);
  }

  // Send interview invitation email to candidate
  async sendInterviewInvitation(interview, application, job) {
    const subject = `Interview Invitation - ${job.title}`;
    const interviewDate = new Date(interview.scheduledDate);
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .highlight { background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
          .important { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Interview Invitation</h1>
          </div>
          <div class="content">
            <p>Dear ${application.firstName} ${application.lastName},</p>
            
            <p>Congratulations! We are pleased to invite you for an interview for the <strong>${job.title}</strong> position.</p>
            
            <div class="highlight">
              <h3>Interview Details:</h3>
              <ul>
                <li><strong>Position:</strong> ${job.title}</li>
                <li><strong>Interview Round:</strong> ${interview.round}</li>
                <li><strong>Date:</strong> ${interviewDate.toLocaleDateString()}</li>
                <li><strong>Time:</strong> ${interviewDate.toLocaleTimeString()}</li>
                <li><strong>Duration:</strong> ${interview.duration} minutes</li>
                <li><strong>Type:</strong> ${interview.type}</li>
                ${interview.location ? `<li><strong>Location:</strong> ${interview.location}</li>` : ''}
                ${interview.meetingLink ? `<li><strong>Meeting Link:</strong> <a href="${interview.meetingLink}">${interview.meetingLink}</a></li>` : ''}
              </ul>
            </div>
            
            <div class="important">
              <h3>Important Instructions:</h3>
              <ul>
                <li>Please confirm your attendance by replying to this email</li>
                <li>Bring a copy of your resume and any relevant documents</li>
                <li>Be prepared to discuss your experience and skills</li>
                <li>Arrive 10 minutes early for the interview</li>
                ${interview.type === 'Online' ? '<li>Test your internet connection and audio/video before the interview</li>' : ''}
              </ul>
            </div>
            
            <p>If you need to reschedule or have any questions, please contact us immediately.</p>
            
            <p>We look forward to meeting you!</p>
            
            <p>Best regards,<br>
            HR Team<br>
            Beeja HRM</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please reply to confirm your attendance.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(application.email, subject, html);
  }

  // Send interview notification to interviewer
  async sendInterviewerNotification(interview, application, job, interviewer) {
    const subject = `Interview Assigned - ${job.title} - ${application.firstName} ${application.lastName}`;
    const interviewDate = new Date(interview.scheduledDate);
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #17a2b8; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .highlight { background-color: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin: 15px 0; }
          .candidate-info { background-color: #e2e3e5; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Interview Assignment</h1>
          </div>
          <div class="content">
            <p>Dear ${interviewer.firstName} ${interviewer.lastName},</p>
            
            <p>You have been assigned to conduct an interview for the <strong>${job.title}</strong> position.</p>
            
            <div class="highlight">
              <h3>Interview Details:</h3>
              <ul>
                <li><strong>Position:</strong> ${job.title}</li>
                <li><strong>Interview Round:</strong> ${interview.round}</li>
                <li><strong>Date:</strong> ${interviewDate.toLocaleDateString()}</li>
                <li><strong>Time:</strong> ${interviewDate.toLocaleTimeString()}</li>
                <li><strong>Duration:</strong> ${interview.duration} minutes</li>
                <li><strong>Type:</strong> ${interview.type}</li>
                ${interview.location ? `<li><strong>Location:</strong> ${interview.location}</li>` : ''}
                ${interview.meetingLink ? `<li><strong>Meeting Link:</strong> <a href="${interview.meetingLink}">${interview.meetingLink}</a></li>` : ''}
              </ul>
            </div>
            
            <div class="candidate-info">
              <h3>Candidate Information:</h3>
              <ul>
                <li><strong>Name:</strong> ${application.firstName} ${application.lastName}</li>
                <li><strong>Email:</strong> ${application.email}</li>
                <li><strong>Phone:</strong> ${application.phoneNumber}</li>
                <li><strong>Experience:</strong> ${application.yearsOfExperience} years</li>
                <li><strong>Skills:</strong> ${application.technicalSkills.join(', ')}</li>
                <li><strong>Applied On:</strong> ${new Date(application.appliedAt).toLocaleDateString()}</li>
              </ul>
            </div>
            
            <p>Please log in to the system to view the candidate's complete profile and resume.</p>
            
            <p>After the interview, please submit your feedback through the system.</p>
            
            <p>If you have any questions or need to reschedule, please contact the HR team immediately.</p>
            
            <p>Best regards,<br>
            HR Team<br>
            Beeja HRM</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please contact HR for any changes.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(interviewer.email, subject, html);
  }

  // Send offer letter email to candidate
  async sendOfferLetter(offerLetter) {
    const subject = `Job Offer - ${offerLetter.jobInfo.title}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .highlight { background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
          .cta-button { background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
          .important { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
            <h2>Job Offer</h2>
          </div>
          <div class="content">
            <p>Dear ${offerLetter.candidateInfo.firstName} ${offerLetter.candidateInfo.lastName},</p>
            
            <p>We are delighted to extend an offer of employment for the position of <strong>${offerLetter.jobInfo.title}</strong> at our company.</p>
            
            <div class="highlight">
              <h3>Offer Summary:</h3>
              <ul>
                <li><strong>Position:</strong> ${offerLetter.jobInfo.title}</li>
                <li><strong>Department:</strong> ${offerLetter.jobInfo.department}</li>
                <li><strong>Location:</strong> ${offerLetter.jobInfo.location}</li>
                <li><strong>Employment Type:</strong> ${offerLetter.offerDetails.employmentType}</li>
                <li><strong>Work Mode:</strong> ${offerLetter.offerDetails.workMode}</li>
                <li><strong>CTC:</strong> ${offerLetter.offerDetails.salary.currency} ${offerLetter.offerDetails.salary.ctc.toLocaleString()}</li>
                <li><strong>Joining Date:</strong> ${new Date(offerLetter.offerDetails.joiningDate).toLocaleDateString()}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${offerLetter.secureLink}" class="cta-button">View & Respond to Offer Letter</a>
            </div>
            
            <div class="important">
              <h3>Important:</h3>
              <ul>
                <li>This offer is valid until <strong>${new Date(offerLetter.validUntil).toLocaleDateString()}</strong></li>
                <li>Please click the link above to view the complete offer letter</li>
                <li>You can accept or decline the offer through the secure link</li>
                <li>Contact us if you have any questions</li>
              </ul>
            </div>
            
            <p>We are excited about the possibility of you joining our team and look forward to your response.</p>
            
            <p>Best regards,<br>
            HR Team<br>
            Beeja HRM</p>
          </div>
          <div class="footer">
            <p>This offer letter link is secure and personalized for you. Do not share this link with others.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(offerLetter.candidateInfo.email, subject, html);
  }

  // Send application rejection email
  async sendRejectionEmail(application, job, reason = '') {
    const subject = `Application Update - ${job.title}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #6c757d; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application Update</h1>
          </div>
          <div class="content">
            <p>Dear ${application.firstName} ${application.lastName},</p>
            
            <p>Thank you for your interest in the <strong>${job.title}</strong> position and for taking the time to apply.</p>
            
            <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current requirements.</p>
            
            ${reason ? `<p><strong>Feedback:</strong> ${reason}</p>` : ''}
            
            <p>We encourage you to apply for future opportunities that match your skills and experience. We will keep your resume on file for future reference.</p>
            
            <p>Thank you again for your interest in our company.</p>
            
            <p>Best regards,<br>
            HR Team<br>
            Beeja HRM</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(application.email, subject, html);
  }

  // Send interview reminder email
  async sendInterviewReminder(interview, application, job) {
    const subject = `Interview Reminder - ${job.title} - Tomorrow`;
    const interviewDate = new Date(interview.scheduledDate);
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ffc107; color: #212529; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .highlight { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Interview Reminder</h1>
          </div>
          <div class="content">
            <p>Dear ${application.firstName} ${application.lastName},</p>
            
            <p>This is a friendly reminder about your upcoming interview for the <strong>${job.title}</strong> position.</p>
            
            <div class="highlight">
              <h3>Interview Details:</h3>
              <ul>
                <li><strong>Date:</strong> ${interviewDate.toLocaleDateString()}</li>
                <li><strong>Time:</strong> ${interviewDate.toLocaleTimeString()}</li>
                <li><strong>Type:</strong> ${interview.type}</li>
                ${interview.location ? `<li><strong>Location:</strong> ${interview.location}</li>` : ''}
                ${interview.meetingLink ? `<li><strong>Meeting Link:</strong> <a href="${interview.meetingLink}">${interview.meetingLink}</a></li>` : ''}
              </ul>
            </div>
            
            <p>Please ensure you are prepared and arrive on time. If you have any last-minute questions or need to reschedule, please contact us immediately.</p>
            
            <p>Good luck with your interview!</p>
            
            <p>Best regards,<br>
            HR Team<br>
            Beeja HRM</p>
          </div>
          <div class="footer">
            <p>This is an automated reminder email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(application.email, subject, html);
  }
}

module.exports = new EmailService();
