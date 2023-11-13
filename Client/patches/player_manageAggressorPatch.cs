using EFT;
using System.Reflection;
using Aki.Reflection.Patching;
using UnityEngine;
using EFT.InventoryLogic;
using Newtonsoft.Json;

namespace STATS
{
    public class STATS_Player_ManageAggressorPatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(Player).GetMethod("ManageAggressor", BindingFlags.Public | BindingFlags.Instance | BindingFlags.NonPublic);
        }

        [PatchPostfix]
        private static void PatchPostFix(ref Player __instance, DamageInfo damageInfo, EBodyPart bodyPart, EHeadSegment? headSegment)
        {
            if (STATS.AggressionTracking.Value)
            {
                TrackingAggression newAggression = new TrackingAggression();

                newAggression.time = STATS.stopwatch.ElapsedMilliseconds;
                newAggression.aggressorId = damageInfo.Player.iPlayer.ProfileId;
                newAggression.aggresseId = __instance.Profile.ProfileId;
                newAggression.weapon = damageInfo.Weapon.Name;
                newAggression.bodyPart = damageInfo.BodyPartColliderType;
                newAggression.distance = Vector3.Distance(damageInfo.Player.iPlayer.Position, __instance.Position);

                Telemetry.Send("AGGRESSION", JsonConvert.SerializeObject(newAggression));
            }
        }
    }
}
