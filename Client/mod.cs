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
using EFT.Communications;
using System.Threading.Tasks;
using System.Linq;
using System.Collections;

namespace RAID_REVIEW
{
    [BepInPlugin("ekky.raidreview", "Raid Review", "0.1.0")]
    [BepInDependency("me.sol.sain", BepInDependency.DependencyFlags.SoftDependency)]
    public class RAID_REVIEW : BaseUnityPlugin
    {
        // Framerate
        public static float updateInterval = 0.0f;
        public static float lastUpdateTime = 0.0f;
        public static float PlayerTrackingInterval = 5f;

        // RAID_REVIEW
        public static string sessionId = null;
        public static bool inRaid = false;
        public static bool tracking = false;
        public static bool WebSocketConnected = false;
        public static string RAID_REVIEW_WS_Server = "ws://127.0.0.1:7828";
        public static string RAID_REVIEW_HTTP_Server = "http://127.0.0.1:7829";
        public static List<string> RAID_REVIEW__DETECTED_MODS = new List<string>();
        public static Dictionary<string, TrackingPlayer> trackingPlayers = new Dictionary<string, TrackingPlayer>();
        public static TrackingRaid trackingRaid = new TrackingRaid();
        public static Stopwatch stopwatch = new Stopwatch();

        // EFT
        public static GameWorld gameWorld;
        public static RaidSettings raid;
        public static Player myPlayer;
        public static IEnumerable<Player> allPlayers;

        // BepInEx
        public static string PluginFolder = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
        public static ConfigEntry<KeyboardShortcut> LaunchWebpageKey;
        public static ConfigEntry<bool> PlayerTracking;
        public static ConfigEntry<bool> InsertMenuItem;
        public static ConfigEntry<bool> RecordingNotification;
        public static ConfigEntry<bool> KillTracking;
        public static ConfigEntry<bool> LootTracking;
        public static ConfigEntry<bool> ExtractTracking;
        public static ConfigEntry<string> ServerAddress;
        public static ConfigEntry<string> ServerWsPort;
        public static ConfigEntry<string> ServerHttpPort;
        public static ConfigEntry<bool> EnableRecording;
        public static ConfigEntry<bool> ServerTLS;
        public static GameObject Hook;

        // Other Mods
        public static bool MODS_SEARCHED = false;
        public static bool SOLARINT_SAIN__DETECTED { get; set; }
        public static object sainBotController { get; set; }
        public static bool searchingForSainComponents = false;
        public static Dictionary<string, TrackingPlayer> updatedBots = new Dictionary<string, TrackingPlayer>();

        void Awake()
        {
            Logger.LogInfo("RAID_REVIEW :::: INFO :::: Mod Loaded");

            // Configuration Bindings
            LaunchWebpageKey = Config.Bind("Main", "Open Webpage Keybind", new KeyboardShortcut(KeyCode.F5), "Keybind to open the web client.");
            InsertMenuItem = Config.Bind<bool>("Main", "Insert Menu Item", false, "Enables menu item to open the web client.");
            RecordingNotification = Config.Bind<bool>("Main", "Recording Notification", true, "Enables notifications as recording starts and ends.");

            ServerAddress = Config.Bind<string>("Server", "1. Server IP", "127.0.0.1", "IP address of the server.");
            ServerWsPort = Config.Bind<string>("Server", "2. Server WS Port", "7828", "Listen port of the raid review websocket server.");
            ServerHttpPort = Config.Bind<string>("Server", "3. Server HTTP Port", "7829", "Listen port of the raid review http server.");
            ServerTLS = Config.Bind<bool>("Server", "4. TLS", false, "Enable if you are using an SSL Certificate infront of your http server.");
            EnableRecording = Config.Bind<bool>("Server", "5. Enable Recording", true, "[WARNING] Only disable if you want to stop all data from being sent to raid review, requires restart.");

            PlayerTracking = Config.Bind<bool>("Tracking Settings", "Player Tracking", true, "Enables location tracking of players and bots.");
            KillTracking = Config.Bind<bool>("Tracking Settings", "Kill Tracking", true, "Enables location tracking of kills.");
            LootTracking = Config.Bind<bool>("Tracking Settings", "Loot Tracking", true, "Enables location tracking of lootings.");

            // HTTP/Websocket Endpoint Builders
            RAID_REVIEW_WS_Server = "ws://" + ServerAddress.Value + ":" + ServerWsPort.Value;
            RAID_REVIEW_HTTP_Server = (ServerTLS.Value ? "https://" : "http://") + ServerAddress.Value + ":" + ServerHttpPort.Value;

            Hook = new GameObject();

            Logger.LogInfo("RAID_REVIEW :::: INFO :::: Config Loaded");
            new RAID_REVIEW_Player_OnGameStartedPatch().Enable();
            new RAID_REVIEW_Player_OnGameSessionEndPatch().Enable();
            new RAID_REVIEW_menuTaskBar_setButtonsAvailablePatch().Enable();
            new RAID_REVIEW_Player_OnBeenKilledByAggressorPatch().Enable();
            new RAID_REVIEW_Player_OnItemAddedOrRemovedPatch().Enable();
            Logger.LogInfo("RAID_REVIEW :::: INFO :::: Patches Loaded");

            Telemetry.Connect(RAID_REVIEW_WS_Server);
            Logger.LogInfo("RAID_REVIEW :::: INFO :::: Connected to backend");

            LoggerInstance.Log = Logger;

        }
        IEnumerator UpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(1.0f / PlayerTrackingInterval);

