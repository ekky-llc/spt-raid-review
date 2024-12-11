using SPT.Reflection.Patching;
using Comfort.Common;
using EFT;
using EFT.Ballistics;
using EFT.Communications;
using EFT.InventoryLogic;
using JetBrains.Annotations;
using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Reflection;
using System.Threading.Tasks;
using UnityEngine;

namespace RAID_REVIEW
{
    public class RAID_REVIEW_ClientGameWorld_ShotDelegatePatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(ClientGameWorld).GetMethod("ShotDelegate", BindingFlags.Instance | BindingFlags.Public);
        }

        [PatchPostfix]
        private static void PatchPostFix(ref ClientGameWorld __instance, EftBulletClass shotResult)
        {
            try
            {
                // If in the 'hideout', or 'ballistics tacki
                if (__instance.LocationId == "hideout" || !RAID_REVIEW.BallisticsTracking.Value) return;

                var hitPlayerId = shotResult?.HittedBallisticCollider?.gameObject?.GetComponentInParent<Player>()?.ProfileId;
                var newTackingBallistic = new TrackingBallistic
                {
                    sessionId = RAID_REVIEW.sessionId,
                    profileId = shotResult.PlayerProfileID,
                    weaponId = shotResult.Weapon.Id,
                    ammoId = shotResult.Ammo.Id,
                    time = RAID_REVIEW.stopwatch.ElapsedMilliseconds,
                    hitPlayerId = hitPlayerId ?? null,
                    source = JsonConvert.SerializeObject(shotResult.MasterOrigin),
                    target = JsonConvert.SerializeObject(shotResult.HitPoint)
                };

                Telemetry.Send("BALLISTIC", JsonConvert.SerializeObject(newTackingBallistic));

                return;
            }

            catch (Exception ex)
            {
                Logger.LogError($"{ex}");
            }
        }

    }
}
