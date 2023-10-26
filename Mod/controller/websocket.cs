using BepInEx;
using UnityEngine;
using System;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace SPTH
{
    public class Server : MonoBehaviour
    {
        private bool sentWebSocket = false;
        private WebSocket webSocket;

        void Start()
        {
            Uri serverUri = new Uri("wss://example.com/ws");

            try
            {
                await webSocket.ConnectAsync(serverUri, CancellationToken.None);
                Console.WriteLine("WebSocket connected!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"WebSocket connection error: {ex.Message}");
            }
        }

        void Update()
        {
            if (!sentWebSocket)
            {
                string message = "Connecting from SPT-AKI via the SPTH plugin.";
                byte[] messageBytes = Encoding.UTF8.GetBytes(message);
                await webSocket.SendAsync(new ArraySegment<byte>(messageBytes), WebSocketMessageType.Text, true, CancellationToken.None);
                Console.WriteLine("Sent: " + message);
            }
        }

        void OnApplicationQuit()
        {
            if (webSocket != null)
            {
                await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing WebSocket", CancellationToken.None);
            }
        }

        public string SendData(string payload)
        {
            byte[] messageBytes = Encoding.UTF8.GetBytes(payload);
            await webSocket.SendAsync(new ArraySegment<byte>(messageBytes), WebSocketMessageType.Text, true, CancellationToken.None);
            return "OK";
        }
    }
}