import { Link, Outlet, redirect, useLoaderData } from "react-router-dom";
import { useEffect, useState } from "react";
import _ from 'lodash';

import api from "../api/api";
import cyr_to_en from '../assets/cyr_to_en.json';
import BotMapping from '../assets/botMapping.json';

import "./Raid.css";
import { TrackingRaidData, TrackingRaidDataPlayers } from "../types/api_types";
import { locations } from "./Profile";
import { getCookie } from "../modules/utils";

export async function loader(loaderData: any) {
  const profileId = loaderData.params.profileId as string;
  const raidId = loaderData.params.raidId as string;
  const intl = await api.getIntl();
  
  const intl_dir : StringIndex = {...intl, ...cyr_to_en};

  const raidData = (await api.getRaid(
    profileId,
    raidId
  )) as TrackingRaidData;

  if (!raidData) {
    return redirect(`/p/${profileId}`);
  }

  return { profileId, raidData, intl_dir };
}

interface StringIndex {
  [key: string]: string;
}

export function intl(string: string, intl_dir: Record<string, string>) {
  const translated = intl_dir[string];
  if (translated) return translated;
  return string;
}

export default function Raid() {
  const [ filters, setFilters ] = useState(["KILLS"]);
  const [ isAdmin, setIsAdmin ] = useState(false);
  const [ playerFilter, setPlayerFilter ] = useState([] as string[]);
  const [ raidSummary, setRaidSummary ] = useState([] as { title: string, value: any }[]);
  const [ playersByGroup, setPlayersByGroup ] = useState({} as { [key:string] : TrackingRaidDataPlayers[] })
  const [ groupingType, setGroupingType ] = useState('group');
  const [ playerGrouping, setPlayerGrouping ] = useState(true);
  const [ showSainDetails, setShowSainDetails ] = useState(false);
  const { profileId, raidData, intl_dir } = useLoaderData() as { profileId: string; raidData: TrackingRaidData; intl_dir: Record<string, string>};

  useEffect(() => {
    if (raidData === undefined) return;

    // If Basic Auth is on, check if is_admin
    const is_auth_configured_cookie = getCookie('is_auth_configured_cookie');
    if (is_auth_configured_cookie === "true") {

      // If is admin, display raid settings.
      const is_admin_cookie = getCookie('is_admin_cookie');
      if (is_admin_cookie === "true") {
        setIsAdmin(true);
      }
    } 
    
    // If Basic Auth is off, display raid settings.
    else {
      setIsAdmin(true);
    }

    const groupedPlayers = _.chain(raidData.players).map(p => {

      return {
        ...p,
        group : Number(p.group)
      }
    }).orderBy(groupingType).groupBy(groupingType).value();
    setPlayersByGroup(groupedPlayers);

    const selectedPlayers = _.map(raidData.players, (p) => p.profileId);
    setPlayerFilter(selectedPlayers);

    let newRaidSummary = [];

    newRaidSummary.push({
      title: 'Map',
      // @ts-ignore
      value: locations[raidData.location]
    });

    newRaidSummary.push({
      title: 'Status',
      value: raidData.exitStatus
    });

    newRaidSummary.push({
      title: 'Extract Point',
      value: raidData.exitName || '-'
    });

    newRaidSummary.push({
      title: 'Detected Mods',
      // @ts-ignore
      value: raidData.detectedMods
    });

    newRaidSummary.push({
      title: 'Time In Raid',
      value: msToHMS(Number(raidData.timeInRaid))
    });

    newRaidSummary.push({
      title: 'Players/Bots',
      value: raidData.players ? raidData.players.length : 0
    });

    newRaidSummary.push({
      title: 'Kills',
      value: raidData.kills ? raidData.kills.length : 0
    });

    if (raidData.detectedMods.includes('SAIN')) {
      setShowSainDetails(true);
    }

    let positionsTrackedMap = { "COMPILED" : "Available", "RAW" : "Processing", "NOT_AVAILABLE" : "Not Available" }
    newRaidSummary.push({
      title: 'Positional Data',

      // @ts-ignore
      value: raidData.positionsTracked ? positionsTrackedMap[raidData.positionsTracked] : 'N/A'
    });


    setRaidSummary(newRaidSummary);
  }, [raidData, groupingType])

  const bodypart = {
    Head: "Headshot",
    LeftArm: "Left Arm",
    RightArm: "Right Arm",
    LeftLeg: "Left Leg",
    RightLeg: "Right Leg",
    Chest: "Thorax",
  };

  const team = {
    Bear: "BEAR",
    Usec: "USEC",
    Savage: "SCAV",
  };

  function msToHMS( ms: number ) : string {
    return new Date(ms).toISOString().slice(11,19);
  }

  function isFilterActive(filter:string) {
    return filters.find(filterToCheck => filterToCheck === filter);
  }

  function toggleGroupingFilter(type: string) {
    if (playerGrouping) {
      if (groupingType === type) {
        // If the current type is the same as the clicked type, remove all grouping
        setPlayerGrouping(false);
        setGroupingType('');
      } else {
        // If the current type is different, switch to the new type
        setGroupingType(type);
      }
    } else {
      // If grouping is currently off, turn it on with the new type
      setGroupingType(type);
      setPlayerGrouping(true);
    }
  };

  function togglePlayerFilter(playerId: string) {
    let newPlayerFilter = [...playerFilter];
    const filterExists = newPlayerFilter.find(playerIdToCheck => playerIdToCheck === playerId);
    if (filterExists) {
      newPlayerFilter = newPlayerFilter.filter(playerIdToCheck => playerIdToCheck !== playerId);
    } else {
      newPlayerFilter.push(playerId);
    }

    setPlayerFilter(newPlayerFilter);
  }

  function playerIsFiltered(playerId: string): boolean {
    return !!playerFilter.find((p) => p === playerId);
  }

  function toggleTimelineFilter(filter: string) {
    let newFilters = [...filters];
    const filterExists = newFilters.find(filterToCheck => filterToCheck === filter);
    if (filterExists) {
      newFilters = newFilters.filter( filterToRemove => filterToRemove !== filter);
    } else {
      newFilters.push(filter);
    }

    setFilters(newFilters);
  }

  function playerWasKilled(playerId: string): boolean {
    if (raidData && raidData.kills) {
      return !!raidData.kills.find((kill) => kill.killedId === playerId);
    } else {
      return false;
    }
  }

  function getPlayerBrain(player: TrackingRaidDataPlayers): string {
    if (player) {
    
      // @ts-ignore
      let botMapping = BotMapping[player.type];
      if (player.name === "Knight") {
        botMapping = {
          type: 'GOON'
        };
      }
      if (!botMapping) {
          botMapping = {
              type: 'UNKNOWN'
          };
      }
    
      switch (botMapping.type){
          case 'BOSS':
              return "BOSS"
          case 'RAIDER':
              return "RAIDER"
          case 'FOLLOWER':
              return "FOLLOWER"
          case 'PLAYER_SCAV':
              return "PLAYER SCAV"
          case 'SNIPER':
              return "SNIPER"
          case 'GOON':
              return "GOON"
          case 'ROGUE':
              return "ROGUE"
          case 'CULT':
              return "CULTIST"
          case 'BLOODHOUND':
              return "BLOODHOUND"
          default:
              if(player.team === "Savage") {
                return ""
              } 
              return player.mod_SAIN_brain != null ? `${player.mod_SAIN_brain}` : "(PMC)"
      }
    }

    return "(UNKNOWN)"
  }

  function getPlayerDifficultyAndBrain(player: TrackingRaidDataPlayers): string {
    if (!showSainDetails) return '';

    if (player) {
      let difficulty = player.mod_SAIN_difficulty;
      let brain = getPlayerBrain(player);

      if (difficulty !== null && difficulty !== "") {
        if(player.team === "Savage" && brain === "") {
          return difficulty;
        }
        return `[${difficulty}] [${brain}]`;
      }

      else if (player.team === "Savage") {
        if(brain !== null && brain !== "") {
          return `[${brain}]`;
        }
        else return "";
      }

      return `[${brain}]`;
    }

    return "";
  }

  function generateMapPlaybackButton(positionDataStatus: string) {

    if (positionDataStatus === 'RAW') {
      return (
        <button disabled className="text-sm p-2 py-1 text-sm cursor-not-allowed bg-eft flex items-center font-black opacity-50 border border-black/0 mr-3">
          Processing Playback Data
        </button>
      )
    }

    if (positionDataStatus === 'COMPILED') {
      return (
        <Link to={`/p/${profileId}/raid/${raidData.raidId}/map`} className="text-sm p-2 py-1 text-sm cursor-pointer bg-eft flex items-center font-black hover:opacity-75 border border-black/0 mr-3">
          View Map Playback
        </Link>
      )
    }

    return (
      <button disabled className="text-sm p-2 py-1 text-sm cursor-not-allowed bg-eft flex items-center font-black opacity-50 border border-black/0 mr-3">
        View Map Playback
      </button>
    )
    
  }

  function generateTimeline(filters: string[]): any {

    if (raidData && raidData.kills && raidData.looting && raidData.players) {
      let combined = [] as any[];
      if (filters.includes('KILLS')) {
        combined = [ ...combined, ...raidData.kills ];
      }
      if (filters.includes('LOOT')) {
        combined = [ ...combined, ...raidData.looting ]
      }

      combined.map((tli) => {
        tli.time = Number(tli.time);
        return tli;
      });
      combined.sort((a, b) => a.time - b.time);

      return combined.map((tli: any, index) => {
        if (raidData.players === undefined) return;

        const killer = raidData.players.find(
          (player) => player.profileId === tli.profileId
        );
        const killed = raidData.players.find(
          (player) => player.profileId === tli.killedId
        );
        const looter = raidData.players.find(
          (player) => player.profileId === tli.profileId
        );

        let playerIsFiltered = playerFilter.find( p => p === tli.profileId || p === tli.killedId);
        if (!playerIsFiltered) return;

        return (
            <li key={`${tli.time}_${index}`}>
              {tli.weapon ? (
                <>
                  {/* @ts-ignore */}
                  <span className="opacity-75">{msToHMS(tli.time)} - </span>
                  <strong>{killer ? intl(killer.name, intl_dir) : "Unknown"}</strong>
                  <span className="opacity-75"> killed </span>
                  <strong>{killed ? intl(killed.name, intl_dir) : "Unknown"}</strong>
                  <span className="opacity-75"> with a </span>
                    {/* @ts-ignore */}
                  <strong>{ intl([tli.weapon.replace("Name", "ShortName")], intl_dir) } [{bodypart[tli.bodyPart]? bodypart[tli.bodyPart]: tli.bodyPart}] [{ Number(tli.distance).toFixed(2) }m]</strong>
                </>
              ) : (
                <>
                  {/* @ts-ignore */}
                  <span className="opacity-75">{msToHMS(tli.time)} - </span>
                  <strong>{looter ? intl(looter.name, intl_dir) : "Unknown"}</strong>
                  <span className="opacity-75">
                    {Number(tli.added) ? " looted " : " dropped "}
                  </span>{" "}
                  <strong>
                    {/* @ts-ignore */}
                    {tli.qty}x { intl([tli.itemName.replace("Short", "")], intl_dir) }
                  </strong>
                </>
              )}
            </li>
        );
      });

    }

  }

  return (
    <>
      <section className="border border-eft py-4 px-6 mb-5 relative">
        <h2 className="text-xl font-black text-eft">Raid Summary</h2>
        <div id="raid_summary">
          { raidSummary.map( raidSum => <div key={raidSum.title} className="text text-eft">
            <strong>{ raidSum.title }</strong>
            <p>{ raidSum.value }</p>
          </div>) }
        </div>
        {
          isAdmin ? 
          <Link to={`/p/${profileId}/raid/${raidData.raidId}/settings`} className="raid_more_settings cursor-pointer bg-eft p-1 text-xs font-black flex hover:opacity-75">
            Raid Settings
          </Link> : ''
        }
      </section>
      <section className="flex w-100 gap-4">
        <div className="border border-eft w-2/6 py-4 px-6">
          <nav className="mb-5 flex justify-between items-start">
            <h2 className="text-xl font-black text-eft mb-3">Players & Bots</h2>
            <div className="flex gap-4">
              { raidData.detectedMods.length > 0 ? 
                <ul className="flex items-center gap-2 border border-eft p-1">
                  <span className="text-eft">Toggle:</span>
                  { raidData.detectedMods.includes('SAIN') ? 
                    <li onClick={() => setShowSainDetails(!showSainDetails)} className={`text-sm p-2 py-1 text-sm cursor-pointer ${showSainDetails ? "bg-eft font-black hover:opacity-75 border border-black/0": "border border-eft text-eft"}`}>SAIN</li>
                  : ''}
                </ul>
              : '' }
              <ul className="flex items-center gap-2 border border-eft p-1">
                <span className="text-eft">Group By:</span>
                <li
                  className={`text-sm p-2 py-1 text-sm cursor-pointer ${
                    playerGrouping && groupingType === 'group'
                    ? "bg-eft font-black hover:opacity-75 border border-black/0"
                    : "border border-eft text-eft"
                  }`}
                  onClick={() => toggleGroupingFilter('group')}
                  >
                  Squad
                </li>
                <li
                  className={`text-sm p-2 py-1 text-sm cursor-pointer ${
                    playerGrouping && groupingType === 'team'
                    ? "bg-eft font-black hover:opacity-75 border border-black/0"
                    : "border border-eft text-eft"
                  }`}
                  onClick={() => toggleGroupingFilter('team')}
                  >
                  Team
                </li>
              </ul>
            </div>
          </nav>
          <div className="w-full flex gap-4 justify-end mb-2">
              <button className="cursor-pointer bg-eft p-1 text-xs font-black flex hover:opacity-75" onClick={() => setPlayerFilter([])}>Deselect All</button>
              <button className="cursor-pointer bg-eft p-1 text-xs font-black flex hover:opacity-75" onClick={() => raidData.players && setPlayerFilter(raidData.players.map(p => p.profileId))}>Select All</button>
          </div>
          <ul>
            {
              // By Group
              playerGrouping
                ? _.map(playersByGroup, (group, key) => (
                    <li  key={key + '_' + group.length}>
                      <ul className="border border-eft px-4 py-2 mb-2">
                        <strong className="text-eft">
                          Members ({group.length})
                        </strong>
                        {group.map((player, index) => (
                          <li className="text-eft flex justify-between" key={player.id + '_' + index}>
                            <div className="flex">
                              <input checked={playerIsFiltered(player.profileId)} type="checkbox" className="mr-2 cursor-pointer" onChange={() => togglePlayerFilter(player.profileId)} />
                              <span
                                className={
                                  playerWasKilled(player.profileId)
                                    ? "line-through opacity-75"
                                    : ""
                                }
                              >
                                {intl(player.name, intl_dir)}
                              </span>
                            </div>
                            <span>
                              {/* @ts-ignore */}
                              <span className="capitalize">{getPlayerDifficultyAndBrain(player)}</span> [{player.level}] {team[player.team]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))
                : // By Player
                  raidData.players && raidData.players.map((player, index) => (
                    <li className="text-eft flex justify-between" key={player.id + '_' + index}>
                      <div className="flex">
                        <input checked={playerIsFiltered(player.profileId)} type="checkbox" className="mr-2 cursor-pointer" onChange={() => togglePlayerFilter(player.profileId)} />
                        <span
                          className={
                            playerWasKilled(player.profileId)
                              ? "line-through opacity-75"
                              : ""
                          }
                        >
                          {intl(player.name, intl_dir)}
                        </span>
                      </div>
                      <span>
                        {/* @ts-ignore */}
                        <span className="capitalize">{getPlayerDifficultyAndBrain(player)}</span> [{player.level}] {team[player.team]}
                      </span>
                    </li>
                  ))
            }
          </ul>
        </div>
        <div className="border border-eft w-4/6 py-4 px-6">
          <nav className="mb-5 flex justify-between items-start">
            <h2 className="text-xl font-black text-eft mb-3">Raid Timeline</h2>
            <div className="flex">

              { generateMapPlaybackButton(raidData.positionsTracked) }

              <ul className="flex items-center gap-2 border border-eft p-1">
                <span className="text-eft">Filter By:</span>
                <li
                  className={`text-sm p-2 py-1 text-sm cursor-pointer ${
                    isFilterActive("KILLS")
                    ? "bg-eft font-black hover:opacity-75 border border-black/0"
                    : "border border-eft text-eft"
                  }`}
                  onClick={() => toggleTimelineFilter("KILLS")}
                  >
                  Kills
                </li>
                <li
                  className={`text-sm p-2 py-1 text-sm cursor-pointer ${
                    isFilterActive("LOOT")
                    ? "bg-eft font-black hover:opacity-75 border border-black/0"
                    : "border border-eft text-eft"
                  }`}
                  onClick={() => toggleTimelineFilter("LOOT")}
                  >
                  Loot
                </li>
              </ul>
            </div>
          </nav>
          <section className="text-eft">
            <ul>{generateTimeline(filters)}</ul>
          </section>
        </div>
      </section>
      <Outlet context={{ raidData }} />
    </>
  );
}
