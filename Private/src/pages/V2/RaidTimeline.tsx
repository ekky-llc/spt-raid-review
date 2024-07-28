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
                <tr key={`${tli.time}_${index}`}>
                  {tli.weapon ? (
                    <>
                      {/* @ts-ignore */}
                      <td className="opacity-75 px-2 border-r border-eft">{msToHMS(tli.time)}</td>
                      <td className="text-right pr-2">{killer ? intl(killer.name, intl_dir) : "Unknown"}</td>
                      <td className="text-center px-2 border-l border-r border-eft">
                        <span className="opacity-75">killed </span>
                      </td>
                      <td className="text-left px-2">
                        <strong>{killed ? intl(killed.name, intl_dir) : "Unknown"}</strong>
                        <span className="opacity-75"> with a </span>
                          {/* @ts-ignore */}
                        <strong>{ intl([tli.weapon.replace("Name", "ShortName")], intl_dir) } [{bodypart[tli.bodyPart]? bodypart[tli.bodyPart]: tli.bodyPart}] [{ Number(tli.distance).toFixed(2) }m]</strong>
                      </td>
                    </>
                  ) : (
                    <>
                      {/* @ts-ignore */}
                      <td className="opacity-75 px-2 border-r border-eft">{msToHMS(tli.time)}</td>
                      <td className="text-right pr-2">{looter ? intl(looter.name, intl_dir) : "Unknown"}</td>
                      <td className="text-center px-2 border-l border-r border-eft">
                        <span className="opacity-75">
                        {Number(tli.added) ? " looted " : " dropped "}
                        </span>{" "}
                      </td>
                      <td className="text-left pl-2">
                        <strong>
                          {/* @ts-ignore */}
                          {tli.qty}x { intl([tli.itemName.replace("Short", "")], intl_dir) }
                        </strong>
                      </td>
                    </>
                  )}
                </tr>
            );
          });
    
        }
    
      }

  return (
      <section className="raid-timeline">
        <div className="w-full text-lg font-bold">Timeline</div>
        <table id="raid-timeline" className="mb-2 w-full border border-eft">
            <thead>
              <tr className="bg-eft text-black">
                {/* <th className="text-left px-2"></th> */}
                <th className="text-left px-2 cursor-pointer">Time</th>
                <th className="text-right border-l border-r border-eft">Username</th>
                <th className="text-center px-2">Action</th>
                <th className="text-left px-2">Detail</th>
              </tr>
          </thead>
          <tbody>
            { generateTimeline(['KILLS', 'LOOT']) }
          </tbody>
        </table>
    </section>
  )
}