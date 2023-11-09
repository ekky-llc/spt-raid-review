using EFT;
using BepInEx;
using UnityEngine;
using Comfort.Common;
using System.Collections.Generic;
using System;

namespace SPTH
{

    public class TrackingRaid
    {
        public string id { get; set; }
        public string location { get; set; }
        public DateTime time { get; set; }
        public long timeInRaid { get; set; }

        public string exitName { get; set; }
        public ExitStatus exitStatus { get; set; }
        public List<TrackingPlayer> players { get; set; } = new List<TrackingPlayer>();
        public List<TrackingRaidKill> killTimeline { get; set; } = new List<TrackingRaidKill>();
        public List<TrackingAggression> aggresionTimeline { get; set; } = new List<TrackingAggression>();
        public List<TrackingLootItem> lootTimeline { get; set; } = new List<TrackingLootItem>();
    }

    public class TrackingPlayer
    { 
        public int id { get; set; }
        public string profileId { get; set; }
        public int level { get; set; }
        public EPlayerSide team { get; set; }
        public string name { get; set; }
        public string type { get; set; }
        public string group {  get; set; }
        public long spawnTime { get; set; }
        public long deathTime { get; set; }
        public PlayerStatus status { get; set; }
    }

    public class TrackingRaidKill
    {
        public long time { get; set; }
        public string killerId { get; set; }
        public string killedId { get; set; }
        public string weapon {  get; set; }
        public float distance { get; set; }
        public string bodyPart {  get; set; }
        public string type { get; set; }
    }

    public class TrackingAggression
    {
        public long time { get; set; }
        public string aggressorId {  get; set; }
        public string aggresseId { get; set; }
        public string weapon { get; set; }
        public float distance { get; set; }
        public EBodyPartColliderType bodyPart { get; set; }
    }

    public class TrackingLootItem
    {
        public string playerId { get; set; }
        public long time { get; set; }
        public string id { get; set; }
        public string name { get; set; }
        public int qty { get; set; }
        public string type { get; set; }
        public bool added {  get; set; }
    }

    public class TrackingPlayerData
    {
        public int playerId { get; set; }
        public long time { get; set; }
        public float x { get; set; }
        public float y { get; set; }
        public float z { get; set; }
        public float dir { get; set; }
        public bool alive { get; set; }
        public Tuple<float, float>[] health { get; set; }

        public TrackingPlayerData(
            int playerId, 
            long time, 
            float x, 
            float y, 
            float z, 
            float dir, 
            bool alive,
            Tuple<float, float>[] health)
        {
            this.playerId = playerId;
            this.time = time;
            this.x = x;
            this.y = y;
            this.z = z;
            this.dir = dir;
            this.alive = alive;
            this.health = health;
        }
    }

    public class TrackingPlayerBodyPart
    {
        public float current { get; set; } = 0F;
        public float max { get; set; } = 0F;
    }

    public enum PlayerStatus
    {
        Alive,
        Dead,
        Extracted
    }
}