using EFT;
using System;
using System.IO;
using System.Diagnostics;
using System.Collections.Generic;
using System.Reflection;
using Aki.Reflection.Patching;
using BepInEx;
using UnityEngine;
using Comfort.Common;
using Newtonsoft.Json;
using System.Linq;
using BepInEx.Configuration;
using EFT.InventoryLogic;
using WebSocketSharp;

namespace STATS
{
    [BepInPlugin("STATS", "STATS", "0.0.1")]
    public class STATS : BaseUnityPlugin
    {
        // Framerate
        private float updateInterval = 0.0f;
        private float lastUpdateTime = 0.0f;

        // STATS
        public static bool tracking = false;
        public static string STATS_Server = "ws://127.0.0.1:7828";
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
        public static ConfigEntry<string> STATSServer;
        public static ConfigEntry<bool> PlayerTracking;
        public static ConfigEntry<float> PlayerTrackingInterval;
        public static ConfigEntry<bool> KillTracking;
        public static ConfigEntry<bool> AggressionTracking;
        public static ConfigEntry<bool> LootTracking;
        public static GameObject Hook;

        void Awake()
        {
            Logger.LogInfo("STATS :::: INFO :::: Mod Loaded");

            PlayerTracking = Config.Bind<bool>("Tracking Settings", "Player Tracking", false, "Enables location tracking of players and bots..");
            PlayerTrackingInterval = Config.Bind<float>("Tracking Settings", "Player Tracking Interval", 5f, new ConfigDescription("Determines how often location data is tracked by FPS.", new AcceptableValueRange<float>(5.0f, 30.0f)));
            KillTracking = Config.Bind<bool>("Tracking Settings", "Kill Tracking", true, "Enables location tracking of players and bots kills.");
            AggressionTracking = Config.Bind<bool>("Tracking Settings", "Aggression Tracking", true, "Enables tracking of players and bot aggression.");
            LootTracking = Config.Bind<bool>("Tracking Settings", "Loot Tracking", true, "Enables location tracking of players and bots looting activities.");

            Hook = new GameObject();
            Logger.LogInfo("STATS :::: INFO :::: Config Loaded");

            new STATS_Player_KillPatch().Enable();
            new STATS_Player_OnItemAddedOrRemovedPatch().Enable();
            new STATS_Player_ManageAggressorPatch().Enable();
            new STATS_Player_OnGameSessionEndPatch().Enable();
            new STATS_RaidSettings_ClonePatch().Enable();
            Logger.LogInfo("STATS :::: INFO :::: Patches Loaded");

            Telemetry.Connect(STATS_Server);
            Logger.LogInfo("STATS :::: INFO :::: Connected to backend");
        }
        void Update()
        {
            // UPDATE LIMITER
            if (updateInterval == 0.0f)
                updateInterval = 1.0f / PlayerTrackingInterval.Value;
            if (!(Time.time - lastUpdateTime >= updateInterval))
                return;
            lastUpdateTime = Time.time;


            // IF MAP NOT LOADED, RETURN
            if (!MapLoaded())
                return;

            if (!stopwatch.IsRunning)
                stopwatch.Start();

            gameWorld = Singleton<GameWorld>.Instance;
            myPlayer = gameWorld?.MainPlayer;

            // IF IN MENU, RETURN
            if (gameWorld == null || myPlayer == null)
                return;

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
                    trackingPlayer.group = player.GroupId;
                    trackingPlayer.spawnTime = captureTime;
                    trackingPlayer.type = player.IsAI ? "BOT" : "HUMAN";

                    trackingPlayers.Add(trackingPlayer);
                    Telemetry.Send("PLAYER", JsonConvert.SerializeObject(trackingPlayer));
                }

