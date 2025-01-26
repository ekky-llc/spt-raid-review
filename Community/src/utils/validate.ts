

export function validateRaidSharePayload(payload: RaidUploadPayload): string[] {
    const errors: string[] = [];
    if (!payload.title || typeof payload.title !== 'string') {
      errors.push('Title is required and should be a string.');
    }
  
    if (!payload.description || typeof payload.description !== 'string') {
      errors.push('Description is required and should be a string.');
    }
  
    if (!payload.uploadToken || typeof payload.uploadToken !== 'string') {
      errors.push('Upload token is required and should be a string.');
    }
  
    if (!payload.isPublic || (payload.isPublic !== true && payload.isPublic !== false)) {
      errors.push('isPublic should be a string with a value of "true" or "false".');
    }
  
    if (!payload.overwriteOldest || (payload.overwriteOldest !== true && payload.overwriteOldest !== false)) {
      errors.push('isPublic should be a string with a value of "true" or "false".');
    }

    if (!payload.raidId || typeof payload.raidId !== 'string') {
      errors.push('Raid ID is required and should be a string.');
    }
  
    if (!payload.location || typeof payload.location !== 'string') {
      errors.push('Location is required and should be a string.');
    }
  
    if (!payload.timeInRaid || typeof payload.timeInRaid !== 'string') {
      errors.push('Time in raid is required and should be a string.');
    }

    if (!payload.exitStatus || typeof payload.exitStatus !== 'string') {
      errors.push('Exit status is required and should be a string.');
    }
  
    return errors;
}
  

export interface RaidUploadPayload {
  title: string
  description: string
  uploadToken: string
  isPublic: boolean
  overwriteOldest: boolean
  raidId: string
  location: string
  timeInRaid: string
  exitName: string
  exitStatus: string
}


