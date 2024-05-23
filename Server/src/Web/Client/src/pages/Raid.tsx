import { useLoaderData } from "react-router-dom";
import { useEffect, useState } from "react";
import _ from 'lodash';

import api from "../api/api";
import en from "../assets/en.json";

import "./Raid.css";
import { TrackingRaidData, TrackingRaidDataPlayers } from "../types/api_types";
import Map from "./Map";

export async function loader(loaderData: any) {
  const profileId = loaderData.params.profileId as string;
  const raidData = (await api.getRaid(
    profileId,
    loaderData.params.raidId
  )) as TrackingRaidData;

  return { profileId, raidData };
}

export default function Raid() {
  const [ filters, setFilters ] = useState(["KILLS", "LOOT"]);
  const [ playerFilter, setPlayerFilter ] = useState([] as string[]);
  const [ playersByGroup, setPlayersByGroup ] = useState({} as { [key:string] : TrackingRaidDataPlayers[] })
  const [ playerGrouping, setPlayerGrouping ] = useState(true);
  const { raidData } = useLoaderData() as { profileId: string; raidData: TrackingRaidData; };

  useEffect(() => {
    const groupedPlayers = _.chain(raidData.players).map(p => {
      if (p.team === 'Savage') {
        p.group = 99
      }
      return {
        ...p,
        group : Number(p.group)
      }
    }).orderBy('group').groupBy('group').value();
    setPlayersByGroup(groupedPlayers);

    const selectedPlayers = _.map(raidData.players, (p) => p.profileId);
    setPlayerFilter(selectedPlayers);

  }, [raidData])


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

  function msToHMS(ms: number): string {
    return new Date(ms).toISOString().slice(11, 19);
  }

  function isFilterActive(filter:string) {
    return filters.find(filterToCheck => filterToCheck === filter);
  }

  function toggleGroupingFilter() {
    if (playerGrouping) {
      setPlayerGrouping(false)
    } else {
      setPlayerGrouping(true)
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
    return !!raidData.kills.find((kill) => kill.killedId === playerId);
  }

  function generateTimeline(filters: string[]): any {
    
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
      const killer = raidData.players.find(
        (player) => player.profileId === tli.killerId
      );
      const killed = raidData.players.find(
        (player) => player.profileId === tli.killedId
      );
      const looter = raidData.players.find(
        (player) => player.profileId === tli.playerId
      );

      let playerIsFiltered = playerFilter.find( p => p === tli.playerId || p === tli.killerId || p === tli.killedId);
      if (!playerIsFiltered) return;

      return (
          <li key={`${tli.type}_${tli.time}_${index}`}>
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
                  {tli.added === "true" ? " looted " : " dropped "}
                </span>{" "}
                <strong>
                  {/* @ts-ignore */}
                  {tli.qty}x {en[tli.name.replace("Short", "")]}
                </strong>
              </>
            )}
          </li>
      );
    });
  }

  return (
    <>
      <section className="border border-eft py-4 px-6 mb-5">
        <h2 className="text-xl font-black text-eft">Raid Summary</h2>
      </section>
      <section className="flex w-100 gap-4">
        <div className="border border-eft w-2/6 py-4 px-6">
          <nav className="mb-5 flex justify-between items-start">
            <h2 className="text-xl font-black text-eft mb-3">Players & Bots</h2>
            <ul className="flex items-center gap-2 border border-eft p-1">
              <span className="text-eft">Group By:</span>
              <li
                className={`text-sm p-2 py-1 text-sm cursor-pointer ${
                  playerGrouping
                    ? "bg-eft font-black hover:opacity-75 border border-black/0"
                    : "border border-eft text-eft"
                }`}
                onClick={() => toggleGroupingFilter()}
              >
                Squad
              </li>
            </ul>
          </nav>
          <div className="w-full flex gap-4 justify-end mb-2">
              <button className="cursor-pointer bg-eft p-1 text-xs font-black flex hover:opacity-75" onClick={() => setPlayerFilter([])}>Deselect All</button>
              <button className="cursor-pointer bg-eft p-1 text-xs font-black flex hover:opacity-75" onClick={() => setPlayerFilter(raidData.players.map(p => p.profileId))}>Select All</button>
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
                  raidData.players.map((player, index) => (
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
          </nav>
          <section className="text-eft">
            <ul>{generateTimeline(filters)}</ul>
          </section>
        </div>
      </section>
      <Map />
    </>
  );
}
