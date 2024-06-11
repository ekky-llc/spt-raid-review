using EFT;
using System;
using System.Diagnostics;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using BepInEx;
using UnityEngine;
using Comfort.Common;
using Newtonsoft.Json;
using BepInEx.Configuration;
using System.IO;
using System.Reflection;
using System.Numerics;
using Vector3 = UnityEngine.Vector3;
using BepInEx.Bootstrap;
using SAIN;
using SAIN.Plugin;
using SAIN.SAINComponent;
using SAIN.Preset.GlobalSettings.Categories;

namespace STATS
{
    [BepInPlugin("STATS", "STATS", "0.0.1")]
    public class STATS : BaseUnityPlugin
    {
        // Framerate
        public static float updateInterval = 0.0f;
        public static float lastUpdateTime = 0.0f;

        // STATS
        public static bool inRaid = false;
        public static bool tracking = false;
        public static string STATS_WS_Server = "ws://127.0.0.1:7828";
        public static string STATS_HTTP_Server = "http://127.0.0.1:7829";
        public static List<string> STATS__DETECTED_MODS = new List<string>();
        public static Dictionary<string ,TrackingPlayer> trackingPlayers = new Dictionary<string, TrackingPlayer>();
        public static Dictionary<string, TrackingPlayer> deadPlayers = new Dictionary<string, TrackingPlayer>();
        public static Dictionary<string, Vector3> lastPlayerPosition = new Dictionary<string, Vector3>();
        public static TrackingRaid trackingRaid = new TrackingRaid();
        public static Stopwatch stopwatch = new Stopwatch();
        public static float PlayerTrackingInterval = 5f;

        // EFT
        public static GameWorld gameWorld;
        public static RaidSettings raid;
        public static Player myPlayer;
        public static IEnumerable<Player> allPlayers;

        // BepInEx
        public static string PluginFolder = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
        public static ConfigEntry<KeyboardShortcut> LaunchWebpageKey;
        public static ConfigEntry<bool> PlayerTracking;
        public static ConfigEntry<bool> KillTracking;
        public static ConfigEntry<bool> LootTracking;
        public static ConfigEntry<bool> ExtractTracking;
        public static GameObject Hook;

        // Other Mods
        public static bool SOLARINT_SAIN__DETECTED { get; private set; }

