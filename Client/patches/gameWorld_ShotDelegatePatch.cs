using Aki.Reflection.Patching;
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
    public class RAID_REVIEW_GameWorld_ShotDelegatePatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(GameWorld).GetMethod("ShotDelegate", BindingFlags.Instance | BindingFlags.Public);
        }

        [PatchPostfix]
        private static void PatchPostFix(ref GameWorld __instance, EftBulletClass shot)
        {
            try
            {
                if (__instance.LocationId == "hideout") return;

                var newTackingBallistic = new TrackingBallistic
                {
                    sessionId = RAID_REVIEW.sessionId,
                    profileId = shot.PlayerProfileID,
                    weaponId = shot.Weapon.Id,
                    ammoId = shot.Ammo.Id,
                    time = RAID_REVIEW.stopwatch.ElapsedMilliseconds,
                    source = shot.MasterOrigin,
                    target = shot.HitPoint
                };

                Telemetry.Send("Ballistic", JsonConvert.SerializeObject(newTackingBallistic));

                return;
            }

            catch (Exception ex)
            {
                Logger.LogError($"{ex}");
            }
        }

    }
}
