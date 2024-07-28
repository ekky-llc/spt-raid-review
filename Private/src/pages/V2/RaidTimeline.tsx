import { useOutletContext } from "react-router-dom";
import { TrackingRaidData } from "../../types/api_types";
import { bodypart, intl, msToHMS } from "../../helpers";


export default function RaidTimeline() {

    const { raid, intl : intl_dir } = useOutletContext() as {
        raid: TrackingRaidData,
        intl: { [key: string]: string }
    };

    function generateTimeline(filters: string[]): any {

        if (raid && raid.kills && raid.looting && raid.players) {
          let combined = [] as any[];
          if (filters.includes('KILLS')) {
            combined = [ ...combined, ...raid.kills ];
          }
          if (filters.includes('LOOT')) {
            combined = [ ...combined, ...raid.looting ]
          }
    
          combined.map((tli) => {
            tli.time = Number(tli.time);
            return tli;
          });
          combined.sort((a, b) => a.time - b.time);
    
          return combined.map((tli: any, index) => {
            if (raid.players === undefined) return;
    
            const killer = raid.players.find(
              (player) => player.profileId === tli.profileId
            );
            const killed = raid.players.find(
              (player) => player.profileId === tli.killedId
            );
            const looter = raid.players.find(
              (player) => player.profileId === tli.profileId
            );
    
            // let playerIsFiltered = playerFilter.find( p => p === tli.profileId || p === tli.killedId);
            // if (!playerIsFiltered) return;
    
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
      <section className="raid-timeline">
        <div className="w-full text-lg font-bold">Raid Overview</div>
        { generateTimeline(['KILLS', 'LOOT']) }
    </section>
  )
}