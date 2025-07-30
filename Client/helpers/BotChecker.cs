using System;
using System.Threading.Tasks;
using EFT;
using Newtonsoft.Json;

namespace RAID_REVIEW
{
    class BotChecker
    {

        async public static void BotCheckLoop(bool endCheck)
        {
            while (RAID_REVIEW.inRaid)
            {
                if (!endCheck) await Task.Delay(30000);
                var captureTime = RAID_REVIEW.stopwatch.ElapsedMilliseconds;
                foreach (Player player in RAID_REVIEW.gameWorld.AllPlayersEverExisted)
                {
                    DeadOrUnspawnCheck(captureTime, player.ProfileId);
                }
            }
        }


        /*
        * Checks if a bot is either 'Dead' or 'Unspawned', and sends that back to the server.
        * Implemented because mods like 'SWAG+Donuts' despawn bots, and this needs to be reflected in the review screen.
        */
        public static void DeadOrUnspawnCheck(long captureTime, string profileId)
        {
            var newDeadOrUnspawn = new TrackingPlayerDeadOrUnspawned
            {
                sessionId = RAID_REVIEW.sessionId,
                profileId = profileId,
                time = captureTime,
            };

            var player = RAID_REVIEW.gameWorld.GetEverExistedPlayerByID(profileId);

            /*
            * If for whatever reason we are able to get a 'null' result, we have not acounted for something because
            * we shoulnd't be able to track a player with a MongoId if the player didn't previously exist.
            */
            if (player == null) 
            {
                newDeadOrUnspawn.status = PlayerStatus.Unknown;
                Telemetry.Send("PLAYER_STATUS", JsonConvert.SerializeObject(newDeadOrUnspawn));
                return;
            }

            if (player != null) 
            {
                
                // Checks the player to see if they are 'Dead' without a 'KillerId', meaning they were 'Unspawned' we presume...
                // - SWAG+DONUTS: During the despawn process the Bot is marked as 'Died', so naturally we can check this to confirm a despawn.
                // - Client Mod References: https://github.com/dvize/Donuts/blob/044e117e306ddf30ce91bd0aa8d0ab98dbc182ab/DonutComponent.cs#L485
                if (!player.HealthController.IsAlive && player.KillerId == null) {
                    newDeadOrUnspawn.status = PlayerStatus.Unspawned;
                    Telemetry.Send("PLAYER_STATUS", JsonConvert.SerializeObject(newDeadOrUnspawn));
                    return;
                }
            
                // Checks if the player is 'Dead', and sends that to the database.
                if (!player.HealthController.IsAlive)
                {
                    newDeadOrUnspawn.status = PlayerStatus.Dead;
                    Telemetry.Send("PLAYER_STATUS", JsonConvert.SerializeObject(newDeadOrUnspawn));
                    return;
                }

                // Checks if the player is 'Alive', and sends that to the database.
                if (player.HealthController.IsAlive)
                {
                    newDeadOrUnspawn.status = PlayerStatus.Alive;
                    Telemetry.Send("PLAYER_STATUS", JsonConvert.SerializeObject(newDeadOrUnspawn));
                    return;
                }


            }
        }
    }

}
