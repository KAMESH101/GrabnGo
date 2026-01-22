import { NotificationLog } from '../types';

/**
 * Send SMS notification (Demo mode using mock SMS gateway)
 * In production, this would use services like Twilio, MSG91, or AWS SNS
 */
export const sendSMS = async (
  phoneNumber: string,
  message: string,
  bookingId: string
): Promise<NotificationLog> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const log: NotificationLog = {
    id: `sms_${Date.now()}`,
    bookingId,
    type: 'sms',
    recipient: phoneNumber,
    message,
    status: 'sent',
    sentAt: new Date(),
  };

  console.log('[DEMO MODE] SMS Sent via Mock Gateway:', {
    to: phoneNumber,
    message,
    booking_id: bookingId,
    provider: 'MSG91 (Demo)',
    status: 'delivered'
  });

  return log;
};

/**
 * Send Email notification (Demo mode using mock email service)
 * In production, this would use services like SendGrid, AWS SES, or Mailgun
 */
export const sendEmail = async (
  email: string,
  subject: string,
  body: string,
  bookingId: string
): Promise<NotificationLog> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const log: NotificationLog = {
    id: `email_${Date.now()}`,
    bookingId,
    type: 'email',
    recipient: email,
    message: `${subject}\n\n${body}`,
    status: 'sent',
    sentAt: new Date(),
  };

  console.log('[DEMO MODE] Email Sent via Mock Service:', {
    to: email,
    subject,
    booking_id: bookingId,
    provider: 'SendGrid (Demo)',
    status: 'delivered'
  });

  return log;
};

/**
 * Send booking confirmation notifications (SMS + Email)
 */
export const sendBookingConfirmation = async (
  customerName: string,
  customerPhone: string,
  customerEmail: string,
  bookingId: string,
  productTitle: string,
  startDate: string,
  endDate: string,
  totalAmount: number
): Promise<{ sms: NotificationLog; email: NotificationLog }> => {
  // SMS Message
  const smsMessage = `Dear ${customerName}, Your booking for ${productTitle} is confirmed! Booking ID: ${bookingId}. Pickup: ${startDate}. Amount: ₹${totalAmount}. - GrabNGo`;

  // Email Content
  const emailSubject = `Booking Confirmation - ${bookingId}`;
  const emailBody = `
Dear ${customerName},

Your booking has been successfully confirmed!

Booking Details:
- Booking ID: ${bookingId}
- Product: ${productTitle}
- Pickup Date: ${startDate}
- Return Date: ${endDate}
- Total Amount: ₹${totalAmount} (including GST)

Please carry a valid ID proof at the time of pickup.

Thank you for choosing GrabNGo!

Best regards,
GrabNGo Team
Chennai, Tamil Nadu
  `.trim();

  const [sms, email] = await Promise.all([
    sendSMS(customerPhone, smsMessage, bookingId),
    sendEmail(customerEmail, emailSubject, emailBody, bookingId),
  ]);

  return { sms, email };
};

/**
 * Send owner approval notification
 */
export const sendOwnerApprovalNotification = async (
  ownerPhone: string,
  ownerEmail: string,
  bookingId: string,
  productTitle: string,
  customerName: string
): Promise<{ sms: NotificationLog; email: NotificationLog }> => {
  const smsMessage = `New booking request for ${productTitle} from ${customerName}. Booking ID: ${bookingId}. Please review and approve. - GrabNGo`;

  const emailSubject = `New Booking Request - ${bookingId}`;
  const emailBody = `
Dear Owner,

You have received a new booking request!

Booking Details:
- Booking ID: ${bookingId}
- Product: ${productTitle}
- Customer: ${customerName}

Please log in to your dashboard to review and approve this booking.

Best regards,
GrabNGo Team
  `.trim();

  const [sms, email] = await Promise.all([
    sendSMS(ownerPhone, smsMessage, bookingId),
    sendEmail(ownerEmail, emailSubject, emailBody, bookingId),
  ]);

  return { sms, email };
};

/**
 * Send booking approved notification to customer
 */
export const sendBookingApprovedNotification = async (
  customerPhone: string,
  customerEmail: string,
  bookingId: string,
  productTitle: string,
  pickupDate: string
): Promise<{ sms: NotificationLog; email: NotificationLog }> => {
  const smsMessage = `Great news! Your booking for ${productTitle} has been approved by the owner. Booking ID: ${bookingId}. Pickup: ${pickupDate}. - GrabNGo`;

  const emailSubject = `Booking Approved - ${bookingId}`;
  const emailBody = `
Dear Customer,

Your booking has been approved by the owner!

Booking Details:
- Booking ID: ${bookingId}
- Product: ${productTitle}
- Pickup Date: ${pickupDate}

Please be ready with your ID proof for verification at pickup.

Best regards,
GrabNGo Team
  `.trim();

  const [sms, email] = await Promise.all([
    sendSMS(customerPhone, smsMessage, bookingId),
    sendEmail(customerEmail, emailSubject, emailBody, bookingId),
  ]);

  return { sms, email };
};

/**
 * Send booking rejection notification to customer
 */
export const sendBookingRejectionNotification = async (
  customerPhone: string,
  customerEmail: string,
  bookingId: string,
  productTitle: string,
  reason: string
): Promise<{ sms: NotificationLog; email: NotificationLog }> => {
  const smsMessage = `Your booking for ${productTitle} has been declined. Booking ID: ${bookingId}. Full refund will be processed in 3-5 business days. - GrabNGo`;

  const emailSubject = `Booking Declined - ${bookingId}`;
  const emailBody = `
Dear Customer,

Unfortunately, your booking request has been declined by the owner.

Booking Details:
- Booking ID: ${bookingId}
- Product: ${productTitle}
- Reason: ${reason}

Your payment will be fully refunded to your original payment method within 3-5 business days.

We apologize for the inconvenience. Please explore other available products on GrabNGo.

Best regards,
GrabNGo Team
  `.trim();

  const [sms, email] = await Promise.all([
    sendSMS(customerPhone, smsMessage, bookingId),
    sendEmail(customerEmail, emailSubject, emailBody, bookingId),
  ]);

  return { sms, email };
};

/**
 * Send rental completion notification
 */
export const sendRentalCompletionNotification = async (
  customerPhone: string,
  customerEmail: string,
  bookingId: string,
  productTitle: string,
  depositAmount: number
): Promise<{ sms: NotificationLog; email: NotificationLog }> => {
  const smsMessage = `Thank you for using GrabNGo! Your rental for ${productTitle} is completed. Security deposit of ₹${depositAmount} will be refunded in 3-5 business days. Booking ID: ${bookingId}`;

  const emailSubject = `Rental Completed - ${bookingId}`;
  const emailBody = `
Dear Customer,

Your rental has been successfully completed!

Booking Details:
- Booking ID: ${bookingId}
- Product: ${productTitle}
- Security Deposit: ₹${depositAmount} (will be refunded in 3-5 business days)

Thank you for choosing GrabNGo. We hope to serve you again!

Best regards,
GrabNGo Team
  `.trim();

  const [sms, email] = await Promise.all([
    sendSMS(customerPhone, smsMessage, bookingId),
    sendEmail(customerEmail, emailSubject, emailBody, bookingId),
  ]);

  return { sms, email };
};
