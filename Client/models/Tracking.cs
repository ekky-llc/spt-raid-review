using EFT;
using BepInEx;
using UnityEngine;
using Comfort.Common;
using System.Collections.Generic;
using System;

namespace RAID_REVIEW
{

    public class TrackingRaid
    {
        public string sessionId { get; set; }
        public string profileId { get; set; }
        public string location { get; set; }
        public string detectedMods { get; set; }
        public DateTime time { get; set; }
        public long timeInRaid { get; set; }
        public string exitName { get; set; }
        public ExitStatus exitStatus { get; set; }
    }

    public class TrackingPlayer
    { 
        public string sessionId { get; set; }
        public string profileId { get; set; }
        public int level { get; set; }
        public EPlayerSide team { get; set; }
        public string name { get; set; }
        public string type { get; set; }
        public int group {  get; set; }
        public long spawnTime { get; set; }
        public string mod_SAIN_brain { get; set; }
        public string mod_SAIN_difficulty { get; set; }
    }

    public class TrackingRaidKill
    {
        public long time { get; set; }
        public string sessionId { get; set; }
        public string profileId { get; set; }
        public string killedId { get; set; }
        public string weapon {  get; set; }
        public float distance { get; set; }
        public string bodyPart {  get; set; }
        public string type { get; set; }
        public string positionKiller { get; set; }
        public string positionKilled { get; set; }
    }

    public class TrackingLootItem
    {
        public string sessionId { get; set; }
        public string profileId { get; set; }
        public long time { get; set; }
        public string itemId { get; set; }
        public string itemName { get; set; }
        public int qty { get; set; }
        public string type { get; set; }
        public bool added {  get; set; }
    }

    public class TrackingPlayerData
    {
        public string sessionId { get; set; }
        public string profileId { get; set; }
        public long time { get; set; }
        public float x { get; set; }
        public float y { get; set; }
        public float z { get; set; }
        public float dir { get; set; }

        public TrackingPlayerData(
            string sessionId, 
            string profileId, 
            long time, 
            float x, 
            float y, 
            float z, 
            float dir)
        {
            this.sessionId = sessionId;
            this.profileId = profileId;
            this.time = time;
            this.x = x;
            this.y = y;
            this.z = z;
            this.dir = dir;
        }
    }
}