# RAID-REVIEW Mod - SPT Server Backend

This is the `Stats Mod Backend` for `SPT-AKI`; used to collect information from the `RAID-REVIEW Mod Client`.

This runs it's own `Websocket Server` for capturing telemetry from the game; and a `HTTP Server` which serves both the API and client application to display the collected in-game data.

## Data Capture Process

The mod for the client has been developed to patch various `C# Methods` with the Bepinx Framework; the targeted methods are used by the game to perform general tasks (e.g. shooting, applying damage, startings/ending raids).

Data is structured in our own custom `C# Classes` and serialised to JSON; and sent via websockets from the client to the backend in-real time; and the data recieved on the backend is written to RAID specific folders (`<mod_folder>/data/<raid_id>/`) and then appended to subsequent `.csv` files for each captured data point (`<mod_folder>/data/<raid_id>/<raid_id>_<data_point>.csv`).

Once a RAID has been completed; a workflow is started to collate the data into a `.json` file in the same RAID Specific folder that can be later consumed by the `HTTP Server` and exposed via the API.


## Data Points

- Raid Details
- Kills
- Looting
- Position / Health (Experimental)

## FAQ

**Why is everything stored as a .CSV; and not directly as a .JSON file?**

1) Almost everyone is fimilar with working in Microsoft Excel; or something similar. This makes it super accessible for debugging / reviewing data opposed to reviewing `.json` files which are very verbose, and filters are not readibly available.

2) It is also very simple and fast to append new lines to `.csv` files with the native node file system module, opposed to reading a `.json` file, parsing it with `JSON.parse(data)`, adding the data, then serialising it again before writing it to the filesystem.
   
3) If there were any data corruptions during the capturing process, I wanted to give people the ability to traverse the data themselves without needing to understand how to look at `.json` files.