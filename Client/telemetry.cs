using Newtonsoft.Json;
using WebSocketSharp;
using System.Collections.Generic;

// AKI Modules have an HTTP request system that allows you to send a request using a router and recieve JSON data
// depending on the router URL you call, view the TS to see how to setup your own router so you can communicate from your
// plugin to your server mod for things like configs, profile data, etc and check the dev site for what routers already exist

namespace STATS
{
    public class Telemetry
    {
        public static WebSocket ws = null;

        public static void Connect(string host)
        {
            ws = new WebSocket(host);
            ws.Connect();
            ws.Send("Connected");
        }

        public static void Send(string Action, string Payload)
        {
            WsPayload wsPayload = new WsPayload();
            wsPayload.Action = Action;
            wsPayload.Payload = Payload;
            ws.Send(JsonConvert.SerializeObject(wsPayload));
        }
    }
}