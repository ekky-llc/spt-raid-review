using EFT;
using System;

namespace SPTH
{
    public class HttpRaidStart
    {
        string Id { get; set; }
        DateTime Time { get; set; }
        string Location { get; set; }
        int TimeOfDay { get; set; }
        long TimeInRaid { get; set; }
    }

    public class HttpRaidEnd
    {
        string Id { get; set; }
        string Location { get; set; }
        ExitStatus ExitStatus { get; set; }
        string ExitName { get; set; }
        string TimeInRaid { get; set; }
    }

    public class HttpRaidTelemetry
    {
        string Id { get; set; }
        TrackingPlayerData PlayerData { get; set; }
        TrackingRaidKill KillData { get; set; }
        TrackingAggression AggressionData { get; set; }
        TrackingLootItem LootData { get; set; }
    }
}