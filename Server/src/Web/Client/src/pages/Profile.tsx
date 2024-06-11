import { Link, redirect, Outlet, useLoaderData } from "react-router-dom";
import api from "../api/api";
import { IAkiProfile } from "../../../../../types/models/eft/profile/IAkiProfile";

import "./Profile.css";
import moment from "moment";

export async function loader(loaderData: any) {
  const profile = await api.getProfile(loaderData.params.profileId);
  const core = await api.getCore(loaderData.params.profileId);

  if (!loaderData.request.url.includes('about') && !core.length) {
    return redirect(`/p/${profile.info.id}/about`);
  }

  return { profile, core };
}

export const locations = {
  "bigmap": "Customs",
  "Sandbox": "Ground Zero",
  "develop": "Ground Zero",
  "factory4_day": "Factory",
  "factory4_night": "Factory",
  "hideout": "Hideout",
  "Interchange": "Interchange",
  "laboratory": "Laboratory",
  "Lighthouse": "Lighthouse",
  "privatearea": "Private Area",
  "RezervBase": "Reserve",
  "shoreline": "Shoreline",
  "suburbs": "Suburbs",
  "TarkovStreets": "Streets",
  "terminal": "Terminal",
  "town": "Town",
  "woods": "Woods",
  "base": "Base"
};

export function msToHMS( ms: number ) : string {
  if (ms !== null) {
    return new Date(Number(ms)).toISOString().slice(11,19);
  }
  return ''
}

export default function Profile() {
  const { profile, core } = useLoaderData() as { profile: IAkiProfile, core : any };

  return (
    <div className="profile__layout p-6 font-mono">
      <div className="profile__header">
        <ul className="flex justify-between">
          <li>
            <Link to="/">
              <button className="bg-eft px-4 py-1 text-xl font-black flex hover:opacity-75">
                <svg
                  className="mr-2"
                  width="25"
                  height="25"
                  viewBox="0 0 25 25"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.0625 19.8013L4.0625 14.8013L9.0625 9.80127M18.0625 4.80127V14.8013H5.0625"
                    stroke="black"
                    strokeWidth="2"
                  />
                </svg>
                <span>Return</span>
              </button>
            </Link>
          </li>
          <li>
              <Link to={`/p/${profile.info.id}/about`} className="bg-eft px-4 py-1 text-xl font-black flex hover:opacity-75">
                <span>About</span>
              </Link>
          </li>
        </ul>
      </div>
      <div className="profile__sidebar bg-black/75 p-6">
        <div className="border-eft p-2">
          <h2 className="text-xl font-black text-eft mb-2">Raid Selection</h2>
        </div>
        {core.length > 0 ? core.map((raid: any) => RaidSelector(profile, raid, locations, msToHMS)) : <div className="text-eft text-center h-full flex justify-center items-center">No Raids Found.<br/>Load into some raids!</div>}
      </div>
      <div className="profile__body bg-black/75 p-6">
        <div className="border-eft p-2">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function RaidSelector(profile: IAkiProfile, raid: any, locations: { [ key :string ] : string }, msToHMS: (ms: number) => string) {
  return <Link to={`/p/${profile.info.id}/raid/${raid.raidId}`} key={raid.raidId} className="raid__selector bg-eft w-full px-4 py-1 text-xl font-black flex flex-col hover:opacity-75 cursor-pointer">
    <div className="w-full flex items-center">
      {locations[raid.location] !== undefined ? locations[raid.location] : raid.location}
      <span className="font-light ml-auto text-sm opacity-75">Length: {msToHMS(Number(raid.timeInRaid))} </span>
    </div>
    <div className="font-light flex justify-between text-sm opacity-75">
      <div>{raid.exitStatus}</div>
      <div>{moment(raid.time).calendar()}</div>
    </div>
  </Link>;
}

