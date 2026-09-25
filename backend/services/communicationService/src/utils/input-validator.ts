import Joi from 'joi';
import xss from 'xss';

export class InputValidator {
  private static messageSchema = Joi.object({
    conversationId: Joi.string().required(),
    message: Joi.string().min(1).max(1000).required(),
    image: Joi.string().optional().allow(null, ''),
  });

  static sanitizeMessage(message: string): string {
    // Remove HTML/script tags
    return xss(message, {
      whiteList: {}, // No HTML allowed
      stripIgnoreTag: true,
    });
  }

  static validateMessageRequest(data: any) {
    const { error, value } = this.messageSchema.validate(data);
    if (error) {
      throw new Error(error.details[0].message);
    }
    
    // Sanitize message content
    value.message = this.sanitizeMessage(value.message);
    return value;
  }
}
