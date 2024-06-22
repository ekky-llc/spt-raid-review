# Telemetry

Hello there,

This is a brief document to explain the 'Telemetry' feature in this mod.

Essentially, I'm a data nerd, and I'm interested in seeing how much data is produced by the mod and what numbers we can compile as a community.

Numbers and stats are interesting, but they become even cooler at scale.

### Where does it go?

The data is calculated on your computer and then sent to my server, which is a little Raspberry Pi 4.

All it does is take your end-of-raid statistics and dump them into a database.

Once an hour, that server aggregates all the collected data and publishes it at 'https://raid-review.online'. That's it!

### What am I after?

You wanted to know what this is about, so here is a snippet of what I'm collecting.

**Example of data collected**
```json
{ 
    "raidId": "26a62941-826d-436e-affa-6acca073f4f4",
    "location": "factory4_day",
    "status": "SURVIVED",
    "time": 324234,
    "players": {
        "total": 23,
        "usec": 4,
        "bear": 10,
        "savage": 9
    },
    "kills": {
        "total": 22,
        "usec": 3,
        "bear": 10,
        "savage": 9
    },
    "lootings": 231,
    "positions": 153457,
    "distanceTravelled": 14
}
```

It's completely anonymous, and all I'm after is some raw numbers for... wel fun?

If you don't want to be included, just switch the feature flag to `false` in the `config.json`.

### I want to review the files myself

Of course, any code related to sending data from your device can be found here: `/Server/src/Controllers/Telemetry/*`