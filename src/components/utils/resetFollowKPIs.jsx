/**
 * Reset all follow KPIs for the current user
 * This will:
 * 1. Delete all Follow records where user is follower or followee
 * 2. Reset metrics_following and metrics_followers to 0
 */
export async function resetFollowKPIs() {
  try {
    const currentUser = await User.me();
    
    console.log('[Reset] Starting follow KPI reset for user:', currentUser.id);
    
    // 1. Get all follow records involving this user
    const allFollows = await Follow.list();
    const userFollows = allFollows.filter(f => 
      f.follower_id === currentUser.id || f.followee_id === currentUser.id
    );
    
    console.log('[Reset] Found', userFollows.length, 'follow records to delete');
    
    // 2. Delete all follow records
    for (const follow of userFollows) {
      await Follow.delete(follow.id);
    }
    
    console.log('[Reset] Deleted all follow records');
    
    // 3. Reset KPIs to 0
    await User.update(currentUser.id, {
      metrics_following: 0,
      metrics_followers: 0
    });
    
    console.log('[Reset] Reset KPIs to 0');
    
    // 4. Also update via auth.updateMe to ensure consistency
    await User.updateMe({
      metrics_following: 0,
      metrics_followers: 0
    });
    
    console.log('[Reset] ✅ Follow KPIs reset complete');
    
    return {
      success: true,
      deletedRecords: userFollows.length
    };
  } catch (error) {
    console.error('[Reset] ❌ Error resetting follow KPIs:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Auto-run on import (dev only)
import { Follow, User } from "@/api/entities";
if (typeof window !== 'undefined') {
  window.resetFollowKPIs = resetFollowKPIs;
  console.log('[Reset] Run window.resetFollowKPIs() to reset all follow data');
}