export function validateRaidShareDatafile(datafile: RaidShareDatafile): string[] {
  const errors: string[] = [];

  // Validate 'raid' object
  const raid = datafile.raid;
  
  if (!raid) {
    errors.push("Missing 'raid' object.");
  } else {
    if (typeof raid.id !== 'number') errors.push("Invalid 'raid.id'. Expected a number.");
    if (typeof raid.raidId !== 'string') errors.push("Invalid 'raid.raidId'. Expected a string.");
    if (typeof raid.profileId !== 'string') errors.push("Invalid 'raid.profileId'. Expected a string.");
    if (typeof raid.location !== 'string') errors.push("Invalid 'raid.location'. Expected a string.");
    if (typeof raid.time !== 'string') errors.push("Invalid 'raid.time'. Expected a string.");
    if (typeof raid.timeInRaid !== 'string') errors.push("Invalid 'raid.timeInRaid'. Expected a string.");
    if (typeof raid.exitName !== 'string') errors.push("Invalid 'raid.exitName'. Expected a string.");
    if (typeof raid.exitStatus !== 'string') errors.push("Invalid 'raid.exitStatus'. Expected a string.");
    if (typeof raid.detectedMods !== 'string') errors.push("Invalid 'raid.detectedMods'. Expected a string.");
    if (typeof raid.created_at !== 'string') errors.push("Invalid 'raid.created_at'. Expected a string.");
    if (typeof raid.type !== 'string') errors.push("Invalid 'raid.type'. Expected a string.");
    if (typeof raid.imported !== 'number') errors.push("Invalid 'raid.imported'. Expected a number.");
    if (typeof raid.public !== 'number') errors.push("Invalid 'raid.public'. Expected a number.");
    if (typeof raid.positionsTracked !== 'string') errors.push("Invalid 'raid.positionsTracked'. Expected a string.");

    // Validate 'kills' array
    if (!Array.isArray(raid.kills)) {
      errors.push("Invalid 'raid.kills'. Expected an array.");
    } else {
      raid.kills.forEach((kill, index) => {
        if (typeof kill.id !== 'number') errors.push(`Invalid 'kill[${index}].id'. Expected a number.`);
        if (typeof kill.raidId !== 'string') errors.push(`Invalid 'kill[${index}].raidId'. Expected a string.`);
        if (typeof kill.profileId !== 'string') errors.push(`Invalid 'kill[${index}].profileId'. Expected a string.`);
        if (typeof kill.time !== 'number') errors.push(`Invalid 'kill[${index}].time'. Expected a number.`);
        if (typeof kill.killedId !== 'string') errors.push(`Invalid 'kill[${index}].killedId'. Expected a string.`);
        if (typeof kill.weapon !== 'string') errors.push(`Invalid 'kill[${index}].weapon'. Expected a string.`);
        if (typeof kill.distance !== 'string') errors.push(`Invalid 'kill[${index}].distance'. Expected a string.`);
        if (typeof kill.bodyPart !== 'string') errors.push(`Invalid 'kill[${index}].bodyPart'. Expected a string.`);
        if (typeof kill.positionKilled !== 'string') errors.push(`Invalid 'kill[${index}].positionKilled'. Expected a string.`);
        if (typeof kill.positionKiller !== 'string') errors.push(`Invalid 'kill[${index}].positionKiller'. Expected a string.`);
        if (typeof kill.created_at !== 'string') errors.push(`Invalid 'kill[${index}].created_at'. Expected a string.`);
      });
    }

    // Validate 'looting' array
    if (!Array.isArray(raid.looting)) {
      errors.push("Invalid 'raid.looting'. Expected an array.");
    } else {
      raid.looting.forEach((loot, index) => {
        if (typeof loot.id !== 'number') errors.push(`Invalid 'looting[${index}].id'. Expected a number.`);
        if (typeof loot.raidId !== 'string') errors.push(`Invalid 'looting[${index}].raidId'. Expected a string.`);
        if (typeof loot.profileId !== 'string') errors.push(`Invalid 'looting[${index}].profileId'. Expected a string.`);
        if (typeof loot.time !== 'string') errors.push(`Invalid 'looting[${index}].time'. Expected a string.`);
        if (typeof loot.qty !== 'string') errors.push(`Invalid 'looting[${index}].qty'. Expected a string.`);
        if (typeof loot.itemId !== 'string') errors.push(`Invalid 'looting[${index}].itemId'. Expected a string.`);
        if (typeof loot.itemName !== 'string') errors.push(`Invalid 'looting[${index}].itemName'. Expected a string.`);
        if (typeof loot.added !== 'string') errors.push(`Invalid 'looting[${index}].added'. Expected a string.`);
        if (typeof loot.created_at !== 'string') errors.push(`Invalid 'looting[${index}].created_at'. Expected a string.`);
      });
    }

    // Validate 'player_status' array
    if (!Array.isArray(raid.player_status)) {
      errors.push("Invalid 'raid.player_status'. Expected an array.");
    } else {
      raid.player_status.forEach((status, index) => {
        if (typeof status.id !== 'number') errors.push(`Invalid 'player_status[${index}].id'. Expected a number.`);
        if (typeof status.raidId !== 'string') errors.push(`Invalid 'player_status[${index}].raidId'. Expected a string.`);
        if (typeof status.profileId !== 'string') errors.push(`Invalid 'player_status[${index}].profileId'. Expected a string.`);
        if (typeof status.time !== 'number') errors.push(`Invalid 'player_status[${index}].time'. Expected a number.`);
        if (typeof status.status !== 'string') errors.push(`Invalid 'player_status[${index}].status'. Expected a string.`);
      });
    }

    // Validate 'ballistic' array
    if (!Array.isArray(raid.ballistic)) {
      errors.push("Invalid 'raid.ballistic'. Expected an array.");
    } else {
      raid.ballistic.forEach((ballistic, index) => {
        if (typeof ballistic.id !== 'number') errors.push(`Invalid 'ballistic[${index}].id'. Expected a number.`);
        if (typeof ballistic.raidId !== 'string') errors.push(`Invalid 'ballistic[${index}].raidId'. Expected a string.`);
        if (typeof ballistic.profileId !== 'string') errors.push(`Invalid 'ballistic[${index}].profileId'. Expected a string.`);
        if (typeof ballistic.time !== 'number') errors.push(`Invalid 'ballistic[${index}].time'. Expected a number.`);
        if (typeof ballistic.weaponId !== 'string') errors.push(`Invalid 'ballistic[${index}].weaponId'. Expected a string.`);
        if (typeof ballistic.ammoId !== 'string') errors.push(`Invalid 'ballistic[${index}].ammoId'. Expected a string.`);
        if (ballistic.hitPlayerId && typeof ballistic.hitPlayerId !== 'string') errors.push(`Invalid 'ballistic[${index}].hitPlayerId'. Expected a string or undefined.`);
        if (typeof ballistic.source !== 'string') errors.push(`Invalid 'ballistic[${index}].source'. Expected a string.`);
        if (typeof ballistic.target !== 'string') errors.push(`Invalid 'ballistic[${index}].target'. Expected a string.`);
        if (typeof ballistic.created_at !== 'string') errors.push(`Invalid 'ballistic[${index}].created_at'. Expected a string.`);
      });
    }
  }

  // Validate 'positions' object
  if (typeof datafile.positions !== 'object') {
    errors.push("Invalid 'positions'. Expected an object.");
  } else {
    Object.keys(datafile.positions).forEach((key) => {
      const positionsArray = datafile.positions[key];
      if (!Array.isArray(positionsArray)) {
        errors.push(`Invalid 'positions[${key}]'. Expected an array.`);
      } else {
        positionsArray.forEach((position, index) => {
          if (typeof position.sessionId !== 'string') errors.push(`Invalid 'positions[${key}][${index}].sessionId'. Expected a string.`);
          if (typeof position.profileId !== 'string') errors.push(`Invalid 'positions[${key}][${index}].profileId'. Expected a string.`);
          if (typeof position.time !== 'number') errors.push(`Invalid 'positions[${key}][${index}].time'. Expected a number.`);
          if (typeof position.x !== 'number') errors.push(`Invalid 'positions[${key}][${index}].x'. Expected a number.`);
          if (typeof position.y !== 'number') errors.push(`Invalid 'positions[${key}][${index}].y'. Expected a number.`);
          if (typeof position.z !== 'number') errors.push(`Invalid 'positions[${key}][${index}].z'. Expected a number.`);
          if (typeof position.dir !== 'number') errors.push(`Invalid 'positions[${key}][${index}].dir'. Expected a number.`);
          if (typeof position.health !== 'number') errors.push(`Invalid 'positions[${key}][${index}].health'. Expected a number.`);
          if (typeof position.maxHealth !== 'number') errors.push(`Invalid 'positions[${key}][${index}].maxHealth'. Expected a number.`);
        });
      }
    });
  }

  // Validate 'players' array
  if (!Array.isArray(raid.players)) {
    errors.push("Invalid 'raid.players'. Expected an array.");
  } else {
    raid.players.forEach((player, index) => {
      if (typeof player.id !== 'number') errors.push(`Invalid 'players[${index}].id'. Expected a number.`);
      if (typeof player.raidId !== 'string') errors.push(`Invalid 'players[${index}].raidId'. Expected a string.`);
      if (typeof player.profileId !== 'string') errors.push(`Invalid 'players[${index}].profileId'. Expected a string.`);
      if (typeof player.level !== 'number') errors.push(`Invalid 'players[${index}].level'. Expected a number.`);
      if (typeof player.team !== 'string') errors.push(`Invalid 'players[${index}].team'. Expected a string.`);
      if (typeof player.name !== 'string') errors.push(`Invalid 'players[${index}].name'. Expected a string.`);
      if (typeof player.group !== 'number') errors.push(`Invalid 'players[${index}].group'. Expected a number.`);
      if (typeof player.spawnTime !== 'number') errors.push(`Invalid 'players[${index}].spawnTime'. Expected a number.`);
      if (typeof player.created_at !== 'string') errors.push(`Invalid 'players[${index}].created_at'. Expected a string.`);
      if (typeof player.mod_SAIN_brain !== 'string') errors.push(`Invalid 'players[${index}].mod_SAIN_brain'. Expected a string.`);
      if (typeof player.type !== 'string') errors.push(`Invalid 'players[${index}].type'. Expected a string.`);
      if (typeof player.mod_SAIN_difficulty !== 'string') errors.push(`Invalid 'players[${index}].mod_SAIN_difficulty'. Expected a string.`);
    });
  }

  return errors;
}

