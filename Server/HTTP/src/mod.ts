// not too confident with routers so sorry if I drop the ball here
import { DependencyContainer } from "tsyringe";
import type { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import type { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import type { DynamicRouterModService } from "@spt-aki/services/mod/dynamicRouter/DynamicRouterModService";
import type { StaticRouterModService } from "@spt-aki/services/mod/staticRouter/StaticRouterModService";

class Mod implements IPreAkiLoadMod
{
    public preAkiLoad(container: DependencyContainer): void 
    {
        const json = require("Example.json");
        const logger = container.resolve<ILogger>("WinstonLogger");
        const dynamicRouterModService = container.resolve<DynamicRouterModService>("DynamicRouterModService");
        const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");
        // You can communicate between the client and server using routes
        // Using the HTTP router, you can send a request with the url to a router and the server will send a response through to the client
        // with the JSON data that the router sends

        // static router we'll use to pull a string from the json
        staticRouterModService.registerStaticRouter(
            "spthrouter_start",
            [
                {
                    url: "/spth/start",
                    action: (url, info, sessionID, output) => 
                    {
                        logger.info(info)
                        return true; // this is what the server will send to your client mod when you request JSON
                    }
                }
            ],
            "spth"
        );

        staticRouterModService.registerStaticRouter(
            "spthrouter_end",
            [
                {
                    url: "/spth/end",
                    action: (url, info, sessionID, output) => 
                    {
                        logger.info(info)
                        return true; // this is what the server will send to your client mod when you request JSON
                    }
                }
            ],
            "spth"
        );

        staticRouterModService.registerStaticRouter(
            "spthrouter_telemetry",
            [
                {
                    url: "/spth/telemetry",
                    action: (url, info, sessionID, output) => 
                    {
                        logger.info(info)
                        return; // this is what the server will send to your client mod when you request JSON
                    }
                }
            ],
            "spth"
        );
    }
}
module.exports = {mod: new Mod()}