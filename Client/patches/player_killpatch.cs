using EFT;
using System.Reflection;
using Aki.Reflection.Patching;
using UnityEngine;
using Newtonsoft.Json;
using System;

namespace RAID_REVIEW
{
    public class RAID_REVIEW_Player_OnBeenKilledByAggressorPatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(Player).GetMethod("OnBeenKilledByAggressor", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
        }

        [PatchPostfix]
        private static void PatchPostFix(ref Player __instance, IPlayer aggressor, DamageInfo damageInfo, EBodyPart bodyPart, EDamageType lethalDamageType)
        {
            if (__instance.Location == "hideout") return;

            try
            {
                if (RAID_REVIEW.KillTracking.Value)
                {
                    var newKill = new TrackingRaidKill
                    {
                        sessionId = RAID_REVIEW.sessionId,
                        time = RAID_REVIEW.stopwatch.ElapsedMilliseconds,
                        profileId = aggressor.ProfileId,
                        killedId = __instance.ProfileId,
                        distance = Vector3.Distance(aggressor.Position, __instance.Position),
                        weapon = damageInfo.Weapon == null ? "?" : damageInfo.Weapon.Name,
                        bodyPart = bodyPart.ToString(),
                        type = lethalDamageType.ToString(),
                        positionKiller = aggressor.Position.ToJson(),
                        positionKilled = __instance.Position.ToJson(),
                    };

                    Telemetry.Send("KILL", JsonConvert.SerializeObject(newKill));
                }
            }

            catch (Exception ex)
            {
                Logger.LogError($"{ex.Message}");
            }
        }
    }
}
