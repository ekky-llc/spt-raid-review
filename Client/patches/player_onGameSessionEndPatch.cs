using Aki.Reflection.Patching;
using EFT;
using EFT.Communications;
using Newtonsoft.Json;
using System;
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
                RAID_REVIEW.trackingRaid.profileId = __instance.ProfileId;
                RAID_REVIEW.trackingRaid.exitStatus = exitStatus;
                RAID_REVIEW.trackingRaid.exitName = exitName;
                RAID_REVIEW.trackingRaid.time = DateTime.Now;
                RAID_REVIEW.trackingRaid.timeInRaid = RAID_REVIEW.stopwatch.ElapsedMilliseconds;
                RAID_REVIEW.stopwatch.Reset();

                Telemetry.Send("END", JsonConvert.SerializeObject(RAID_REVIEW.trackingRaid));

                NotificationManagerClass.DisplayMessageNotification("Raid Review Recording Completed", ENotificationDurationType.Long);
            }

            catch (Exception ex)
            {
                Logger.LogError($"{ex.Message}");
            }
        }
    }
}
