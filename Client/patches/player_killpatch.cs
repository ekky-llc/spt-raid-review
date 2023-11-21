using EFT;
using System.Reflection;
using Aki.Reflection.Patching;
using UnityEngine;
using Newtonsoft.Json;

namespace STATS
{
    public class STATS_Player_OnBeenKilledByAggressorPatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(Player).GetMethod("OnBeenKilledByAggressor", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
        }

        [PatchPostfix]
        private static void PatchPostFix(ref Player __instance, IPlayer aggressor, DamageInfo damageInfo, EBodyPart bodyPart, EDamageType lethalDamageType)
        {
            if (STATS.KillTracking.Value)
            {
                var newKill = new TrackingRaidKill
                {
                    time = STATS.stopwatch.ElapsedMilliseconds,
                    killedId = __instance.Profile.ProfileId,
                    killerId = aggressor.Profile.ProfileId,
                    distance = Vector3.Distance(aggressor.Position, __instance.Position),
                    weapon = damageInfo.Weapon == null ? "?" : damageInfo.Weapon.Name,
                    bodyPart = bodyPart.ToString(),
                    type = lethalDamageType.ToString()
                };

                Telemetry.Send("KILL", JsonConvert.SerializeObject(newKill));
            }
        }
    }
}
