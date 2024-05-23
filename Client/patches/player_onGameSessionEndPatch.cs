using Aki.Reflection.Patching;
using EFT;
using Newtonsoft.Json;
using System;
using System.Reflection;

namespace STATS
{
    public class STATS_Player_OnGameSessionEndPatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(Player).GetMethod("OnGameSessionEnd");
        }

        [PatchPostfix]
        private static void PatchPostFix(ref Player __instance, ExitStatus exitStatus, float pastTime, string locationId, string exitName)
        {
            try { 
                Logger.LogInfo("STATS :::: INFO :::: RAID Completed, Saving Tracking Data");

                STATS.stopwatch.Stop();
                STATS.trackingRaid.playerId = STATS.myPlayer.ProfileId;
                STATS.tracking = false;
                STATS.trackingRaid.exitStatus = exitStatus;
                STATS.trackingRaid.exitName = exitName;
                STATS.trackingRaid.timeInRaid = STATS.stopwatch.ElapsedMilliseconds;
                STATS.stopwatch.Reset();

                Telemetry.Send("END", JsonConvert.SerializeObject(STATS.trackingRaid));

                // Reset
                STATS.inRaid = false;
                STATS.trackingRaid = new TrackingRaid();
            }

            catch (Exception ex)
            {
                Logger.LogError($"{ex.Message}");
            }
        }
    }
}
