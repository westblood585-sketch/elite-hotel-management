import cron from 'node-cron';
import VideoChatSession from '../models/videoChatSession.model';

export const scheduleCallCleanup = () => {
    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        try {
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

            // 1. Mark 'pending' calls older than 15 mins as 'missed'
            const missedCalls = await VideoChatSession.updateMany(
                {
                    status: 'pending',
                    createdAt: { $lt: fifteenMinutesAgo }
                },
                {
                    $set: {
                        status: 'missed',
                        endTime: new Date(),
                        metadata: { reason: 'auto-cleanup: timeout (pending)' }
                    }
                }
            );

            // 2. Mark 'active' calls older than 2 hours as 'ended'
            const staleCalls = await VideoChatSession.updateMany(
                {
                    status: 'active',
                    startTime: { $lt: twoHoursAgo }
                },
                {
                    $set: {
                        status: 'ended',
                        endTime: new Date(),
                        metadata: { reason: 'auto-cleanup: timeout (stale)' }
                    }
                }
            );

            if (missedCalls.modifiedCount > 0 || staleCalls.modifiedCount > 0) {
                 console.log(`[Call Cleanup] Marked ${missedCalls.modifiedCount} calls as missed and ${staleCalls.modifiedCount} calls as ended.`);
            }

        } catch (error) {
            console.error('[Call Cleanup] Error:', error);
        }
    });

    console.log('✅ Call cleanup job scheduled');
};
