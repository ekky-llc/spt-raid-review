using Aki.Reflection.Patching;
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
            return typeof(GameWorld).GetMethod("OnGameStarted", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
        }

        [PatchPostfix]
        private static void PatchPostFix(ref GameWorld __instance)
        {
            try {
                if (__instance.LocationId != "hideout")
                {
                    Logger.LogInfo("RAID_REVIEW :::: INFO :::: RAID Settings Loaded");

                    ModCheck();

                    RAID_REVIEW.inRaid = true;
                    RAID_REVIEW.stopwatch.Reset();
                    RAID_REVIEW.stopwatch.Start();

                    RAID_REVIEW.trackingRaid = new TrackingRaid
                    {
                        sessionId = RAID_REVIEW.sessionId,
                        profileId = RAID_REVIEW.myPlayer.ProfileId,
                        time = DateTime.Now,
                        detectedMods = RAID_REVIEW.RAID_REVIEW__DETECTED_MODS.Count > 0 ? string.Join(",", RAID_REVIEW.RAID_REVIEW__DETECTED_MODS) : "",
                        location = RAID_REVIEW.gameWorld.LocationId,
                        timeInRaid = RAID_REVIEW.stopwatch.IsRunning ? RAID_REVIEW.stopwatch.ElapsedMilliseconds : 0
                    };

                    Telemetry.Send("START", JsonConvert.SerializeObject(RAID_REVIEW.trackingRaid));

                    var newTrackingPlayer = new TrackingPlayer
                    {
                        sessionId = RAID_REVIEW.sessionId,
                        profileId = RAID_REVIEW.myPlayer.ProfileId,
                        name = RAID_REVIEW.myPlayer.Profile.Nickname,
                        level = RAID_REVIEW.myPlayer.Profile.Info.Level,
                        team = RAID_REVIEW.myPlayer.Side,
                        group = 0,
                        spawnTime = RAID_REVIEW.stopwatch.ElapsedMilliseconds,
                        type = "HUMAN",
                        mod_SAIN_brain = "PLAYER",
                        mod_SAIN_difficulty = ""
                    };

                    RAID_REVIEW.trackingPlayers[newTrackingPlayer.profileId] = newTrackingPlayer;
                    Telemetry.Send("PLAYER", JsonConvert.SerializeObject(newTrackingPlayer));

                    RAID_REVIEW.inRaid = true;
                    Logger.LogInfo("RAID_REVIEW :::: INFO :::: RAID Information Populated");

                    NotificationManagerClass.DisplayMessageNotification("Raid Review Recording Started", ENotificationDurationType.Long);

                    if(RAID_REVIEW.SOLARINT_SAIN__DETECTED)
                    {
                        RAID_REVIEW.searchingForSainComponents = true;
                        _ = CheckForSainComponents();
                    }

                    return;
                }
                return;
            }

            catch (Exception ex)
            {
                Logger.LogError($"{ex.Message}");
            }
        }

        private static void ModCheck()
        {
            if (!RAID_REVIEW.MODS_SEARCHED)
            {
                Logger.LogInfo("RAID_REVIEW :::: INFO :::: Searching For Supported Mods");
                RAID_REVIEW.MODS_SEARCHED = true;
                if (RAID_REVIEW.DetectMod("me.sol.sain"))
                {
                    Logger.LogInfo("RAID_REVIEW :::: INFO :::: Found 'SAIN' Enabling Plugin Features for SAIN.");
                    SAINInterop.Init();
                    RAID_REVIEW.SOLARINT_SAIN__DETECTED = true;
                    RAID_REVIEW.RAID_REVIEW__DETECTED_MODS.Add("SAIN");
                }
                Logger.LogInfo("RAID_REVIEW :::: INFO :::: Finished Searching For Supported Mods");
            }
            Logger.LogInfo("RAID_REVIEW :::: INFO :::: RAID Settings Loaded");
        }

        public static async Task CheckForSainComponents()
        {
            while (RAID_REVIEW.searchingForSainComponents)
            {
                await Task.Delay(10000);

                /* Look for 'SAINBotController' using reflection */
                if (RAID_REVIEW.sainBotController == null) {
                    Logger.LogInfo("RAID_REVIEW :::: INFO :::: Looking For SAIN Bot Controller");
                    SAINInterop.Init();
                }
                else {
                    Logger.LogInfo("RAID_REVIEW :::: INFO :::: Found SAIN Bot Controller");
                    var _test = RAID_REVIEW.sainBotController;
                    Console.WriteLine(_test);
                }

            }
            return;
        }
    }
}
