using Aki.Reflection.Patching;
using EFT;
using Newtonsoft.Json;
using System.Reflection;

namespace STATS
{
    public class STATS_Player_OnGameSessionEndPatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(Player).GetMethod("OnGameSessionEnd", BindingFlags.Public | BindingFlags.Instance | BindingFlags.NonPublic);
        }

        [PatchPostfix]
        private static void PatchPostFix(ref Player __instance, ExitStatus exitStatus, float pastTime, string locationId, string exitName)
        {
            Logger.LogInfo("STATS :::: INFO :::: RAID Completed, Saving Tracking Data");

            STATS.stopwatch.Stop();
            STATS.tracking = false;
            STATS.trackingRaid.exitStatus = exitStatus;
            STATS.trackingRaid.exitName = exitName;
            STATS.trackingRaid.timeInRaid = STATS.stopwatch.ElapsedMilliseconds;

            Telemetry.Send("END", JsonConvert.SerializeObject(STATS.trackingRaid));
        }
    }
}
