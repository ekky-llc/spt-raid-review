using EFT;
using System;

namespace STATS
{

    public class WsPayload
    {
        public string Action { get; set; }
        public string Payload { get; set; }
    }

    public class WsRaidStart
    {
        public string Id { get; set; }
        public DateTime Time { get; set; }
        public string Location { get; set; }
        public int TimeOfDay { get; set; }
        public long TimeInRaid { get; set; }
    }

    public class WsRaidEnd
    {
        public string Id { get; set; }
        public string Location { get; set; }
        public ExitStatus ExitStatus { get; set; }
        public string ExitName { get; set; }
        public string TimeInRaid { get; set; }
    }

    public class WsRaidTelemetry
    {
        public string Id { get; set; }
        public TrackingPlayerData PlayerData { get; set; }
        public TrackingRaidKill KillData { get; set; }
        public TrackingLootItem LootData { get; set; }
    }
}