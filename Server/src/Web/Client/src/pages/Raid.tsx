import { Link, Outlet, useLoaderData } from "react-router-dom";
import { useEffect, useState } from "react";
import _ from 'lodash';

import api from "../api/api";
import en from "../assets/en.json";

import "./Raid.css";
import { TrackingRaidData, TrackingRaidDataPlayers } from "../types/api_types";
import { locations } from "./Profile";

export async function loader(loaderData: any) {
  const profileId = loaderData.params.profileId as string;
  const raidData = (await api.getRaid(
    profileId,
    loaderData.params.raidId
  )) as TrackingRaidData;

  return { profileId, raidData };
}

export default function Raid() {
  const [ filters, setFilters ] = useState(["KILLS"]);
  const [ playerFilter, setPlayerFilter ] = useState([] as string[]);
  const [ raidSummary, setRaidSummary ] = useState([] as { title: string, value: any }[]);
  const [ playersByGroup, setPlayersByGroup ] = useState({} as { [key:string] : TrackingRaidDataPlayers[] })
  const [ groupingType, setGroupingType ] = useState('group');
  const [ playerGrouping, setPlayerGrouping ] = useState(true);
  const { profileId, raidData } = useLoaderData() as { profileId: string; raidData: TrackingRaidData; };

  useEffect(() => {
    if (raidData === undefined) return;

    const groupedPlayers = _.chain(raidData.players).map(p => {
      if (p.team === 'Savage') {
        p.group = 99
      }
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

    newRaidSummary.push({
      title: 'Positional Data',
      value: raidData.positionsTracked ? 'Available' : 'N/A'
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
      setPlayerGrouping(false);
    } else {
      setGroupingType(type);
      setPlayerGrouping(true);
    }
    return;
  }

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
                  <strong>{killer ? killer.name : "Unknown"}</strong>
                  <span className="opacity-75"> killed </span>
                  <strong>{killed ? killed.name : "Unknown"}</strong>
                  <span className="opacity-75"> with a </span>
                    {/* @ts-ignore */}
                  <strong>{ en[tli.weapon.replace("Name", "ShortName")] } [{bodypart[tli.bodyPart]? bodypart[tli.bodyPart]: tli.bodyPart}] [{ Number(tli.distance).toFixed(2) }m]</strong>
                </>
              ) : (
                <>
                  {/* @ts-ignore */}
                  <span className="opacity-75">{msToHMS(tli.time)} - </span>
                  <strong>{looter ? looter.name : "Unknown"}</strong>
                  <span className="opacity-75">
                    {Number(tli.added) ? " looted " : " dropped "}
                  </span>{" "}
                  <strong>
                    {/* @ts-ignore */}
                    {tli.qty}x {en[tli.itemName.replace("Short", "")]}
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
      <section className="border border-eft py-4 px-6 mb-5">
        <h2 className="text-xl font-black text-eft">Raid Summary</h2>
        <div id="raid_summary">
          { raidSummary.map( raidSum => <div key={raidSum.title} className="text text-eft">
            <strong>{ raidSum.title }</strong>
            <p>{ raidSum.value }</p>
          </div>) }
        </div>
      </section>
      <section className="flex w-100 gap-4">
        <div className="border border-eft w-2/6 py-4 px-6">
          <nav className="mb-5 flex justify-between items-start">
            <h2 className="text-xl font-black text-eft mb-3">Players & Bots</h2>
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
                                {player.name}
                              </span>
                            </div>
                            <span>
                            {/* @ts-ignore */}
                              [{player.level}] {team[player.team]}
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
                          {player.name}
                        </span>
                      </div>
                      <span>
                      {/* @ts-ignore */}
                        [{player.level}] {team[player.team]}
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
              { raidData.positionsTracked ? 
              <Link to={`/p/${profileId}/raid/${raidData.raidId}/map`} className="text-sm p-2 py-1 text-sm cursor-pointer bg-eft flex items-center font-black hover:opacity-75 border border-black/0 mr-3">
                  View Map Playback
              </Link>
              : <button disabled className="text-sm p-2 py-1 text-sm cursor-not-allowed bg-eft flex items-center font-black opacity-50 border border-black/0 mr-3">
                View Map Playback
              </button> }
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
