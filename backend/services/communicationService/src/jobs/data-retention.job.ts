import cron from 'node-cron';
import Conversation from '../models/conversation.model';
import VideoChatSession from '../models/videoChatSession.model';

export const scheduleDataRetention = () => {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    try {
      // Delete old closed conversations
      const deletedConversations = await Conversation.deleteMany({
        status: 'closed',
        updatedAt: { $lt: ninetyDaysAgo },
      });

      // Delete old ended calls
      const deletedCalls = await VideoChatSession.deleteMany({
        status: 'ended',
        endTime: { $lt: ninetyDaysAgo },
      });

      console.log(`[Data Retention] Deleted ${deletedConversations.deletedCount} conversations and ${deletedCalls.deletedCount} calls`);
    } catch (error) {
      console.error('[Data Retention] Error:', error);
    }
  });
};
