# Getting FIKA Working

### Hurdles

1. I need to be able to determine who is connected to the server.
2. I need to know what active matches there are, and who is in the match
3. I need to know who is sending data, and completely move the guess work away from server side.
4. If a player sends data to Raid-Review, there needs to be a check if people are in the same game with Raid-Review, and determine whos data to use as the source of truth.
5. Figure out how Fika determines a match is over

---

### 1. I need to be able to determine who is connected to the server

- I don't think it matters who is connected, just who is connected with Raid-Review installed. A route that pings from the Raid-Review client will do the job, and keeps them in a 'connected' list that looks like this `MAP<string, string>`.

### 2. I need to know what active matches there are, and who is in the match

- Getting matches seems easy enough just need to reference this method somehow:'[getAllMatches()](https://github.com/project-fika/Fika-Server/blob/1a78a8aed3f293b5ea6597b5cfb73a07efd527af/src/services/FikaMatchService.ts#L83)'.
- Getting players in matches also seems easy with this method: '[getPlayerInMatch(matchId: string, playerId: string)](https://github.com/project-fika/Fika-Server/blob/1a78a8aed3f293b5ea6597b5cfb73a07efd527af/src/services/FikaMatchService.ts#L101)'

### 3. I need to know who is sending data.

- Get rid of the Raid ID Generation being handled in the Client, and handle this server side.
- Ensure that all requests have a `profileId` that can be referenced on the server and attached to a `match`.

### 4. If a player sends data to Raid-Review, there needs to be a check if people are in the same game with Raid-Review, and determine whos data to use as the source of truth.

- If I can get the `profileId` of all the players in the match, I can refer back to the 'register' route that gets called from the Raid-Review client mod.
- Pick the person who registered first, and give priority to the host of the match.
- Each player in the raid should get their own entry in the database for the raid.

### 5. Figure out how Fika determines a match is over, and how that fits into marking the end of a raid for Raid-Review.

- Looks like this should be pretty simple to do, need to confirm my proposed approach. However, if we keep checking the match player list against registered / connected players with the `raid-review` client. 
  - If a player is in an active match, and they are found in the `raid-review` connected list, then keep recording that match.
  - If there are NO matching players found in the `raid-review` connected list, write an end market to the raid table.

[Message to Fika Devs in #mod-development](https://discord.com/channels/1202292159366037545/1233778910207148072/1254610861171937330)
```
Trying to figure how and when Fika actually ends a match versus the use of EFT.Player.OnGameSessionEnd for normal vanilla SPT.

Am I correct in assuming that a Fika match just keeps going until either the host ends the match, or the timeout ends the match automatically via FikaMatchService.endMatch(...).

Reference: https://github.com/search?q=repo%3Aproject-fika/Fika-Server%20endMatch&type=code

Are there other ways a 'match' can end, or is this pretty much it? 
```

### Fika Resources

- https://github.com/project-fika/Fika-Documentation
- https://github.com/project-fika/Fika-Server
- https://github.com/project-fika/Fika-Plugin

