
// import api from '../../api/api';

import { useOutletContext } from "react-router-dom";
import { TrackingRaidData, TrackingRaidDataPlayers } from '../../types/api_types'
import './Raids.css'
import { msToHMS } from "../../helpers";

import BotMapping from '../../assets/botMapping.json'
import { useEffect, useState } from "react";
import _ from "lodash";
import { LOCATIONS } from "../../helpers/locations";


export default function RaidOverview() {
    const { raid } = useOutletContext() as { raid: TrackingRaidData };

    const [ calcStats, setCalcStats ] = useState(null as null | Map<string, { kills: number, lootings: number, accuracy: number }>);
    const [ raidSummary, setRaidSummary ] = useState([] as { title: string; value: any;}[]);
    const [ groupedByType, setGroupedByType ] = useState('' as string);
    const [ groupedBy, setGroupedBy ] = useState([] as TrackingRaidDataPlayers[][]);

    useEffect(() => {
      if (raid && raid.players) {
        const calculatedStats = new Map();
        for (let i = 0; i < raid.players.length; i++) {
          const player = raid.players[i];
          
          let kills = _.filter(raid.kills, (killer) => killer.killerId === player.profileId).length;
          let lootingsAdded = _.filter(raid.looting, (looter) => looter.profileId === player.profileId && looter.added === '1').length;
          let lootingsRemoved = _.filter(raid.looting, (looter) => looter.profileId === player.profileId && looter.added === '0').length;
          let lootings = lootingsAdded - lootingsRemoved;


          let allShots = _.filter(raid.ballistic, (shot) => shot.profileId === player.profileId).length;
          let hitShots = _.filter(raid.ballistic, (shot) => shot.profileId === player.profileId && shot.hitPlayerId).length
          let accuracy = Number(((hitShots / allShots) * 100).toFixed(0));

          if (Number.isNaN(accuracy)) {
            accuracy = 0;
          }

          calculatedStats.set(player.profileId, {
            kills,
            lootings,
            accuracy
          })
        }
        setCalcStats(calculatedStats);

        if (groupedByType === '') {
          setGroupedBy([[...raid.players]])
        }

        if (groupedByType === 'GROUP') {
          const newGrouped = _.chain(raid.players).groupBy('group').valuesIn().value();
          setGroupedBy([...newGrouped])
        }

        if (groupedByType === 'TEAM') {
          const newGrouped = _.chain(raid.players).groupBy('team').valuesIn().value();
          setGroupedBy([...newGrouped])
        }
      }


      let newRaidSummary = [];

      newRaidSummary.push({
        title: 'Map',
        // @ts-ignore
        value: LOCATIONS[raid.location]
      });

      newRaidSummary.push({
        title: 'Status',
        value: raid.exitStatus
      });
  
      newRaidSummary.push({
        title: 'Time In Raid',
        value: msToHMS(Number(raid.timeInRaid))
      });
      
  
      newRaidSummary.push({
        title: 'Extract Point',
        value: raid.exitName || '-'
      });
      
      newRaidSummary.push({
        title: 'Players (Total)',
        value: raid.players ? raid.players.length : 0
      });
      
      newRaidSummary.push({
        title: 'Kills (Total)',
        value: raid.kills ? raid.kills.length : 0
      });
      
      newRaidSummary.push({
        title: 'Detected Mods',
        // @ts-ignore
        value: raid.detectedMods
      });

      let positionsTrackedMap = { "COMPILED" : "Available", "RAW" : "Processing", "NOT_AVAILABLE" : "Not Available" }
      newRaidSummary.push({
        title: 'Positional Data',
  
        // @ts-ignore
        value: raid.positionsTracked ? positionsTrackedMap[raid.positionsTracked] : 'N/A'
      });
  
      setRaidSummary(newRaidSummary);
    },[ raid, groupedByType ])

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
        if (player) {
          let difficulty = player.mod_SAIN_difficulty;
          let brain = getPlayerBrain(player);
    
          if (difficulty !== null && difficulty !== "") {
            if(player.team === "Savage" && brain === "") {
              return difficulty;
            }
            return `${difficulty} - ${brain}`;
          }
    
          else if (player.team === "Savage") {
            if(brain !== null && brain !== "") {
              return `${brain}`;
            }
            else return "";
          }
    
          return `${brain}`;
        }
    
        return "";
      }

      function generatePlayerTable(raid: TrackingRaidData ) {
        
        return (raid && groupedBy && groupedBy.length > 0 ? groupedBy.map( (gp) => gp.map( (p, index) => {
          const SAIN = getPlayerDifficultyAndBrain(p).toLowerCase();

          return (<tr className={`${index === 0 || (index === gp.length - 1) ? (index === 0 ? 'border-t border-dashed border-eft' : 'border-b border-dashed border-eft' ) : '' } ${SAIN === 'player' ? 'font-bold' : ''}`}>
              <td className="text-right p-2 uppercase">{ p.team === 'Savage' ? 'Scav' : p.team }</td>
              <td className="text-center p-2 uppercase border-x border-eft">{ p.group }</td>
              <td className="text-center p-2 uppercase border-x border-eft">{ p.level }</td>
              <td className="text-left p-2">{ p.name }</td>
              <td className="text-right p-2 capitalize">{ SAIN }</td>
              <td className="text-center p-2 w-12 border-l border-eft">{ calcStats ? calcStats.get(p.profileId)?.kills || '-' : null  }</td>
              <td className={`text-center p-2 w-12 ${(calcStats && (calcStats.get(p.profileId)?.lootings || 0) < 0) ? 'text-red-400' : 'text-green-400'}`}>{ calcStats ? calcStats.get(p.profileId)?.lootings || '-'  : null }</td>
              <td className="text-center p-2 w-12">
                { calcStats ? calcStats.get(p.profileId)?.accuracy || '-'  : null }
                {calcStats && calcStats.get(p.profileId)?.accuracy ? '%' : ''}
              </td>
              <td className="text-right p-2 border-l border-eft">{ msToHMS(Number(p.spawnTime)) }</td>
          </tr>)})
      )
      : '')
      }

    return (
      <>
        <section>
          <div className="w-full text-lg font-bold">Overview</div>
          <table id="raid-overview" className="mb-2 w-full border border-eft">
                  <tbody>
                      {raidSummary && raidSummary.length ? raidSummary.map(rs => 
                        <tr>
                        <td className="text-right bg-eft text-black font-bold px-2">{ rs.title }</td>
                        <td className="px-2">{ rs.value }</td>
                      </tr>
                      ) : ''}
                  </tbody>
            </table>
        </section>

        <section className="mt-4">
            <div className="w-full flex flex-row justify-between">
              <span className="text-lg font-bold">Leaderboard</span>
              <span>Sort by Side, Team or Spawned</span>
            </div>
            <table id="raid-leaderboard" className="mb-2 w-full border border-eft">
                <thead>
                    <tr className="bg-eft text-black">
                        {/* <th className="text-left px-2"></th> */}
                        <th className={`text-right px-2 underline cursor-pointer ${groupedByType === 'TEAM' ? 'bg-black text-eft' : ''}`} onClick={() => setGroupedByType('TEAM')}>Side</th>
                        <th className={`text-right px-2 underline cursor-pointer ${groupedByType === 'GROUP' ? 'bg-black text-eft' : ''}`} onClick={() => setGroupedByType('GROUP')}>Team</th>
                        <th className="text-right px-2">Lvl</th>
                        <th className="text-left px-2">Username</th>
                        <th className="text-right px-2">SAIN</th>
                        <th className="text-center px-2">K</th>
                        <th className="text-center px-2">L</th>
                        <th className="text-center px-2">A%</th>
                        <th className={`text-right px-2 underline cursor-pointer ${groupedByType === '' ? 'bg-black text-eft' : ''}`} onClick={() => setGroupedByType('')}>Spawned</th>
                    </tr>
                </thead>
                <tbody>
                    { generatePlayerTable(raid) }
                </tbody>
            </table>
        </section>
      </>
    );
}
