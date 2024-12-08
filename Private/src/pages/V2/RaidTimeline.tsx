import { useOutletContext } from "react-router-dom";
import { TrackingRaidData } from "../../types/api_types";
import { bodypart, intl, msToHMS } from "../../helpers";
import { useEffect, useState } from "react";
import _ from "lodash";

import cyr_to_en from '../../assets/cyr_to_en.json';
import { transliterateCyrillicToLatin } from "../../helpers/transliterateCyrillicToLatin";

export default function RaidTimeline() {

  const [ actionFilterModal, setActionFilterModal ] = useState(false);
  const [ usernameFilterModal, setUsernameFilterModal ] = useState(false);
  const [ usernamesWithActivity, setUsernamesWithActivity ] = useState({} as { profileId: string, name: string | undefined }[]);
  const [ usernameFilter, setUsernameFilter ] = useState({} as { [key:string] : boolean });
  const [ actionFilter, setActionFilter ] = useState({} as { [key:string] : boolean });
  const { raid, intl : intl_dir_ot } = useOutletContext() as {
      raid: TrackingRaidData,
      intl: { [key: string]: string }
  };

  const intl_dir : Record<string, string> = {...intl_dir_ot, ...cyr_to_en};

  useEffect(() => {

    (() => {

      if (raid && raid.looting && raid.kills && raid.players) {
        const usernameFilter_ = {} as { [key:string] : boolean };
        if (Object.keys(usernamesWithActivity).length === 0) {
          const usernamesWithActivity_ = _.chain([...raid.looting, ...raid.kills] as any[])
          .uniqBy('profileId')
          .map(({ profileId } : { profileId: string }) => { return { profileId: profileId, name: raid.players?.find(p => p.profileId === profileId)?.name || undefined }})
          .value() as unknown as { profileId: string, name: string | undefined }[];
          for (let i = 0; i < usernamesWithActivity_.length; i++) {
            const player = usernamesWithActivity_[i];
            usernameFilter_[player.profileId] = true
          }
          setUsernamesWithActivity(usernamesWithActivity_);
          setUsernameFilter(usernameFilter_);
          setActionFilter({
            looting: true,
            kills: true
          })
        }
      }

    })()

  }, [raid, usernameFilter])

  function generateTimeline(): any {

      if (raid && raid.kills && raid.looting && raid.players) {
        let combined = [] as any[];
        if (actionFilter.kills) {
          combined = [ ...combined, ...raid.kills ];
        }
        if (actionFilter.looting) {
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
  
          let playerIsFiltered = usernameFilter[tli.profileId];
          if (!playerIsFiltered) return;

          return (
              <tr key={`${tli.time}_${index}`}>
                {tli.weapon ? (
                  <>
                    {/* @ts-ignore */}
                    <td className="opacity-75 px-2 border-r border-eft">{msToHMS(tli.time)}</td>
                    <td className="text-right pr-2">{killer ? transliterateCyrillicToLatin(intl(killer.name, intl_dir)) : "Unknown"}</td>
                    <td className="text-center px-2 border-l border-r border-eft">
                      <span className="opacity-75">killed </span>
                    </td>
                    <td className="text-left px-2">
                      <strong>{killed ? transliterateCyrillicToLatin(intl(killed.name, intl_dir)) : "Unknown"}</strong>
                      <span className="opacity-75"> with a </span>
                        {/* @ts-ignore */}
                      <strong>{ intl([tli.weapon.replace("Name", "ShortName")], intl_dir) } [{bodypart[tli.bodyPart]? bodypart[tli.bodyPart]: tli.bodyPart}] [{ Number(tli.distance).toFixed(2) }m]</strong>
                    </td>
                  </>
                ) : (
                  <>
                    {/* @ts-ignore */}
                    <td className="opacity-75 px-2 border-r border-eft">{msToHMS(tli.time)}</td>
                    <td className="text-right pr-2">{looter ? transliterateCyrillicToLatin(intl(looter.name, intl_dir)) : "Unknown"}</td>
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

  function generateUsernameToggle() {

    function uncheckAllUsernames() {
      const usernameFilter_ = { ...usernameFilter };
      const profiles = Object.keys(usernameFilter_);
      for (let i = 0; i < profiles.length; i++) {
        const profileId = profiles[i];
        usernameFilter_[profileId] = false;
      }
      setUsernameFilter(usernameFilter_);
    }

    function checkAllUsernames() {
      const usernameFilter_ = { ...usernameFilter };
      const profiles = Object.keys(usernameFilter_);
      for (let i = 0; i < profiles.length; i++) {
        const profileId = profiles[i];
        usernameFilter_[profileId] = true;
      }
      setUsernameFilter(usernameFilter_);
    }

    return (
      <>
        <ul>
          { 
            raid && usernamesWithActivity && usernamesWithActivity.length > 0 ? usernamesWithActivity.map(p => 
              <li key={p.profileId}>
                <input type="checkbox" name="username_filter" id="username_filter" className="cursor-pointer mx-2" value={p.profileId} checked={usernameFilter[p.profileId]} onChange={() => {
                  const usernameFilter_ = { ...usernameFilter };
                  usernameFilter_[p.profileId] = !usernameFilter_[p.profileId]
                  setUsernameFilter(usernameFilter_);
                }} />
                { p.name }
              </li>
            ) : ''
          }
        </ul>
        <button onClick={() => checkAllUsernames()} className="bg-black border border-eft text-eft p-1 py-0 text-xs hover:opacity-75 w-full font-base mt-2">Check All</button>
        <button onClick={() => uncheckAllUsernames()} className="bg-black border border-eft text-eft p-1 py-0 text-xs hover:opacity-75 w-full font-base my-1">Uncheck All</button>
        <button onClick={() => setUsernameFilterModal(false)} className="bg-eft text-black p-1 py-0 text-xs hover:opacity-75 w-full font-base">Save</button>
      </>
    )
  }

  function generateActionToggle() {
    return (
      <>
        <ul>
          <li>
            <input type="checkbox" name="username_filter" id="username_filter" className="cursor-pointer mx-2" value="LOOTING" checked={actionFilter.looting} onChange={() => {
              const actionFilter_ = { ...actionFilter };
              actionFilter_.looting = !actionFilter_.looting
              setActionFilter(actionFilter_);
            }} />
            Looting
          </li>
          <li>
            <input type="checkbox" name="username_filter" id="username_filter" className="cursor-pointer mx-2" value="KILLS" checked={actionFilter.kills} onChange={() => {
              const actionFilter_ = { ...actionFilter };
              actionFilter_.kills = !actionFilter_.kills
              setActionFilter(actionFilter_);
            }} />
            Kills
          </li>
        </ul>
        <button onClick={() => setActionFilterModal(false)} className="bg-eft text-black p-1 py-0 text-xs hover:opacity-75 w-full font-base mt-2">Save</button>
      </>
    )
  }

  return (
      <section className="raid-timeline">
            <div className="w-full flex flex-row justify-between">
              <span className="text-lg font-bold">Timeline</span>
              <span>Filter by Username or Action</span>
            </div>
        <table id="raid-timeline" className="mb-2 w-full border border-eft">
            <thead>
              <tr className="bg-eft text-black">
                <th className="text-left px-2 cursor-pointer">Time</th>
                <th className="text-right border-l relative border-r border-eft underline">
                  <span className="cursor-pointer" onClick={() => setUsernameFilterModal(!usernameFilterModal)}>Username</span>
                  { usernameFilterModal ? 
                    <div className="table-toggle text-left text-xs absolute right-0 text-eft bg-black border border-eft p-1 pt-2  w-full w-48 z-50">
                      { generateUsernameToggle() }
                    </div> : ''
                  }
                </th>
                <th className="text-center px-2 relative underline cursor-pointer">
                  <span className="cursor-pointer" onClick={() => setActionFilterModal(!actionFilterModal)}>Action</span>
                  { actionFilterModal ? 
                    <div className="table-toggle text-left text-xs absolute right-0 text-eft bg-black border border-eft p-1 pt-2 w-full w-48 z-50">
                      { generateActionToggle() }
                    </div> : ''
                  }
                </th>
                <th className="text-left px-2">Detail</th>
              </tr>
          </thead>
          <tbody>
            { generateTimeline() }
          </tbody>
        </table>
    </section>
  )
}