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

                STATS.tracking = false;
                STATS.inRaid = false;

                STATS.stopwatch.Stop();
                STATS.trackingRaid.playerId = __instance.ProfileId;
                STATS.trackingRaid.exitStatus = exitStatus;
                STATS.trackingRaid.exitName = exitName;
                STATS.trackingRaid.time = DateTime.Now;
                STATS.trackingRaid.timeInRaid = STATS.stopwatch.ElapsedMilliseconds;
                STATS.stopwatch.Reset();

                Telemetry.Send("END", JsonConvert.SerializeObject(STATS.trackingRaid));
            }

            catch (Exception ex)
            {
                Logger.LogError($"{ex.Message}");
            }
        }
    }
}
