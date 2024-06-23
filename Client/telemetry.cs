using Newtonsoft.Json;
using WebSocketSharp;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using BepInEx;
using BepInEx.Logging;
using Comfort.Common;
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

            ws.OnOpen += (sender, e) => { 
                Logger.LogInfo("[RAID-REVIEW] WebSocket connected."); 
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
                catch (System.Exception ex)
                {
                    Logger.LogError($"WebSocket connection error: {ex.Message}");
                }
            });
        }
        public static Task Send(string Action, string Payload)
        {
            return Task.Run(() =>
            {
                // If enabled / true, stop sending data
                if (RAID_REVIEW.DisableDataSending.Value) return;

                // Else keep going
                try
                {
                    WsPayload wsPayload = new WsPayload
                    {
                        Action = Action,
                        Payload = Payload
                    };
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
