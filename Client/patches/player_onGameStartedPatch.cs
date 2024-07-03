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
            try
            {
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

                    if (RAID_REVIEW.SOLARINT_SAIN__DETECTED)
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
                    RAID_REVIEW.SOLARINT_SAIN__DETECTED = true;
                    RAID_REVIEW.RAID_REVIEW__DETECTED_MODS.Add("SAIN");
                }
                Logger.LogInfo("RAID_REVIEW :::: INFO :::: Finished Searching For Supported Mods");
            }
            Logger.LogInfo("RAID_REVIEW :::: INFO :::: RAID Settings Loaded");
        }

        public static async Task CheckForSainComponents()
        {
            try
            {

                // Get the SAINBotController type from the loaded assembly
                Type sainBotControllerType = Type.GetType("SAIN.Components.SAINBotController, SAIN");
                Type botComponentType = Type.GetType("SAIN.Components.BotComponent, SAIN");
                Type ePersonalityType = Type.GetType("SAIN.Components.EPersonality, SAIN");

                if (sainBotControllerType == null)
                {
                    Logger.LogError("SAINBotController type not found.");
                    return;
                }

                while (RAID_REVIEW.searchingForSainComponents)
                {
                    await Task.Delay(5000);

                    if (RAID_REVIEW.sainBotController == null)
                    {
                        Logger.LogInfo("RAID_REVIEW :::: INFO :::: Looking For SAIN Bot Controller");
                        if (RAID_REVIEW.gameWorld != null)
                        {
                            // Use reflection to get the SAINBotController component
                            MethodInfo getComponentMethod = RAID_REVIEW.gameWorld.GetType().GetMethod("GetComponent", new Type[] { typeof(Type) });
                            RAID_REVIEW.sainBotController = getComponentMethod.Invoke(RAID_REVIEW.gameWorld, new object[] { sainBotControllerType });

                            if (RAID_REVIEW.sainBotController != null)
                                Logger.LogInfo("RAID_REVIEW :::: INFO :::: SAIN Bot Controller Found");
                            else
                                Logger.LogInfo("RAID_REVIEW :::: INFO :::: SAIN Bot Controller Not Found");
                        }
                        else
                        {
                            Logger.LogInfo("RAID_REVIEW :::: INFO :::: GameWorld Not Found");
                        }
                    }
                    else
                    {
                        // Get the Bots property using reflection
                        PropertyInfo botsProperty = sainBotControllerType.GetProperty("Bots");
                        var bots = botsProperty?.GetValue(RAID_REVIEW.sainBotController);

                        if (bots != null)
                        {
                            Logger.LogInfo("RAID_REVIEW :::: INFO :::: SAIN 'bots' found");
                        }

                        // Get the Values property of the Bots dictionary
                        var botValues = (IEnumerable)bots?.GetType().GetProperty("Values").GetValue(bots);

                        if (botValues != null)
                        {
                            Logger.LogInfo("RAID_REVIEW :::: INFO :::: SAIN 'botsValues' found");
                        }

                        foreach (var botComponent in botValues)
                        {
                            var playerProperty = botComponent.GetType().GetProperty("Player");
                            var player = playerProperty?.GetValue(botComponent);
                            var profileId = player?.GetType().GetProperty("ProfileId")?.GetValue(player) as string;

                            if (!RAID_REVIEW.updatedBots.ContainsKey(profileId) && RAID_REVIEW.trackingPlayers.ContainsKey(profileId))
                            {
                                var trackingPlayer = RAID_REVIEW.trackingPlayers[profileId];
                                var infoProperty = botComponent.GetType().GetProperty("Info");
                                var info = infoProperty?.GetValue(botComponent);

                                var personality = info?.GetType().GetProperty("Personality")?.GetValue(info);
                                if (personality != null && Enum.IsDefined(ePersonalityType, personality))
                                {
                                    trackingPlayer.mod_SAIN_brain = Enum.GetName(ePersonalityType, personality);
                                }
                                else
                                {
                                    trackingPlayer.mod_SAIN_brain = "UNKNOWN";
                                }

                                trackingPlayer.mod_SAIN_difficulty = info?.GetType().GetProperty("BotDifficulty")?.GetValue(info)?.ToString();

                                var profileProperty = info?.GetType().GetProperty("Profile");
                                var isPMC = (bool?)profileProperty?.GetType().GetProperty("IsPMC")?.GetValue(profileProperty) ?? false;

                                if (!isPMC)
                                {
                                    // Use reflection to call BotHelper.getBotType
                                    MethodInfo getBotTypeMethod = typeof(BotHelper).GetMethod("getBotType", BindingFlags.Static | BindingFlags.Public);
                                    if (getBotTypeMethod != null)
                                    {
                                        trackingPlayer.type = getBotTypeMethod.Invoke(null, new object[] { botComponent })?.ToString();
                                    }
                                }

                                RAID_REVIEW.trackingPlayers[trackingPlayer.profileId] = trackingPlayer;
                                RAID_REVIEW.updatedBots[trackingPlayer.profileId] = trackingPlayer;
                                Logger.LogInfo($"RAID_REVIEW :::: INFO :::: Updating player {trackingPlayer.name} with brain {trackingPlayer.mod_SAIN_brain}, type {trackingPlayer.type}, difficulty {trackingPlayer.mod_SAIN_difficulty}");
                                _ = Telemetry.Send("PLAYER_UPDATE", JsonConvert.SerializeObject(trackingPlayer));
                            }
                        }
                    }
                }
                return;
            }
            catch (Exception e)
            {
                Logger.LogFatal($"RAID_REVIEW :::: ERROR :::: {e}");
            }
        }

    }
}