        void Awake()
        {
            Logger.LogInfo("STATS :::: INFO :::: Mod Loaded");

            LaunchWebpageKey = Config.Bind("Main", "Open Webpage Keybind", new KeyboardShortcut(KeyCode.F5), "Keybind to open the 'Stats Mod' webpage in your default browser.");
            PlayerTracking = Config.Bind<bool>("Tracking Settings", "Player Tracking", false, "Enables location tracking of players and bots.");
            KillTracking = Config.Bind<bool>("Tracking Settings", "Kill Tracking", true, "Enables location tracking of players and bots kills.");
            LootTracking = Config.Bind<bool>("Tracking Settings", "Loot Tracking", true, "Enables location tracking of players and bots looting activities.");

            Hook = new GameObject();

            Logger.LogInfo("STATS :::: INFO :::: Config Loaded");
            new STATS_menuTaskBar_setButtonsAvailablePatch().Enable();
            new STATS_Player_OnBeenKilledByAggressorPatch().Enable();
            new STATS_Player_OnItemAddedOrRemovedPatch().Enable();
            new STATS_Player_OnGameSessionEndPatch().Enable();
            Logger.LogInfo("STATS :::: INFO :::: Patches Loaded");

            Telemetry.Connect(STATS_WS_Server);
            Logger.LogInfo("STATS :::: INFO :::: Connected to backend");

            Logger.LogInfo("STATS :::: INFO :::: Searching For Supported Mods");
            if (Chainloader.PluginInfos.ContainsKey("me.sol.sain"))
            {
                Logger.LogInfo("STATS :::: INFO :::: Found 'SAIN' Enabling Plugin Features for SAIN.");
                SOLARINT_SAIN__DETECTED = true;
                STATS__DETECTED_MODS.Add("SAIN");
                ExtractTracking = Config.Bind<bool>("Tracking Settings", "Extract Tracking", true, "Enables location tracking of players and bots extraction activities.");
            }
            Logger.LogInfo("STATS :::: INFO :::: Finished Searching For Supported Mods");
        }
        void Update()
        {
            try
            {
                // UPDATE LIMITER
                if (updateInterval == 0.0f)
                    updateInterval = 1.0f / PlayerTrackingInterval;
                if (!(Time.time - lastUpdateTime >= updateInterval))
                    return;
                lastUpdateTime = Time.time;

                if (Input.GetKey(LaunchWebpageKey.Value.MainKey))
                {
                    Application.OpenURL(STATS_HTTP_Server);
                }

                // IF MAP NOT LOADED, RETURN
                if (!MapLoaded())
                    return;

                gameWorld = Singleton<GameWorld>.Instance;
                myPlayer = gameWorld?.MainPlayer;

                // IF IN MENU, RETURN
                if (gameWorld == null || myPlayer == null)
                    return;

                // RAID START
                if (!inRaid && !stopwatch.IsRunning)
                {
                    Logger.LogInfo("STATS :::: INFO :::: RAID Settings Loaded");

                    inRaid = true;
                    stopwatch.Reset();
                    stopwatch.Start();

                    STATS.trackingRaid = new TrackingRaid
                    {
                        id = Guid.NewGuid().ToString("D"),
                        playerId = STATS.myPlayer.ProfileId,
                        time = DateTime.Now,
                        detectedMods = STATS__DETECTED_MODS.Count > 0 ? string.Join(",", STATS__DETECTED_MODS) : "",
                        location = STATS.gameWorld.LocationId,
                        timeInRaid = STATS.stopwatch.IsRunning ? STATS.stopwatch.ElapsedMilliseconds : 0
                    };

                    Telemetry.Send("START", JsonConvert.SerializeObject(STATS.trackingRaid));

                    // Reset Playerlist
                    trackingPlayers = new Dictionary<string, TrackingPlayer>();

                    var newTrackingPlayer = new TrackingPlayer();
                    newTrackingPlayer.profileId = myPlayer.Profile.ProfileId;
                    newTrackingPlayer.name = myPlayer.Profile.Nickname;
                    newTrackingPlayer.level = myPlayer.Profile.Info.Level;
                    newTrackingPlayer.team = myPlayer.Side;
                    newTrackingPlayer.group = 0;
                    newTrackingPlayer.spawnTime = stopwatch.ElapsedMilliseconds;
                    newTrackingPlayer.type = "HUMAN";

                    trackingPlayers[newTrackingPlayer.profileId] = newTrackingPlayer;
                    Telemetry.Send("PLAYER", JsonConvert.SerializeObject(newTrackingPlayer));

                    inRaid = true;
                    Logger.LogInfo("STATS :::: INFO :::: RAID Information Populated");
                    return;
                }

                // PLAYER TRACKING LOOP
                IEnumerable<Player> allPlayers = gameWorld.AllPlayersEverExisted;

                long captureTime = stopwatch.ElapsedMilliseconds;
                foreach (Player player in allPlayers)
                {
                    if (player == null)
                        continue;

                    // Checks if a new player / bot has spawned into the raid...
                    TrackingPlayer trackingPlayer = new TrackingPlayer();
                    bool isBeingTracking = trackingPlayers.TryGetValue(player.Profile.ProfileId, out trackingPlayer);
                    if (!isBeingTracking)
                    {
                        trackingPlayer = new TrackingPlayer();
                        trackingPlayer.profileId = player.Profile.ProfileId;
                        trackingPlayer.name = player.Profile.Nickname;
                        trackingPlayer.level = player.Profile.Info.Level;
                        trackingPlayer.team = player.Side;
                        trackingPlayer.group = player?.AIData?.BotOwner?.BotsGroup?.Id ?? 0;
                        trackingPlayer.spawnTime = captureTime;
                        trackingPlayer.type = player.IsAI ? "BOT" : "HUMAN";

                        trackingPlayers[trackingPlayer.profileId] = trackingPlayer;
                        Telemetry.Send("PLAYER", JsonConvert.SerializeObject(trackingPlayer));
                    }

                    // Checks if a player / bot has died since the last check...
                    TrackingPlayer deadPlayer = new TrackingPlayer();
                    bool isDead = deadPlayers.TryGetValue(player.Profile.ProfileId, out deadPlayer);
                    if (!isDead)
                    {
                        if (!player.HealthController.IsAlive)
                        {
                            deadPlayers[player.Profile.ProfileId] = trackingPlayer;
                            continue;
                        }

                        // Checks a player position if they are still alive...
                        if (STATS.PlayerTracking.Value)
                        {
                            if (player == null || gameWorld == null)
                            {
                                Logger.LogWarning("Player or gameWorld is null, skipping this iteration.");
                                continue;  // Use continue if inside a loop, otherwise use return or break as needed
                            }

                            Vector3 playerPosition = player.Position;
                            if (playerPosition == null)
                            {
                                Logger.LogWarning("Player position is null, skipping this iteration.");
                                continue;
                            }

                            Vector3 playerFacing = player.LookDirection;
                            if (playerFacing == null)
                            {
                                Logger.LogWarning("Player look direction is null, skipping this iteration.");
                                continue;
                            }

                            Vector3 playerDirection = playerPosition - playerFacing;

                            playerDirection.Normalize();
                            Vector3 referenceVector = new Vector3(0, 0, 1);
                            referenceVector.Normalize();

                            float dotProduct = Vector3.Dot(playerDirection, referenceVector);
                            float angle = Mathf.Acos(dotProduct) * Mathf.Rad2Deg;
                            float dir = angle;

                            var trackingPlayerData = new TrackingPlayerData(player.ProfileId, captureTime, playerPosition.x, playerPosition.y, playerPosition.z, dir);

                            // Ensure Telemetry.Send and JsonConvert.SerializeObject are not causing issues
                            try
                            {
                                List<ValidationResult> _validationResults;
                                bool isValidPayload = ValidateTrackingPlayerData(trackingPlayerData, out _validationResults);
                                if (inRaid && ValidateTrackingPlayerData(trackingPlayerData, out _validationResults))
                                {
                                    Telemetry.Send("POSITION", JsonConvert.SerializeObject(trackingPlayerData));
                                }
                            }

                            catch (Exception ex)
                            {
                                Logger.LogError($"Telemetry sending failed: {ex.Message}");
                            }

                            // Update the last position and check if it has changed
                            Vector3 lastPositionVal;
                            if (lastPlayerPosition.TryGetValue(player.ProfileId, out lastPositionVal))
                            {
                                if (!lastPositionVal.Equals(playerPosition))
                                {
                                    lastPlayerPosition[player.ProfileId] = playerPosition;
                                }
                            }
                            else
                            {
                                lastPlayerPosition.Add(player.ProfileId, playerPosition);
                            }
                        }
                    }
                }
            } 
            
            catch (Exception ex)
            {
                Logger.LogError(ex);
                Logger.LogError($"{ex.Message}");
            }
        }

        public static bool ValidateTrackingPlayerData(TrackingPlayerData data, out List<ValidationResult> validationResults)
        {
            var context = new ValidationContext(data, null, null);
            validationResults = new List<ValidationResult>();
            return Validator.TryValidateObject(data, context, validationResults, true);
        }

        public static bool MapLoaded() => Singleton<GameWorld>.Instantiated;
    }
}
