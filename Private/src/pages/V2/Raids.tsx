
import { Link, useLoaderData, useNavigate } from 'react-router-dom';

import { TrackingRaidData } from '../../types/api_types';
import { ISptProfile } from '../../../../Server/types/models/eft/profile/ISptProfile';
import api from '../../api/api';
import { LOCATIONS } from '../../helpers/locations';

import './Raids.css'
import { msToHMS } from '../../helpers';

export async function loader() {
    let raids = await api.getRaids([]);
    let profiles = await api.getProfiles();

    return { raids, profiles }
}

export default function Raids() {
    const { raids, profiles } = useLoaderData() as { raids: TrackingRaidData[], profiles: { [key: string] : ISptProfile } };
    const navigate = useNavigate()

    function getLocation(locationString: string) {
        return LOCATIONS[locationString] || locationString
    }

    function refreshData() {
        navigate('.', { replace: true })
    }

    return (
        <>

            <div className='flex justify-between my-2'>
                <div className="flex gap-2">
                    {/* <button className='py-1 px-4 bg-eft text-black hover:opacity-75'>Filters</button> */}
                </div>
                <div className="flex gap-2">
                    <button onClick={refreshData} className='py-1 px-4 bg-eft text-black hover:opacity-75'>Refresh</button>
                    {/* <button className='py-1 px-4 bg-eft text-black hover:opacity-75'>Import</button> */}
                </div>
            </div>

            <table id="raid-table" className="mt-2 w-full border border-eft">
                <thead>
                    <tr className="bg-eft text-black">
                        <th className="text-left px-2">Profile</th>
                        <th className="text-left px-2">Type</th>
                        <th className="text-left px-2">Map</th>
                        <th className="text-left px-2">Status</th>
                        <th className="text-left px-2">Time In Raid</th>
                        <th className="text-left px-2">Time</th>
                        <th className="text-left px-2">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        raids.length > 0 ? raids.map((r) => (
                        <tr key={r.raidId}>
                            <td className="text-left p-2 capitalize">{ profiles[r.profileId]?.info.username }</td>
                            <td className="text-left p-2">{ r.type }</td>
                            <td className="text-left p-2">{ getLocation(r.location) }</td>
                            <td className="text-left p-2">{ r.exitStatus }</td>
                            <td className="text-left p-2">{ msToHMS(Number(r.timeInRaid)) }</td>
                            <td className="text-left p-2">{ new Intl.DateTimeFormat('en-US', { weekday: 'long', hour: '2-digit', minute : '2-digit' }).format(new Date(r.time)) }</td>
                            <td className="text-left p-2 underline">
                                <Link to={`/raid/${r.raidId}`}>View</Link>
                            </td>
                        </tr>
                    )) : <tr>
                        <td colSpan={6}> No Data...</td>
                    </tr>
                    }
                </tbody>
            </table>

            <div className='text-center my-2'>Showing { raids.length } Raids</div>
        </>
    );
}
