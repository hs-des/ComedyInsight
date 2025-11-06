/**
 * Script to trigger a fake views campaign
 * Usage: ts-node src/scripts/trigger-campaign.ts <campaign-id>
 */

import dotenv from 'dotenv';
import { getViewQueue } from '../queue/queue-setup';

dotenv.config();

async function triggerCampaign() {
  const campaignId = process.argv[2];
  
  if (!campaignId) {
    console.error('Usage: ts-node src/scripts/trigger-campaign.ts <campaign-id>');
    process.exit(1);
  }

  try {
    const queue = getViewQueue();
    
    // Add campaign job to queue
    await queue.add('process-campaign', {
      campaignId,
      videoId: 'video-uuid-here',
      totalCount: 10000,
      durationDays: 30,
      pattern: 'steady',
      dailyLimit: 500,
    });

    console.log(`Campaign ${campaignId} added to queue`);
    
    // Close connection
    await queue.close();
    process.exit(0);
  } catch (error) {
    console.error('Error triggering campaign:', error);
    process.exit(1);
  }
}

triggerCampaign();

