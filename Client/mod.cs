using EFT;
using System;
using System.Diagnostics;
using System.Collections.Generic;
using BepInEx;
using UnityEngine;
using Comfort.Common;
using Newtonsoft.Json;
using BepInEx.Configuration;
using System.IO;
using System.Reflection;
using System.Numerics;
using Vector3 = UnityEngine.Vector3;

namespace STATS
{
    [BepInPlugin("STATS", "STATS", "0.0.1")]
    public class STATS : BaseUnityPlugin
    {
        // Framerate
        private float updateInterval = 0.0f;
        private float lastUpdateTime = 0.0f;

        // STATS
        public static bool inRaid = false;
        public static bool tracking = false;
        public static string STATS_WS_Server = "ws://127.0.0.1:7828";
        public static string STATS_HTTP_Server = "http://127.0.0.1:7829";
        public static List<TrackingPlayer> trackingPlayers = new List<TrackingPlayer>();
        public static List<TrackingPlayer> deadPlayers = new List<TrackingPlayer>();
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
        public static ConfigEntry<float> PlayerTrackingInterval;
        public static ConfigEntry<bool> KillTracking;
        public static ConfigEntry<bool> LootTracking;
        public static GameObject Hook;

        void Awake()
        {
            Logger.LogInfo("STATS :::: INFO :::: Mod Loaded");

            LaunchWebpageKey = Config.Bind("Main", "Open Webpage Keybind", new KeyboardShortcut(KeyCode.F5), "Keybind to open the 'Stats Mod' webpage in your default browser.");
            PlayerTracking = Config.Bind<bool>("Tracking Settings", "Player Tracking", false, "Enables location tracking of players and bots.");
            PlayerTrackingInterval = Config.Bind<float>("Tracking Settings", "Player Tracking Interval", 5f, new ConfigDescription("Determines how often location data is tracked by FPS.", new AcceptableValueRange<float>(5.0f, 30.0f)));
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
        }
        void Update()
        {
            try
            {
                // UPDATE LIMITER
                if (updateInterval == 0.0f)
                    updateInterval = 1.0f / PlayerTrackingInterval.Value;
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

                    STATS.trackingRaid = new TrackingRaid();
                    STATS.trackingRaid.id = Guid.NewGuid().ToString("D");
                    STATS.trackingRaid.playerId = STATS.myPlayer.ProfileId;
                    STATS.trackingRaid.time = DateTime.Now;
                    STATS.trackingRaid.location = STATS.gameWorld.LocationId;
                    STATS.trackingRaid.timeInRaid = STATS.stopwatch.IsRunning ? STATS.stopwatch.ElapsedMilliseconds : 0;

                    Telemetry.Send("START", JsonConvert.SerializeObject(STATS.trackingRaid));

                    // Reset Playlist
                    trackingPlayers = new List<TrackingPlayer>();

                    // Add Main Player
                    var newTrackingPlayer = new TrackingPlayer();
                    newTrackingPlayer.id = myPlayer.Id;
                    newTrackingPlayer.profileId = myPlayer.Profile.ProfileId;
                    newTrackingPlayer.name = myPlayer.Profile.Nickname;
                    newTrackingPlayer.level = myPlayer.Profile.Info.Level;
                    newTrackingPlayer.team = myPlayer.Side;
                    newTrackingPlayer.group = 0;
                    newTrackingPlayer.spawnTime = stopwatch.ElapsedMilliseconds;
                    newTrackingPlayer.type = "HUMAN";

                    trackingPlayers.Add(newTrackingPlayer);

                    Telemetry.Send("PLAYER", JsonConvert.SerializeObject(newTrackingPlayer));

                    inRaid = true;
                    Logger.LogInfo("STATS :::: INFO :::: RAID Information Populated");
                    return;
                }

                // PLAYER TRACKING LOOP
                allPlayers = gameWorld.AllPlayersEverExisted;

                long captureTime = stopwatch.ElapsedMilliseconds;
                foreach (Player player in allPlayers)
                {
                    if (player == null)
                        continue;

                    var trackingPlayer = trackingPlayers.Find(registeredPlayer => registeredPlayer.profileId == player.Profile.ProfileId);
                    if (trackingPlayer == null)
                    {
                        trackingPlayer = new TrackingPlayer();
                        trackingPlayer.id = player.Id;
                        trackingPlayer.profileId = player.Profile.ProfileId;
                        trackingPlayer.name = player.Profile.Nickname;
                        trackingPlayer.level = player.Profile.Info.Level;
                        trackingPlayer.team = player.Side;
                        trackingPlayer.group = player?.AIData?.BotOwner?.BotsGroup?.Id ?? 0;
                        trackingPlayer.spawnTime = captureTime;
                        trackingPlayer.type = player.IsAI ? "BOT" : "HUMAN";

                        trackingPlayers.Add(trackingPlayer);
                        Telemetry.Send("PLAYER", JsonConvert.SerializeObject(trackingPlayer));
                    }

                    var deadPlayer = deadPlayers.Find(deadPlayers => deadPlayers.profileId == player.Profile.ProfileId);
                    if (deadPlayer == null)
                    {
                        if (PlayerTracking.Value)
                            PlayerLocationTracking(captureTime, player);

                        if (!player.HealthController.IsAlive)
                            deadPlayers.Add(trackingPlayer);
                    }
                }

            }

            catch (Exception ex)
            {
                Logger.LogError($"{ex.Message}");
            }
        }
        public static bool MapLoaded() => Singleton<GameWorld>.Instantiated;
        private void PlayerLocationTracking(long captureTime, Player player)
        {

            try
            {

                // Player Health & Body Parts
                List<float> health = new List<float>();
                foreach (EBodyPart bodyPart in Enum.GetValues(typeof(EBodyPart)))
                {
                    var bodyPartData = player.PlayerHealthController.GetBodyPartHealth(bodyPart);
                    health.Add(bodyPartData.Normalized);
                    health.Add(bodyPartData.Maximum);
                }

                // Player Positions
                Vector3 referenceVector = new Vector3(0, 0, 1);
                Vector3 playerPosition = player.Position;
                Vector3 playerFacing = player.LookDirection;

                // Direction Calculation
                float dir = 0.0f;
                if (playerFacing != Vector3.zero)
                {
                    Vector3 playerDirection = playerPosition - playerFacing;
                    if (playerDirection != Vector3.zero)
                    {
                        playerDirection.Normalize();
                        referenceVector.Normalize();

                        float dotProduct = Vector3.Dot(playerDirection, referenceVector);
                        if (dotProduct >= -1f && dotProduct <= 1f)
                        {
                            float angle = Mathf.Acos(dotProduct) * Mathf.Rad2Deg;
                            dir = angle;
                        }
                        else
                        {
                            dir = 0.0F;
                            Logger.LogError("STATS :::: ERROR :::: Vector3.Dot is out of range.");
                        }
                    }
                    else
                    {
                        dir = 0.0F;
                    }
                }
                else
                {
                    dir = 0.0F;
                }

                var trackingPlayerData = new TrackingPlayerData(player.Id, captureTime, playerPosition.x, playerPosition.y, playerPosition.z, dir, player.HealthController.IsAlive, health);

                Telemetry.Send("POSITION", JsonConvert.SerializeObject(trackingPlayerData));

            }

            catch (Exception ex)
            {
                Logger.LogError($"{ex.Message}");
            }
        }
    }
}