                var deadPlayer = deadPlayers.Find(deadPlayers => deadPlayers.profileId == player.Profile.ProfileId);
                if (deadPlayer.profileId != null)
                {
                    if (PlayerTracking.Value)
                        PlayerLocationTracking(captureTime, player);

                    if (!player.HealthController.IsAlive)
                        deadPlayers.Add(trackingPlayer);
                }
            }
        }
        public static bool MapLoaded() => Singleton<GameWorld>.Instantiated;
        private void PlayerLocationTracking(long captureTime, Player player)
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
        public class STATS_Player_KillPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(Player).GetMethod("OnBeenKilledByAggressor", BindingFlags.Instance | BindingFlags.NonPublic);
            }

            [PatchPostfix]
            private static void PatchPostFix(ref Player __instance, Player aggressor, DamageInfo damageInfo, EBodyPart bodyPart, EDamageType lethalDamageType)
            {
                if (KillTracking.Value)
                {
                    var newKill = new TrackingRaidKill();

                    newKill.time = STATS.stopwatch.ElapsedMilliseconds;
                    newKill.killedId = __instance.Profile.ProfileId;
                    newKill.killerId = aggressor.Profile.ProfileId;
                    newKill.distance = Vector3.Distance(aggressor.Position, __instance.Position);
                    newKill.weapon = damageInfo.Weapon == null ? "?" : damageInfo.Weapon.Name;
                    newKill.bodyPart = bodyPart.ToString();
                    newKill.type = lethalDamageType.ToString();

                    Telemetry.Send("KILL", JsonConvert.SerializeObject(newKill));
                }
            }
        }
        public class STATS_Player_OnItemAddedOrRemovedPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(Player).GetMethod("OnItemAddedOrRemoved", BindingFlags.Instance | BindingFlags.NonPublic);
            }

            [PatchPostfix]
            private static void PatchPostFix(ref Player __instance, Item item, ItemAddress location, bool added)
            {
                if (LootTracking.Value)
                {
                    TrackingLootItem newLootItem = new TrackingLootItem();

                    newLootItem.playerId = __instance.Profile.ProfileId;
                    newLootItem.time = STATS.stopwatch.ElapsedMilliseconds;
                    newLootItem.id = item.Id;
                    newLootItem.name = item.ShortName;
                    newLootItem.qty = item.StackObjectsCount;
                    newLootItem.type = item.QuestItem ? "QUEST_ITEM" : "LOOT";
                    newLootItem.added = added;

                    Telemetry.Send("LOOT", JsonConvert.SerializeObject(newLootItem));
                }
            }
        }
        public class STATS_Player_ManageAggressorPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(Player).GetMethod("ManageAggressor", BindingFlags.Public | BindingFlags.Instance | BindingFlags.NonPublic);
            }

            [PatchPostfix]
            private static void PatchPostFix(ref Player __instance, DamageInfo damageInfo, EBodyPart bodyPart, EHeadSegment? headSegment)
            {
                if (AggressionTracking.Value)
                {
                    TrackingAggression newAggression = new TrackingAggression();

                    newAggression.time = stopwatch.ElapsedMilliseconds;
                    newAggression.aggressorId = damageInfo.Player.iPlayer.ProfileId;
                    newAggression.aggresseId = __instance.Profile.ProfileId;
                    newAggression.weapon = damageInfo.Weapon.Name;
                    newAggression.bodyPart = damageInfo.BodyPartColliderType;
                    newAggression.distance = Vector3.Distance(damageInfo.Player.iPlayer.Position, __instance.Position);

                    Telemetry.Send("AGGRESSION", JsonConvert.SerializeObject(newAggression));
                }
            }
        }

        public class STATS_RaidSettings_ClonePatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(RaidSettings).GetMethod("Clone", BindingFlags.Public | BindingFlags.Instance | BindingFlags.NonPublic);
            }

            [PatchPostfix]
            private static void PatchPostFix(ref RaidSettings __instance)
            {
                if (__instance.LocationId == null)
                    return;

                Logger.LogInfo("STATS :::: INFO :::: RAID Settings Loaded");

                trackingRaid.id = Guid.NewGuid().ToString("D");
                trackingRaid.time = DateTime.Now;
                trackingRaid.location = __instance.LocationId;
                trackingRaid.timeInRaid = stopwatch.IsRunning ? stopwatch.ElapsedMilliseconds : 0;

                Telemetry.Send("START", JsonConvert.SerializeObject(trackingRaid));

                Logger.LogInfo("STATS :::: INFO :::: RAID Information Populated");
            }
        }
        public class STATS_Player_OnGameSessionEndPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(Player).GetMethod("OnGameSessionEnd", BindingFlags.Public | BindingFlags.Instance | BindingFlags.NonPublic);
            }

            [PatchPostfix]
            private static void PatchPostFix(ref Player __instance, ExitStatus exitStatus, float pastTime, string locationId, string exitName)
            {

                Logger.LogInfo("STATS :::: INFO :::: RAID Completed, Saving Tracking Data");
                stopwatch.Stop();
                tracking = false;

                trackingRaid.exitStatus = exitStatus;
                trackingRaid.exitName = exitName;
                trackingRaid.timeInRaid = stopwatch.ElapsedMilliseconds;

                Telemetry.Send("END", JsonConvert.SerializeObject(trackingRaid));
            }
        }
    }
}
