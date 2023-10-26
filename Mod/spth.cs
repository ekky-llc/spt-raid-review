using EFT;
using System;
using System.IO;
using System.Diagnostics;
using System.Collections.Generic;
using BepInEx;
using UnityEngine;
using Comfort.Common;
using Newtonsoft.Json;

namespace SPTH
{
    [BepInPlugin("spth.sender", "sender", "0.0.1")]
    public class SPTH : BaseUnityPlugin
    {
        // Framerate
        private float updateInterval = 1.0f / 30.0f; // 30 FPS
        private float lastUpdateTime = 0.0f;

        // SPTH
        public static bool modLoaded = false;
        public static bool tracking = false;
        public static TrackingRaid trackingRaid = new TrackingRaid();
        public Stopwatch stopwatch = new Stopwatch();

        // EFT
        public static GameWorld gameWorld;
        public static RaidSettings raid;
        public static Player player;
        public static IEnumerable<Player> allPlayers;

        private void Update()
        {
            if (!(Time.time - lastUpdateTime >= updateInterval))
                return;
            lastUpdateTime = Time.time;

            if (modLoaded == false)
            {
                Logger.LogInfo("SPTH :::: INFO :::: Mod Loaded");
                modLoaded = true;
            }

            // END RAID CAPTURE
            if (tracking)
            {
                if (!MapLoaded())
                {
                    Logger.LogInfo("SPTH :::: INFO :::: RAID Completed, Saving Tracking Data");

                    tracking = false;
                    stopwatch.Stop();
                    trackingRaid.timeInRaid = stopwatch.ElapsedMilliseconds;

                    string dataToWrite = JsonConvert.SerializeObject(trackingRaid);
                    string filePath = Path.Combine(BepInEx.Paths.PluginPath, "SPTH_SESSION.json");

                    File.WriteAllText(filePath, dataToWrite);
                    if (File.Exists(filePath))
                    {
                        Logger.LogInfo("SPTH :::: INFO :::: Saved Tracking Data Succesfully");
                    }
                    else
                    {
                        Logger.LogError("SPTH :::: ERROR :::: There was a problem saving the Tracking Data");
                    }
                }
            }

            // IF MAP NOT LOADED, RETURN
            if (!MapLoaded())
                return;

            gameWorld = Singleton<GameWorld>.Instance;
            player = gameWorld?.MainPlayer;

            // IF IN MENU, RETURN
            if (gameWorld == null || player == null)
                return;

            // START TRACKING, AND INIT RAID
            if (!tracking)
            {
                Logger.LogInfo("SPTH :::: INFO :::: Starting Tracking");
                tracking = true;
                stopwatch.Start();

                trackingRaid.players = new List<TrackingPlayer>();
                trackingRaid.locations = new List<TrackingPlayerData>();

                if (RaidLoaded())
                {
                    Logger.LogInfo("SPTH :::: INFO :::: RAID Settings Loaded");
                    raid = Singleton<RaidSettings>.Instance;
                }

                if (raid != null)
                {
                    Logger.LogInfo("SPTH :::: INFO :::: Populating RAID Information from EFT");

                    trackingRaid.id = raid.KeyId;
                    trackingRaid.location = raid.LocationId;
                }

                else
                {
                    Logger.LogInfo("SPTH :::: INFO :::: Populating RAID Information manually");
                    trackingRaid.id = "TEST";
                    trackingRaid.location = "FACTORY";
                }

                Logger.LogInfo("SPTH :::: INFO :::: RAID Information Populated");

                string trackingRaidAsJson = JsonConvert.SerializeObject(trackingRaid);
                Logger.LogInfo("SPTH :::: INFO :::: RAID Data: " + trackingRaidAsJson);
            }

            // PLAYER TRACKING LOOP
            allPlayers = gameWorld.AllPlayersEverExisted;

            long captureTime = stopwatch.ElapsedMilliseconds;
            foreach (Player player in allPlayers)
            {
                if (player == null)
                {
                    continue;
                }

                if (trackingRaid.players == null)
                {
                    trackingRaid.players = new List<TrackingPlayer>();
                }

                var trackingPlayer = trackingRaid.players.Find(registeredPlayer => registeredPlayer.id == player.Id);
                if (trackingPlayer == null)
                {
                    trackingPlayer = new TrackingPlayer();
                    trackingPlayer.id = player.Id;
                    trackingPlayer.name = player.Profile.Nickname;
                    trackingPlayer.status = PlayerStatus.Alive;
                    trackingPlayer.spawnTime = captureTime;
                    trackingPlayer.type = player.IsAI ? "BOT" : "HUMAN";

                    trackingRaid.players.Add(trackingPlayer);
                }

                // If Player Is Dead
                if (!player.HealthController.IsAlive && trackingPlayer.status != PlayerStatus.Dead)
                {
                    trackingPlayer.status = PlayerStatus.Dead;
                    trackingPlayer.deathTime = captureTime;

                    var indexOfTrackingPlayer = trackingRaid.players.FindIndex(registeredPlayer => registeredPlayer.id == player.Id);
                    if (indexOfTrackingPlayer > -1)
                    {
                        trackingRaid.players[indexOfTrackingPlayer] = trackingPlayer;
                    }
                }

                // Player Positions
                Vector3 referenceVector = new Vector3(0, 0, 1);
                Vector3 playerPosition = player.Position;
                Vector3 playerFacing = player.LookDirection;

                // Player Tracking Data
                TrackingPlayerData trackingPlayerData = new TrackingPlayerData();
                trackingPlayerData.time = captureTime;
                trackingPlayerData.playerId = player.Id;
                trackingPlayerData.x = playerPosition.x;
                trackingPlayerData.y = playerPosition.y;
                trackingPlayerData.z = playerPosition.z;
                trackingPlayerData.alive = player.HealthController.IsAlive;

                // Direction Calculation
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
                            trackingPlayerData.dir = angle;
                        }
                        else
                        {
                            trackingPlayerData.dir = 0.0F;
                            Logger.LogError("SPTH :::: ERROR :::: Vector3.Dot is out of range.");
                        }
                    }
                    else
                    {
                        trackingPlayerData.dir = 0.0F;
                    }
                }
                else
                {
                    trackingPlayerData.dir = 0.0F;
                }

                trackingRaid.locations.Add(trackingPlayerData);
                string trackingPlayerAsJson = JsonConvert.SerializeObject(trackingPlayerData);
                Logger.LogInfo("SPTH :::: INFO :::: Player Data: " + trackingPlayerAsJson);
            }
        }

        public static bool MapLoaded() => Singleton<GameWorld>.Instantiated;
        public static bool RaidLoaded() => Singleton<RaidSettings>.Instantiated;

    }
}
