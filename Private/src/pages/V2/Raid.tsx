import { Link, Outlet, useLoaderData } from "react-router-dom";

import api from "../../api/api";

import './Raid.css'
import { community_api } from "../../api/community_api";

export async function loader(loaderData: any) {

    const raidId = loaderData.params.raidId as string;
    let raid = await api.getRaid(raidId);
    const intl = await api.getIntl();

    const ls_globalSettingsKey = 'rr:global_settings';
    const default_globalSettings = { translateCyrillic: true }
    const ls_globalSettings = localStorage.getItem(ls_globalSettingsKey);

    return { raidId, raid, intl, globalSettings: ls_globalSettings ? JSON.parse(ls_globalSettings) : default_globalSettings, communityHub: false  }
}

export async function communityLoader(loaderData: any) {

  const raidId = loaderData.params.raidId as string;
  let raid = await community_api.getRaid(raidId);
  const intl = await community_api.getIntl();

  const ls_globalSettingsKey = 'rr:global_settings';
  const default_globalSettings = { translateCyrillic: true }
  const ls_globalSettings = localStorage.getItem(ls_globalSettingsKey);

  return { raidId, raid, intl, globalSettings: ls_globalSettings ? JSON.parse(ls_globalSettings) : default_globalSettings, communityHub: true }
}

export default function Raid() {

  const { raidId, raid, intl, globalSettings, communityHub } = useLoaderData() as any;

  async function handleExport() {
    await api.exportRaid(raidId);
  }

  return (
    <>
      <div className='md:flex justify-between my-2'>
          <div className="flex gap-2">
              <Link to={`/raid/${raidId}/`} className='py-1 px-4 bg-eft text-black hover:opacity-75'>Overview</Link>
              <Link to={`/raid/${raidId}/charts`} className='py-1 px-4 bg-eft text-black hover:opacity-75'>Stats</Link>
              <Link to={`/raid/${raidId}/timeline`} className='py-1 px-4 bg-eft text-black hover:opacity-75'>Timeline</Link>
              <Link to={`/raid/${raidId}/map`} className='py-1 px-4 bg-eft text-black hover:opacity-75'>Map</Link>
          </div>
          { !communityHub && (
            <div className="flex gap-2 md:mt-0 mt-2">
                <Link to={`/raid/${raidId}/share`} className='py-1 px-4 bg-eft text-black hover:opacity-75'>Share</Link>
                <button className='py-1 px-4 bg-eft text-black hover:opacity-75' onClick={handleExport}>Export</button>
                <Link to={`/raid/${raidId}/settings`} className='py-1 px-4 bg-eft text-black hover:opacity-75'>Settings</Link>
            </div>
          )}
      </div>

      <section>
        <Outlet context={{ raid, intl, globalSettings }} />
      </section>
    </>
  )
}
