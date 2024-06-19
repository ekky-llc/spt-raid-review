using Aki.Reflection.Patching;
using Comfort.Common;
using EFT;
using EFT.Communications;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Reflection;

namespace RAID_REVIEW
{
    public class RAID_REVIEW_Player_OnGameStartedPatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(GameWorld).GetMethod("OnGameStarted", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
        }

        [PatchPostfix]
        private static void PatchPostFix(ref GameWorld __instance)
        {
            try {
                if (Singleton<GameWorld>.Instantiated)
                {
                    Logger.LogInfo("RAID_REVIEW :::: INFO :::: RAID Settings Loaded");

                    if (!RAID_REVIEW.MODS_SEARCHED)
                    {
                        Logger.LogInfo("RAID_REVIEW :::: INFO :::: Searching For Supported Mods");
                        RAID_REVIEW.MODS_SEARCHED = true;
                        if (RAID_REVIEW.DetectMod("me.sol.sain"))
                        {
                            Logger.LogInfo("RAID_REVIEW :::: INFO :::: Found 'SAIN' Enabling Plugin Features for SAIN.");
                            RAID_REVIEW.SOLARINT_SAIN__DETECTED = true;
                            RAID_REVIEW.RAID_REVIEW__DETECTED_MODS.Add("SAIN");
                        }
                        Logger.LogInfo("RAID_REVIEW :::: INFO :::: Finished Searching For Supported Mods");
                    }
                    Logger.LogInfo("RAID_REVIEW :::: INFO :::: RAID Settings Loaded");

                    RAID_REVIEW.inRaid = true;
                    RAID_REVIEW.stopwatch.Reset();
                    RAID_REVIEW.stopwatch.Start();

                    RAID_REVIEW.trackingRaid = new TrackingRaid
                    {
                        id = Guid.NewGuid().ToString("D"),
                        profileId = RAID_REVIEW.myPlayer.ProfileId,
                        time = DateTime.Now,
                        detectedMods = RAID_REVIEW.RAID_REVIEW__DETECTED_MODS.Count > 0 ? string.Join(",", RAID_REVIEW.RAID_REVIEW__DETECTED_MODS) : "",
                        location = RAID_REVIEW.gameWorld.LocationId,
                        timeInRaid = RAID_REVIEW.stopwatch.IsRunning ? RAID_REVIEW.stopwatch.ElapsedMilliseconds : 0
                    };

                    Telemetry.Send("START", JsonConvert.SerializeObject(RAID_REVIEW.trackingRaid));

                    // Reset Playerlist
                    RAID_REVIEW.trackingPlayers = new Dictionary<string, TrackingPlayer>();

                    var newTrackingPlayer = new TrackingPlayer();
                    newTrackingPlayer.profileId = RAID_REVIEW.myPlayer.ProfileId;
                    newTrackingPlayer.name = RAID_REVIEW.myPlayer.Profile.Nickname;
                    newTrackingPlayer.level = RAID_REVIEW.myPlayer.Profile.Info.Level;
                    newTrackingPlayer.team = RAID_REVIEW.myPlayer.Side;
                    newTrackingPlayer.group = 0;
                    newTrackingPlayer.spawnTime = RAID_REVIEW.stopwatch.ElapsedMilliseconds;
                    newTrackingPlayer.type = "HUMAN";
                    newTrackingPlayer.mod_SAIN_brain = "PLAYER";

                    RAID_REVIEW.trackingPlayers[newTrackingPlayer.profileId] = newTrackingPlayer;
                    Telemetry.Send("PLAYER", JsonConvert.SerializeObject(newTrackingPlayer));

                    RAID_REVIEW.inRaid = true;
                    Logger.LogInfo("RAID_REVIEW :::: INFO :::: RAID Information Populated");

                    NotificationManagerClass.DisplayMessageNotification("Raid Review Recording Started", ENotificationDurationType.Long);

                    return;
                }
                return;
            }

            catch (Exception ex)
            {
                Logger.LogError($"{ex.Message}");
            }
        }
    }
}
