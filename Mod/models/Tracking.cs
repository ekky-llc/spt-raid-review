using EFT;
using BepInEx;
using UnityEngine;
using Comfort.Common;
using System.Collections.Generic;

namespace SPTH
{

    public class TrackingRaid
    {
        public string id {  get; set; }
        public string location { get; set; }
        public long timeInRaid { get; set; }
        public List<TrackingPlayer> players { get; set; }
        public List<TrackingPlayerData> locations { get; set; }
    }

    public class TrackingPlayer
    {
        public int id { get; set; }
        public string name { get; set; }
        public string type { get; set; }
        public long spawnTime { get; set; }
        public long deathTime { get; set; }
        public PlayerStatus status { get; set; }
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
    }

    public enum PlayerStatus
    {
        Alive,
        Dead,
        Extracted
    }
}