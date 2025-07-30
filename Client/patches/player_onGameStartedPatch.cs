using SPT.Reflection.Patching;
using Comfort.Common;
using EFT;
using EFT.Communications;
using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Reflection;
using System.Threading.Tasks;

namespace RAID_REVIEW
{

    public class RAID_REVIEW_Player_OnGameStartedPatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(GameWorld).GetMethod("OnGameStarted", BindingFlags.Instance | BindingFlags.Public);
        }

        [PatchPostfix]
        private static void PatchPostFix(ref GameWorld __instance)
        {

            try
            {
                if (__instance.LocationId == "hideout") return;

                Logger.LogInfo("RAID_REVIEW :::: INFO :::: RAID Settings Loaded");

                // Check for installed mods
                Integrations.ModCheck();

                RAID_REVIEW.stopwatch.Reset();
                RAID_REVIEW.stopwatch.Start();

                RAID_REVIEW.gameWorld = __instance;
                RAID_REVIEW.trackingRaid = new TrackingRaid();

                RAID_REVIEW.trackingRaid.sessionId = RAID_REVIEW.sessionId;
                RAID_REVIEW.trackingRaid.profileId = RAID_REVIEW.myPlayer.ProfileId;
                RAID_REVIEW.trackingRaid.time = DateTime.Now;
                RAID_REVIEW.trackingRaid.detectedMods = RAID_REVIEW.RAID_REVIEW__DETECTED_MODS.Count > 0 ? string.Join(",", RAID_REVIEW.RAID_REVIEW__DETECTED_MODS) : "";
                RAID_REVIEW.trackingRaid.location = __instance.LocationId;
                RAID_REVIEW.trackingRaid.type = RAID_REVIEW.myPlayer.Side == EPlayerSide.Savage ? "SCAV" : "PMC";
                RAID_REVIEW.trackingRaid.timeInRaid = RAID_REVIEW.stopwatch.IsRunning ? RAID_REVIEW.stopwatch.ElapsedMilliseconds : 0;

                Telemetry.Send("START", JsonConvert.SerializeObject(RAID_REVIEW.trackingRaid));
                TrackingPlayer newTrackingPlayer = new TrackingPlayer();

                newTrackingPlayer.sessionId = RAID_REVIEW.sessionId;
                newTrackingPlayer.profileId = RAID_REVIEW.myPlayer.ProfileId;
                newTrackingPlayer.name = RAID_REVIEW.myPlayer.Profile.Nickname;
                newTrackingPlayer.level = RAID_REVIEW.myPlayer.Profile.Info.Level;
                newTrackingPlayer.team = RAID_REVIEW.myPlayer.Side;
                newTrackingPlayer.group = 0;
                newTrackingPlayer.spawnTime = RAID_REVIEW.stopwatch.ElapsedMilliseconds;
                newTrackingPlayer.type = "HUMAN";
                newTrackingPlayer.mod_SAIN_brain = "PLAYER";
                newTrackingPlayer.mod_SAIN_difficulty = ""; 

                RAID_REVIEW.trackingPlayers[newTrackingPlayer.profileId] = newTrackingPlayer;

                Telemetry.Send("PLAYER", JsonConvert.SerializeObject(newTrackingPlayer));

                RAID_REVIEW.inRaid = true;
                Logger.LogInfo("RAID_REVIEW :::: INFO :::: RAID Information Populated");

                if (RAID_REVIEW.RecordingNotification.Value && RAID_REVIEW.WebSocketConnected)
                {
                    NotificationManagerClass.DisplayMessageNotification("Raid Review Recording Started", ENotificationDurationType.Long);
                }

                if (RAID_REVIEW.SOLARINT_SAIN__DETECTED)
                {
                    Logger.LogInfo("RAID_REVIEW :::: INFO :::: SAIN Detected, Starting check for SAIN Components");
                    RAID_REVIEW.searchingForSainComponents = true;
                    _ = SAIN_Integration.CheckForSainComponents(false);
                }

                BotChecker.BotCheckLoop(false);

                return;
            }

            catch (Exception ex)
            {
                Logger.LogError($"{ex}");
            }
        }

    }
}
