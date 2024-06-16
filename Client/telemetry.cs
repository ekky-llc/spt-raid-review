using Newtonsoft.Json;
using WebSocketSharp;
using System.Threading.Tasks;
using System.Collections.Generic;
using BepInEx;
using BepInEx.Logging;
using System;
using EFT.Communications;

namespace RAID_REVIEW
{
    public class Telemetry
    {
        private static WebSocket ws = null;
        private static readonly ManualLogSource Logger = BepInEx.Logging.Logger.CreateLogSource("Telemetry");

        public static void Connect(string host)
        {
            if (ws != null)
            {
                ws.Close();
            }

            ws = new WebSocket(host);

            ws.OnOpen += (sender, e) => Logger.LogInfo("WebSocket connected.");
            ws.OnMessage += (sender, e) => Logger.LogInfo($"WebSocket message received: {e.Data}");
            ws.OnError += (sender, e) => Logger.LogError($"WebSocket error: {e.Message}");
            ws.OnClose += (sender, e) => Logger.LogInfo("WebSocket closed.");

            Task.Run(() =>
            {
                try
                {
                    ws.Connect();

                    ws.OnMessage += (sender, e) =>
                    {
                        Logger.LogInfo("[RAID-SERVER] Received message: " + e.Data);
                        HandleMessage(e.Data);
                    };

                    Logger.LogError("WebSocket is connected.");
                }
                catch (System.Exception ex)
                {
                    Logger.LogError($"WebSocket connection error: {ex.Message}");
                }
            });
        }

        static void HandleMessage(string message)
        {
            // Basic Notification System
            // - People requested that some level of notification is provided.
            if (RAID_REVIEW.RecordingNotification.Value)
            {

                // Switch statements are for cucks
                if (message == "RECORDING_START")
                {
                    NotificationManagerClass.DisplayMessageNotification("Raid Review Recording Started", ENotificationDurationType.Long);
                }

                if (message == "RECORDING_END")
                {
                    NotificationManagerClass.DisplayMessageNotification("Raid Review Recording Completed", ENotificationDurationType.Long);
                }

            }

            // Verbose Notification System
            // - Not asked for, Helpful for Fika/Remote host testing and dev debugging.
            if (RAID_REVIEW.VerboseNotifications.Value)
            {

                // Switch statements are for cucks
                if (message == "RECORDING__DEBUG__PLAYER")
                {
                    NotificationManagerClass.DisplayMessageNotification("[RAID-REVIEW:DEBUG] ✔️ Player", ENotificationDurationType.Long);
                }

                if (message == "RECORDING__DEBUG__KILL")
                {
                    NotificationManagerClass.DisplayMessageNotification("[RAID-REVIEW:DEBUG] ✔️ Kills", ENotificationDurationType.Long);
                }

                if (message == "RECORDING__DEBUG__POSITION")
                {
                    NotificationManagerClass.DisplayMessageNotification("[RAID-REVIEW:DEBUG] ✔️ Positions", ENotificationDurationType.Long);
                }

                if (message == "RECORDING__DEBUG__LOOT")
                {
                    NotificationManagerClass.DisplayMessageNotification("[RAID-REVIEW:DEBUG] ✔️ Lootings", ENotificationDurationType.Long);
                }

            }

        }

        public static Task Send(string Action, string Payload)
        {
            return Task.Run(() =>
            {
                try
                {
                    WsPayload wsPayload = new WsPayload();
                    wsPayload.Action = Action;
                    wsPayload.Payload = Payload;
                    ws.Send(JsonConvert.SerializeObject(wsPayload));
                }
                catch (System.Exception ex)
                {
                    Logger.LogError($"WebSocket send error: {ex.Message}");
                }
            });
        }
    }

}
