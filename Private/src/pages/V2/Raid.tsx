import { Link, Outlet, useLoaderData } from "react-router-dom";

import api from "../../api/api";

import './Raid.css'

export async function loader(loaderData: any) {

    const raidId = loaderData.params.raidId as string;
    let raid = await api.getRaid(raidId);
    const intl = await api.getIntl();

    return { raidId, raid, intl }
}
export default function Raid() {

  const { raidId, raid, intl } = useLoaderData() as any;

  return (
    <>
      <div className='flex justify-between my-2'>
          <div className="flex gap-2">
              <Link to={`/raid/${raidId}/`} className='py-1 px-4 bg-eft text-black hover:opacity-75'>Stats</Link>
              <Link to={`/raid/${raidId}/charts`} className='py-1 px-4 bg-eft text-black hover:opacity-75'>Charts</Link>
              <Link to={`/raid/${raidId}/timeline`} className='py-1 px-4 bg-eft text-black hover:opacity-75'>Timeline</Link>
              <Link to={`/raid/${raidId}/map`} className='py-1 px-4 bg-eft text-black hover:opacity-75'>Map</Link>
          </div>
          <div className="flex gap-2">
              {/* <button className='py-1 px-4 bg-eft text-black hover:opacity-75'>Export</button> */}
              <Link to={`/raid/${raidId}/settings`} className='py-1 px-4 bg-eft text-black hover:opacity-75'>Settings</Link>
          </div>
      </div>

      <section>
        <Outlet context={{ raid, intl }} />
      </section>
    </>
  )
}
