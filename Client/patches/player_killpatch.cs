using EFT;
using System.Reflection;
using Aki.Reflection.Patching;
using UnityEngine;
using Newtonsoft.Json;

namespace STATS
{
    public class STATS_Player_KillPatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(Player).GetMethod("OnBeenKilledByAggressor", BindingFlags.Instance | BindingFlags.NonPublic);
        }

        [PatchPostfix]
        private static void PatchPostFix(ref Player __instance, Player aggressor, DamageInfo damageInfo, EBodyPart bodyPart, EDamageType lethalDamageType)
        {
            if (STATS.KillTracking.Value)
            {
                var newKill = new TrackingRaidKill();

                newKill.time = STATS.stopwatch.ElapsedMilliseconds;
                newKill.killedId = __instance.Profile.ProfileId;
                newKill.killerId = aggressor.Profile.ProfileId;
                newKill.distance = Vector3.Distance(aggressor.Position, __instance.Position);
                newKill.weapon = damageInfo.Weapon == null ? "?" : damageInfo.Weapon.Name;
                newKill.bodyPart = bodyPart.ToString();
                newKill.type = lethalDamageType.ToString();

                Telemetry.Send("KILL", JsonConvert.SerializeObject(newKill));
            }
        }
    }
}