                try
                {

                    if (Input.GetKey(LaunchWebpageKey.Value.MainKey))
                    {
                        Application.OpenURL(RAID_REVIEW_HTTP_Server);

                    }

                    // IF MAP NOT LOADED, RETURN
                    if (!MapLoaded())
                        continue;

                    gameWorld = Singleton<GameWorld>.Instance;
                    myPlayer = gameWorld?.MainPlayer;


                    // IF IN MENU, RETURN
                    if (gameWorld == null || myPlayer == null || gameWorld.LocationId == "hideout")
                        continue;

                    if (sessionId == null && myPlayer != null)
                    {
                        sessionId = myPlayer.ProfileId;
                    }

                    // IF RAID HAS NOT STARTED, RETURN
                    if (!inRaid) continue;

                    // PLAYER TRACKING LOOP
                    IEnumerable<Player> allPlayers = gameWorld.AllPlayersEverExisted;
                    long captureTime = stopwatch.ElapsedMilliseconds;
                    foreach (Player player in allPlayers)
                    {

                        if (player == null)
                            continue;

                        TrackingPlayer trackingPlayer = new TrackingPlayer();
                        bool isBeingTracked = trackingPlayers.TryGetValue(player.ProfileId, out trackingPlayer);
                        if (!isBeingTracked)
                        {

                            trackingPlayer = new TrackingPlayer
                            {
                                sessionId = sessionId,
                                profileId = player.ProfileId,
                                name = player.Profile.Nickname,
                                level = player.Profile.Info.Level,
                                team = player.Side,
                                group = player?.AIData?.BotOwner?.BotsGroup?.Id ?? 0,
                                spawnTime = stopwatch.ElapsedMilliseconds,
                                type = player.IsAI ? "BOT" : "HUMAN",
                                mod_SAIN_brain = "UNKNOWN",
                                mod_SAIN_difficulty = ""
                            };

                            if (player.Side == EPlayerSide.Savage)
                            {
                                trackingPlayer.mod_SAIN_brain = "SCAV";
                                trackingPlayer.type = "SCAV|SCAV";
                            }
                            else if (player.Side == EPlayerSide.Usec || player.Side == EPlayerSide.Bear)
                            {
                                trackingPlayer.mod_SAIN_brain = "PMC";
                            }

                            trackingPlayers[trackingPlayer.profileId] = trackingPlayer;
                            _ = Telemetry.Send("PLAYER", JsonConvert.SerializeObject(trackingPlayer));

                        }


                        // Checks if a player / bot has died since the last check...
                        if (player.HealthController.IsAlive)
                        {

                            if (PlayerTracking.Value)
                            {

                                if (player == null || gameWorld == null)
                                {
                                    Logger.LogWarning("Player or gameWorld is null, skipping this iteration.");
                                    continue;

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

                                var trackingPlayerData = new TrackingPlayerData(sessionId, player.ProfileId, captureTime, playerPosition.x, playerPosition.y, playerPosition.z, dir);
                                _ = Telemetry.Send("POSITION", JsonConvert.SerializeObject(trackingPlayerData));
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
        }
        public static bool DetectMod(string modName)
        {
            if (Chainloader.PluginInfos.ContainsKey(modName)) return true;
            return false;
        }
        public static bool MapLoaded() => Singleton<GameWorld>.Instantiated;

    }
}