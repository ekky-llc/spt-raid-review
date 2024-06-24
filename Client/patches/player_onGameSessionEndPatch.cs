using Aki.Reflection.Patching;
using EFT;
using EFT.Communications;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace RAID_REVIEW
{
    public class RAID_REVIEW_Player_OnGameSessionEndPatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(Player).GetMethod("OnGameSessionEnd");
        }

        [PatchPostfix]
        private static void PatchPostFix(ref Player __instance, ExitStatus exitStatus, float pastTime, string locationId, string exitName)
        {
            try { 
                Logger.LogInfo("RAID_REVIEW :::: INFO :::: RAID Completed, Saving Tracking Data");

                RAID_REVIEW.tracking = false;
                RAID_REVIEW.inRaid = false;

                RAID_REVIEW.stopwatch.Stop();
                RAID_REVIEW.trackingRaid.sessionId = RAID_REVIEW.sessionId;
                RAID_REVIEW.trackingRaid.profileId = __instance.ProfileId;
                RAID_REVIEW.trackingRaid.exitStatus = exitStatus;
                RAID_REVIEW.trackingRaid.exitName = exitName;
                RAID_REVIEW.trackingRaid.time = DateTime.Now;
                RAID_REVIEW.trackingRaid.timeInRaid = RAID_REVIEW.stopwatch.ElapsedMilliseconds;
                RAID_REVIEW.stopwatch.Reset();

                Telemetry.Send("PLAYER_CHECK", JsonConvert.SerializeObject(RAID_REVIEW.trackingPlayers.Values));
                Telemetry.Send("END", JsonConvert.SerializeObject(RAID_REVIEW.trackingRaid));

                NotificationManagerClass.DisplayMessageNotification("Raid Review Recording Completed", ENotificationDurationType.Long);
            }

            catch (Exception ex)
            {
                Logger.LogError($"{ex.Message}");
            }

            finally 
            {
                    RAID_REVIEW.trackingPlayers = new Dictionary<string, TrackingPlayer>();
            }
        }
    }
}