export interface RaidShareDatafile {
  raid: {
    id: number
    raidId: string
    profileId: string
    location: string
    time: string
    timeInRaid: string
    exitName: string
    exitStatus: string
    detectedMods: string
    created_at: string
    type: string
    imported: number
    public: number
    kills: Array<{
      id: number
      raidId: string
      profileId: string
      time: number
      killedId: string
      weapon: string
      distance: string
      bodyPart: string
      positionKilled: string
      positionKiller: string
      created_at: string
    }>
    looting: Array<{
      id: number
      raidId: string
      profileId: string
      time: string
      qty: string
      itemId: string
      itemName: string
      added: string
      created_at: string
    }>
    player_status: Array<{
      id: number
      raidId: string
      profileId: string
      time: number
      status: string
    }>
    ballistic: Array<{
      id: number
      raidId: string
      profileId: string
      time: number
      weaponId: string
      ammoId: string
      hitPlayerId: any
      source: string
      target: string
      created_at: string
    }>
    positionsTracked: string
    players: Array<{
      id: number
      raidId: string
      profileId: string
      level: number
      team: string
      name: string
      group: number
      spawnTime: number
      created_at: string
      mod_SAIN_brain: string
      type: string
      mod_SAIN_difficulty: string
    }>
  }
  positions: {
    [key: string]: Array<{
      sessionId: string
      profileId: string
      time: number
      x: number
      y: number
      z: number
      dir: number
      health: number
      maxHealth: number
    }>
  }
}

export interface positonalData {
    sessionId: string
    profileId: string
    time: number
    x: number
    y: number
    z: number
    dir: number
    health: number
    maxHealth: number
}