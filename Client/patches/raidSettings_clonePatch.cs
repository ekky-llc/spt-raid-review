using Aki.Reflection.Patching;
using EFT;
using Newtonsoft.Json;
using System;
using System.Reflection;

namespace STATS
{
    public class STATS_RaidSettings_ClonePatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(RaidSettings).GetMethod("Clone", BindingFlags.Public | BindingFlags.Instance | BindingFlags.NonPublic);
        }

        [PatchPostfix]
        private static void PatchPostFix(ref RaidSettings __instance)
        {
            if (__instance.LocationId == null)
                return;

            Logger.LogInfo("STATS :::: INFO :::: RAID Settings Loaded");

            STATS.trackingRaid.id = Guid.NewGuid().ToString("D");
            STATS.trackingRaid.time = DateTime.Now;
            STATS.trackingRaid.location = __instance.LocationId;
            STATS.trackingRaid.timeInRaid = STATS.stopwatch.IsRunning ? STATS.stopwatch.ElapsedMilliseconds : 0;

            Telemetry.Send("START", JsonConvert.SerializeObject(STATS.trackingRaid));

            Logger.LogInfo("STATS :::: INFO :::: RAID Information Populated");
        }
    }
}
