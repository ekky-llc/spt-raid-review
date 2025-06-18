import { useState } from "react"
import { useLoaderData, useNavigate } from "react-router";

import api from "../../api/api";
import { TrackingRaidData } from "../../types/api_types";
import { ISptProfile } from "../../../../Server/types/models/eft/profile/ISptProfile";

import GlobalSpinner from "../../component/GlobalSpinner";

export async function loader(_loaderData: any) {

    let raids = await api.getRaids([]);
    let profiles = await api.getProfiles();

    return { raids, profiles}
}

export default function RaidMerge() {
    
    const { raids, profiles } = useLoaderData() as { raids: TrackingRaidData[], profiles: { [key: string] : ISptProfile } };
    const navigator = useNavigate();

    const [ isLoading, setIsLoading ] = useState(false);

    const [parentRaidId, setParentRaidId] = useState<string>('');
    const [selectedChildRaids, setSelectedChildRaids] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Function to toggle a child raid selection
    const toggleChildRaidSelection = (raidId: string) => {
        if (raidId === parentRaidId) return;
        
        setSelectedChildRaids(prev => 
            prev.includes(raidId) 
                ? prev.filter(id => id !== raidId) 
                : [...prev, raidId]
        );
    };

    const isWithinFiveMinutes = (time1: string | undefined = undefined, time2: string) => {
        if (!time1) return false;
        const diff = Math.abs(new Date(time1).getTime() - new Date(time2).getTime());
        return diff <= 5 * 60 * 1000; // 5 minutes in milliseconds
    };

    // Handle the merge operation
    const handleMerge = async () => {
        if (!parentRaidId) {
            setError('Please select a parent raid');
            return;
        }
        
        if (selectedChildRaids.length === 0) {
            setError('Please select at least one child raid');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const mergeResult = await api.mergeRaids({
                parentRaidId,
                childRaidIds: selectedChildRaids
            });
            
            if (mergeResult) {
                navigator('/raids', { replace: true });
            } else {
                setError('Failed to merge raids');
            }
        } catch (err) {
            setError('An error occurred while merging raids');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="merge-container">
            {isLoading ? (
                <GlobalSpinner />
            ) : (
                <>
                    <div className='flex justify-between my-2'>
                        <h2 className="text-2xl">Merge Raids</h2>
                        <button 
                            onClick={() => navigator('/raids')} 
                            className="py-1 px-4 bg-gray-700 hover:bg-gray-600"
                        >
                            Back to Raids
                        </button>
                    </div>
                    
                    {error && (
                        <div className="bg-red-600/60 border border-red-800 p-2 mb-4">
                            {error}
                        </div>
                    )}
                    
                    <div className="mb-6 mt-4 border border-eft">
                        <div className="bg-eft text-black px-2">
                            <strong>Select Parent Raid</strong> 
                        </div>
                        <select 
                            value={parentRaidId} 
                            onChange={(e) => {
                                setParentRaidId(e.target.value);
                                setSelectedChildRaids(prev => 
                                    prev.filter(id => id !== e.target.value)
                                );
                            }}
                            className="w-full p-2 bg-gray-800 border border-eft m-2"
                        >
                            <option value="">-- Select a raid --</option>
                            {raids.map(raid => (
                                <option key={raid.raidId} value={raid.raidId}>
                                    {profiles[raid.profileId]?.info.username} - {raid.location} - {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(raid.time))}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="mb-6 border border-eft">
                        <div className="bg-eft text-black px-2">
                            <strong>Select Raids to Merge into Parent Raid</strong> 
                        </div>
                        <div className="max-w-screen overflow-auto m-2">
                            <table className="mt-2 w-full border border-eft">
                                <thead>
                                    <tr className="bg-eft text-black">
                                        <th className="text-left px-2">Select</th>
                                        <th className="text-left px-2">Similar</th>
                                        <th className="text-left px-2">Profile</th>
                                        <th className="text-left px-2">Type</th>
                                        <th className="text-left px-2">Map</th>
                                        <th className="text-left px-2">Status</th>
                                        <th className="text-left px-2 min-w-[250px]">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {raids.length > 0 ? raids.map((raid, _index) => {

                                        const parentRaid = parentRaidId ? raids.find(r => r.raidId === parentRaidId) : null;
                                        const closeRaids = parentRaid && raid.raidId !== parentRaidId && isWithinFiveMinutes(raid.time, parentRaid.time) ? [parentRaid] : [];
                                        const isCloseToAnotherRaid = closeRaids.length > 0;

                                        return (
                                            <tr 
                                                key={raid.raidId} 
                                                className={`cursor-pointer hover:opacity-75 ${raid.raidId === parentRaidId ? "opacity-50 bg-gray-700 line-through" : ""}`}
                                                onClick={() => raid.raidId !== parentRaidId && toggleChildRaidSelection(raid.raidId)}
                                            >
                                                <td className="text-left p-2">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedChildRaids.includes(raid.raidId)}
                                                        onChange={() => toggleChildRaidSelection(raid.raidId)}
                                                        disabled={raid.raidId === parentRaidId}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </td>
                                                <td className="text-left p-2 capitalize">{isCloseToAnotherRaid ? 'Likely' : ''}</td>
                                                <td className="text-left p-2 capitalize">{profiles[raid.profileId]?.info.username}</td>
                                                <td className="text-left p-2">{raid.type}</td>
                                                <td className="text-left p-2">{raid.location}</td>
                                                <td className="text-left p-2">{raid.exitStatus}</td>
                                                <td className="text-left p-2">{new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(raid.time))}</td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={6} className="text-center p-2">No raids available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className='flex justify-between items-center'>
                        <div className='text-center'>
                            {parentRaidId ? (
                                <div>
                                    <p>Selected parent: 1 raid</p>
                                    <p>Selected children: {selectedChildRaids.length} raids</p>
                                </div>
                            ) : (
                                <p>Select a parent raid to merge with child raids</p>
                            )}
                        </div>
                        
                        <button 
                            onClick={handleMerge} 
                            disabled={!parentRaidId || selectedChildRaids.length === 0}
                            className="py-2 px-6 bg-eft text-black hover:opacity-75 disabled:opacity-50"
                        >
                            Merge Raids
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}