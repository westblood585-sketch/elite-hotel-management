import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' })

const HOTEL_SYSTEM_PROMPT = `You are an AI assistant for Elite Hotel, a luxury hotel management system.
Your role is to help guests and staff with:
- Room availability and booking inquiries
- Check-in and check-out information
- Room service requests
- Hotel facilities and amenities information
- Billing and payment inquiries
- Complaint handling
- General hotel FAQs
- **App Navigation and Feature Usage**

IMPORTANT GUIDELINES:
1. Be professional, friendly, and helpful.
2. Keep responses concise and clear.
3. If you don't have specific information, suggest contacting the front desk.
4. For complex issues or complaints, offer to connect them with a human agent.
5. Always prioritize guest satisfaction.
6. Use the conversation context (including current page) to provide personalized responses.

APP NAVIGATION & FEATURES:
- **Dashboard (/dashboard)**: Overview of stay, quick actions.
- **Bookings (/bookings)**: View upcoming, past, and cancelled reservations.
- **Room Service (/room-service)**: Order food, drinks, and amenities.
- **Facilities (/facilities)**: Info on Pool, Gym, Spa.
- **Profile (/profile)**: User settings, password change.
- **Contact (/contact)**: Front desk info, location map.

HOTEL INFORMATION:
- Hotel Name: Elite Hotel
- Check-in Time: 3:00 PM
- Check-out Time: 11:00 AM
- Room Service: 24/7
- Facilities: Pool, Gym, Spa, Restaurant, Bar, Conference Rooms
- Contact: reception@elitehotel.com | +1-234-567-8900

When responding:
- If asked "Where can I find X?", refer to the specific App Page.
- If on a specific page (e.g., /room-service), offer help related to that context.
- Keep responses under 150 words unless more detail is specifically requested.`;

export interface ChatContext {
  userName?: string
  roomNumber?: string
  reservationId?: string
  checkInDate?: Date
  checkOutDate?: Date
  currentUrl?: string // [NEW] Context for App Awareness
  conversationHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
}

export class GeminiService {
  private chat: any

  async generateResponse(userMessage: string, context: ChatContext, image?: string): Promise<string> {
    try {
      // Build context-aware prompt
      let contextInfo = ''
      if (context.userName) contextInfo += `Guest Name: ${context.userName}\n`
      if (context.roomNumber) contextInfo += `Room Number: ${context.roomNumber}\n`
      if (context.reservationId) contextInfo += `Reservation ID: ${context.reservationId}\n`
      if (context.checkInDate) contextInfo += `Check-in Date: ${context.checkInDate}\n`
      if (context.checkOutDate) contextInfo += `Check-out Date: ${context.checkOutDate}\n`
      if (context.currentUrl) contextInfo += `Current App Page: ${context.currentUrl}\n`

      // Start or continue chat
      if (!this.chat) {
        const history = context.conversationHistory.length > 0 ? context.conversationHistory : []
        
        this.chat = model.startChat({
          history,
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
          },
        })
      }

      let result;
      
      const promptWithContext = contextInfo
        ? `${HOTEL_SYSTEM_PROMPT}\n\nCONTEXT:\n${contextInfo}\n\nUser Message: ${userMessage}`
        : `${HOTEL_SYSTEM_PROMPT}\n\nUser Message: ${userMessage}`

      if (image && this.chat) {
        // For multimodal with history, we might need a fresh model instance or handle it carefully
        // But for simplicity in this flow, if image is present, we might use generateContent directly 
        // as chat.sendMessage with images can be tricky depending on SDK version.
        // Let's rely on generateContent for single-turn multimodal if images are heavy, 
        // but try to maintain history if possible. 
        // For now, let's treat image messages as single-turn context-aware for safety or use chat if SDK supports.
        // Assuming SDK supports it via parts:
        
        // Remove Base64 header if present
        const base64Image = image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
        
        const imagePart = {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg', // assist with generic mime or detect
          },
        };

        result = await this.chat.sendMessage([promptWithContext, imagePart]);
      } else {
        result = await this.chat.sendMessage(promptWithContext);
      }

      const response = result.response
      const text = response.text()

      return text
    } catch (error) {
      console.error('Error generating Gemini response:', error)
      throw new Error('Failed to generate AI response')
    }
  }

  async detectIntent(userMessage: string): Promise<{ intent: string; confidence: number }> {
    try {
      const intentPrompt = `Analyze this hotel guest message and identify the primary intent. 
      
Possible intents:
- room_availability
- make_booking
- modify_booking
- cancel_booking
- check_in_info
- check_out_info
- room_service
- facilities_info
- billing_inquiry
- complaint
- general_faq
- other

Message: "${userMessage}"

Respond ONLY with: intent_name,confidence_score (e.g., room_availability,0.95)`

      const result = await model.generateContent(intentPrompt)
      const response = result.response.text().trim()
      
      const [intent, confidenceStr] = response.split(',')
      const confidence = parseFloat(confidenceStr) || 0.5

      return { intent: intent.trim(), confidence }
    } catch (error) {
      console.error('Error detecting intent:', error)
      return { intent: 'general_faq', confidence: 0.5 }
    }
  }

  resetChat(): void {
    this.chat = null
  }
}

export default new GeminiService()
