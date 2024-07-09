import { Link, LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router-dom";
import api from "../api/api";

import './RaidSettings.css'
import { useState } from "react";

export async function loader(loaderData: LoaderFunctionArgs ) {
    const profileId = loaderData.params.profileId as string;
    const raidId = loaderData.params.raidId as string;

    const result = await api.getRaidTempFiles(profileId, raidId);

    return { profileId : profileId, raidId : raidId, raidTempFiles: result};
}

export default function RaidSettings() {
    const {  profileId, raidId, raidTempFiles } = useLoaderData() as {
        profileId: string,
        raidId: string,
        raidTempFiles: boolean,
    };
    const [ deleteConfirm, setDeleteConfirm ] = useState(false);
    const [ tempDataAvail, setTempDataAvail ] = useState(raidTempFiles || false);
    const navigate = useNavigate();

    async function deleteTempRaidData(raidId: string) {
        try {
            const result = await api.deleteRaidsTempFiles(profileId, [raidId]);
            if (result) {
                setTempDataAvail(false);
            }
        } catch (error) {
            console.log(error)
        }
    }

    async function deleteAllRaidData(raidId: string) {
        try {
            const result = await api.deleteRaids(profileId, [raidId]);
            if (result) {
                navigate(`/p/${profileId}`, { replace: true })
            }
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="settings-container grid place-items-center">
            <>
                <div>
                    <nav className="flex justify-end">
                        <Link to={`/p/${profileId}/raid/${raidId}?return=1`} className='text-sm p-2 py-1 hover:bg-neutral-500/25 text-sm cursor-pointer border border-eft text-eft mb-2 ml-auto'>Close</Link>
                    </nav>
                    <div className="text-eft border border-eft bg-black font-mono overflow-x-auto w-96 p-4">
                        <strong>Settings</strong>

                        { tempDataAvail ? 
                        <div className="mt-4 flex flex-col justify-start border border-eft p-2">
                            <span className="text-center mb-1">Delete Temporary Files</span>
                            <button 
                                className={`w-100 text-sm p-2 py-1 hover:bg-neutral-500/25 text-sm cursor-pointer border border-eft text-eft mb-2`}
                                onClick={() => deleteTempRaidData(raidId)}
                                >Clean Up</button>
                        </div>
                        :''}

                        <div className="mt-2 flex flex-col justify-start border border-rose-500 p-2 text-rose-500">
                            { !deleteConfirm ?  <span className="text-center mb-1">Permanently raid data</span> :<span className="text-center mb-1">Are you really sure?</span>}
                            <button 
                                className={`w-100 text-sm p-2 py-1 ${deleteConfirm ? 'hidden' : ''} text-sm cursor-pointer border border-rose-500 hover:bg-rose-500/25 text-rose-00 mb-2`} 
                                onClick={() => setDeleteConfirm(true)}
                            >Delete</button>
                            <button 
                                className={`w-100 text-sm p-2 py-1 ${deleteConfirm ? '' : 'hidden'} text-sm cursor-pointer border border-rose-500 hover:bg-rose-500/25 text-rose-00 mb-2`}
                                onClick={() => deleteAllRaidData(raidId)}
                            >Yes</button>
                        </div>
                    </div>
                </div>
            </>
        </div>
    )
}