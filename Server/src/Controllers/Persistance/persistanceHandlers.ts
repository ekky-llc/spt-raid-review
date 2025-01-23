
const persist = {
    startRaid: async function (db, raidId, payload_object, logger) {
        const start_raid_sql = `INSERT INTO raid (raidId, profileId, location, time, timeInRaid, type, exitName, exitStatus, detectedMods, imported) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(start_raid_sql, [
            raidId,
            payload_object.profileId,
            payload_object.location,
            payload_object.time,
            payload_object.timeInRaid,
            payload_object.type,
            "",
            "",
            payload_object.detectedMods || "",
            payload_object.imported || 0,
        ]).catch((e: Error) => logger.error(`[SQL_ERR:START_RAID]`, e));
    },

    endRaid: async function (db, raidId, payload_object, logger) {
        const end_raid_sql = `INSERT INTO raid (raidId, profileId, location, time, timeInRaid, type, exitName, exitStatus, detectedMods, imported) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(end_raid_sql, [
            raidId,
            payload_object.profileId,
            payload_object.location,
            payload_object.time,
            payload_object.timeInRaid,
            payload_object.type,
            payload_object.exitName || "",
            payload_object.exitStatus || -1,
            payload_object.detectedMods || "",
            payload_object.imported || 0,
        ]).catch((e: Error) => logger.error(`[SQL_ERR:END_RAID]`, e));
    },

    updateRaidPublicStatus: async function (db, raidId, publicStatus, logger) {
        const raid_update_sql = "UPDATE raid SET public = ? WHERE raidId = ?";
        db.run(raid_update_sql, [
            raidId, 
            publicStatus
        ])
        .catch((e: Error) => logger.error(`[SQL_ERR:UPDATE_RAID_PUBLIC_STATUS]`, e));
    },

    updatePlayer: async function (db, raidId, payload_object, logger) {
        const player_update_sql = "UPDATE player SET mod_SAIN_brain = ?, mod_SAIN_difficulty = ?, type = ? WHERE raidId = ? AND profileId = ?";
        db.run(player_update_sql, [
            payload_object.mod_SAIN_brain, 
            payload_object.mod_SAIN_difficulty,
            payload_object.type, 
            raidId, 
            payload_object.profileId
        ])
        .catch((e: Error) => logger.error(`[SQL_ERR:UPDATE_PLAYER]`, e));
    },

    insertPlayerStatus: async function (db, raidId, payload_object, logger) {
        const player_status_sql = `INSERT INTO player_status (raidId, profileId, time, status) VALUES (?, ?, ?, ?)`;
        db.run(player_status_sql, [
            raidId,
            payload_object.profileId,
            payload_object.time,
            payload_object.status,
        ])
        .catch((e: Error) => logger.error(`[SQL_ERR:ADD_PLAYER_STATUS_INSERT]`, e));
    },

    checkPlayerExists: async function (db, raidId, payload_object, logger) : Promise<any[]> {
        const playerExists_sql = `SELECT * FROM player WHERE raidId = ? AND profileId = ?`;
        const playerExists = await db.all(playerExists_sql, [
            raidId, 
            payload_object.profileId
        ])
        .catch((e: Error) => logger.error(`[SQL_ERR:ADD_PLAYER_EXISTS]`, e));

        return playerExists;
    },

    insertPlayer: async function (db, raidId, payload_object, logger) {
        const player_sql = `INSERT INTO player (raidId, profileId, level, team, name, "group", spawnTime, type, mod_SAIN_brain, mod_SAIN_difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(player_sql, [
            raidId,
            payload_object.profileId,
            payload_object.level,
            payload_object.team,
            payload_object.name,
            payload_object.group,
            payload_object.spawnTime,
            payload_object.type,
            payload_object.mod_SAIN_brain,
            payload_object.mod_SAIN_difficulty
        ])
        .catch((e: Error) => logger.error(`[SQL_ERR:ADD_PLAYER_INSERT]`, e));
    },

    insertBallistic: async function (db, raidId, payload_object, logger) {
        const ballistic_sql = `INSERT INTO ballistic (raidId, time, profileId, weaponId, ammoId, hitPlayerId, source, target) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(ballistic_sql, [
            raidId,
            payload_object.time,
            payload_object.profileId,
            payload_object.weaponId,
            payload_object.ammoId,
            payload_object.hitPlayerId,
            payload_object.source,
            payload_object.target
        ]).catch((e: Error) => logger.error(`[SQL_ERR:ADD_TRACKING_BALLISTIC]`, e));
    },

    insertKill: async function (db, raidId, payload_object, logger) {
        const kill_sql = `INSERT INTO kills (raidId, time, profileId, killedId, weapon, distance, bodyPart, positionKiller, positionKilled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(kill_sql, [
            raidId,
            payload_object.time,
            payload_object.profileId,
            payload_object.killedId,
            payload_object.weapon,
            payload_object.distance,
            payload_object.bodyPart,
            payload_object.positionKiller,
            payload_object.positionKilled,
        ])
        .catch((e: Error) => logger.error(`[SQL_ERR:ADD_KILL]`, e));
    },

    insertLoot: async function (db, raidId, payload_object, logger) {
        const loot_sql = `INSERT INTO looting (raidId, profileId, time, qty, itemId, itemName, added) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        db.run(loot_sql, [
            raidId, 
            payload_object.profileId, 
            payload_object.time, 
            payload_object.qty, 
            payload_object.itemId, 
            payload_object.itemName, 
            payload_object.added
        ])
        .catch((e: Error) => logger.error(`[SQL_ERR:ADD_LOOTING]`, e));
    }
};

export {
    persist
}