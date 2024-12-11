using Newtonsoft.Json;
using WebSocketSharp;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using BepInEx;
using BepInEx.Logging;
using Comfort.Common;
using EFT.Communications;
using EFT.UI;

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

            ws.OnOpen += (sender, e) => { 
                Logger.LogInfo("[RAID-REVIEW] WebSocket connected."); 
                RAID_REVIEW.WebSocketConnected = true;
                NotificationManagerClass.DisplayMessageNotification("Raid Review Server Connected", ENotificationDurationType.Long);
                ws.Send("WS_CONNECTED"); 
            };

            ws.OnMessage += (sender, e) =>
            {
                Logger.LogInfo("[RAID-REVIEW] Received message: " + e.Data);
            };

            ws.OnError += (sender, e) => Logger.LogError($"[RAID-REVIEW] WebSocket error: {e.Message}");
            ws.OnClose += (sender, e) => Logger.LogInfo("[RAID-REVIEW] WebSocket closed.");

            Task.Run(() =>
            {
                try
                {
                    ws.Connect();
                }
                catch (Exception ex)
                {
                    NotificationManagerClass.DisplayMessageNotification("Raid Review - Unable to Connect To Server", ENotificationDurationType.Long, ENotificationIconType.Alert);
                    PreloaderUI.Instance.CloseErrorScreen();
                    PreloaderUI.Instance.ShowErrorScreen("Raid Review - Server Connection Error", "Raid Review was unable to connect to the Websocket server, please check 'Server IP' in the F12 menu and restart game.");
                    RAID_REVIEW.WebSocketConnected = false;
                    Logger.LogError($"WebSocket connection error: {ex.Message}");
                }
            });
        }
        public static void Send(string Action, string Payload)
        {
            if (RAID_REVIEW.WebSocketConnected == false) return; 

            Task.Run(() =>
            {
                if (RAID_REVIEW.EnableRecording.Value) 
                {
                    try
                    {
                        WsPayload wsPayload = new WsPayload
                        {
                            Action = Action,
                            Payload = Payload
                        };
                        ws.Send(JsonConvert.SerializeObject(wsPayload));
                    }
                    catch (Exception ex)
                    {
                        RAID_REVIEW.WebSocketFailureCount++;
                        if (RAID_REVIEW.WebSocketFailureCount > 25) {

                            RAID_REVIEW.WebSocketConnected = false;
                            if (RAID_REVIEW.RecordingNotification.Value)
                            {
                                NotificationManagerClass.DisplayMessageNotification("Raid Review: Tracking Failed > 25 Times", ENotificationDurationType.Long);
                                NotificationManagerClass.DisplayMessageNotification("Raid Review: Disabled Until Game Restarted", ENotificationDurationType.Long);
                            }

                            return;
                        }
                        Logger.LogError($"WebSocket send error: {ex.Message}");
                    }
                }
            });
        }
    }

}
