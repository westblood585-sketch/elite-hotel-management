export class ContentModerator {
  private static readonly PII_PATTERNS = {
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  };

  static async moderateInput(message: string): Promise<{
    clean: string;
    flagged: boolean;
    redactions: string[];
  }> {
    let cleanMessage = message;
    const redactions: string[] = [];

    // Detect and mask PII
    if (this.PII_PATTERNS.creditCard.test(message)) {
      cleanMessage = cleanMessage.replace(this.PII_PATTERNS.creditCard, '[CARD_REDACTED]');
      redactions.push('credit_card');
    }

    if (this.PII_PATTERNS.ssn.test(message)) {
      cleanMessage = cleanMessage.replace(this.PII_PATTERNS.ssn, '[SSN_REDACTED]');
      redactions.push('ssn');
    }

    // Log PII detection for security audit
    if (redactions.length > 0) {
      await this.logPIIDetection(message, redactions);
    }

    return {
      clean: cleanMessage,
      flagged: redactions.length > 0,
      redactions,
    };
  }

  private static async logPIIDetection(message: string, types: string[]) {
    // Log to security audit trail
    console.warn('[SECURITY] PII detected in message:', types);
  }
}
