using Newtonsoft.Json;
using System.Collections.Generic;

// AKI Modules have an HTTP request system that allows you to send a request using a router and recieve JSON data
// depending on the router URL you call, view the TS to see how to setup your own router so you can communicate from your
// plugin to your server mod for things like configs, profile data, etc and check the dev site for what routers already exist

namespace SPTH
{
    public class Telemetry
    {
        public static bool StartRaid(HttpRaidStart payload)
        {
            var req = Aki.Common.Http.RequestHandler.PostJson("/spth/start", JsonConvert.SerializeObject(payload)); // input the URL you set
            return bool.Parse(req.ToString());
        }
        public static bool EndRaid(HttpRaidEnd payload)
        {
            var req = Aki.Common.Http.RequestHandler.PostJson("/spth/end", JsonConvert.SerializeObject(payload));
            return bool.Parse(req.ToString());
        }
        public static void SendTelemetry(HttpRaidTelemetry payload)
        {
            Aki.Common.Http.RequestHandler.PostJson("/spth/int", JsonConvert.SerializeObject(payload));
        }
    }
}