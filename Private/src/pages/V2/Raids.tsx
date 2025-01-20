
import { Link, useLoaderData, useNavigate } from 'react-router-dom';

import { TrackingRaidData } from '../../types/api_types';
import { ISptProfile } from '../../../../Server/types/models/eft/profile/ISptProfile';
import api from '../../api/api';
import { msToHMS } from '../../helpers';
import { getLocation } from '../../helpers/locations';

import './Raids.css'

export async function loader() {
    let raids = await api.getRaids([]);
    let profiles = await api.getProfiles();

    return { raids, profiles}
}

export default function Raids() {
    const { raids, profiles } = useLoaderData() as { raids: TrackingRaidData[], profiles: { [key: string] : ISptProfile } };
    const navigate = useNavigate()

    function refreshData() {
        navigate('.', { replace: true })
    }

    return (
        <>

            <div className='flex justify-between my-2'>
                <div className="flex gap-2">
                    <Link className='py-1 px-4 bg-eft text-black hover:opacity-75' to={`/import`}>Import</Link>
                </div>
                <div className="flex gap-2">
                    <button onClick={refreshData} className='py-1 px-4 bg-eft text-black hover:opacity-75'>Refresh</button>
                </div>
            </div>

            <table id="raid-table" className="mt-2 w-full border border-eft">
                <thead>
                    <tr className="bg-eft text-black">
                        <th className="text-left px-2">Profile</th>
                        <th className="text-left px-2">Type</th>
                        <th className="text-left px-2">Map</th>
                        <th className="text-left px-2">Status</th>
                        <th className="text-left px-2">Length</th>
                        <th className="text-left px-2">Time</th>
                        <th className="text-left px-2">Meta</th>
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
                            <td className="text-left p-2 relative">
                                { r.imported && (
                                    <div className='tooltip'>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width={24} height={24} strokeWidth={2}>
                                            <path d="M6 10l-2 1l8 4l8 -4l-2 -1" />
                                            <path d="M4 15l8 4l8 -4" />
                                            <path d="M12 4v7" />
                                            <path d="M15 8l-3 3l-3 -3" />
                                        </svg>
                                        <div className='tooltiptext !bg-black/75 !text-white border border-eft'>
                                            Imported
                                        </div>
                                    </div>
                                )}
                                { true && (
                                    <div className='tooltip ml-2'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878" />
                                        </svg>
                                        <div className='tooltiptext !bg-black/75 !text-white border border-eft'>
                                            Shared
                                        </div>
                                    </div>
                                )}
                            </td>
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
