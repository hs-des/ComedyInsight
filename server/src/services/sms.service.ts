/**
 * SMS Service - Abstracts SMS provider (Twilio)
 */

export interface SMSProvider {
  sendSMS(phone: string, message: string): Promise<void>;
}

export class TwilioSMSProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || '';

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.warn(
        '⚠️  Twilio credentials not configured. SMS will be logged to console in development.'
      );
    }
  }

  async sendSMS(phone: string, message: string): Promise<void> {
    // In development/testing, log to console
    if (process.env.NODE_ENV !== 'production' || !this.accountSid) {
      console.log(`📱 SMS to ${phone}: ${message}`);
      return;
    }

    try {
      // Dynamic import to avoid requiring twilio in dev
      const twilio = require('twilio');
      const client = twilio(this.accountSid, this.authToken);

      await client.messages.create({
        body: message,
        to: phone,
        from: this.fromNumber,
      });

      console.log(`✅ SMS sent to ${phone}`);
    } catch (error) {
      console.error('❌ Error sending SMS:', error);
      throw new Error('Failed to send SMS');
    }
  }
}

export class ConsoleSMSProvider implements SMSProvider {
  async sendSMS(phone: string, message: string): Promise<void> {
    console.log(`📱 [MOCK SMS] to ${phone}: ${message}`);
  }
}

export class SMSService {
  private provider: SMSProvider;

  constructor(provider?: SMSProvider) {
    this.provider = provider || this.getDefaultProvider();
  }

  private getDefaultProvider(): SMSProvider {
    // Use Twilio in production, console in development
    if (process.env.NODE_ENV === 'production') {
      return new TwilioSMSProvider();
    }
    return new ConsoleSMSProvider();
  }

  async sendOTP(phone: string, code: string): Promise<void> {
    const message = `Your ComedyInsight verification code is: ${code}. Valid for 5 minutes.`;
    await this.provider.sendSMS(phone, message);
  }
}

// Singleton instance
export const smsService = new SMSService();

