import { useLoaderData, useNavigate } from "react-router-dom";
import api from "../api/api";
import { useState } from 'react'

import './ServerSettings.css'

export async function loader(loaderData: any) {
    const profileId = loaderData.params.profileId as string;
  
    return { profileId };
}

export default function ServerSettings() {
    const { profileId } = useLoaderData() as { profileId: String };
    const [ telemetryEnabled, setTelemetryEnabled ] = useState(true);
    const [ deleteConfirm, setDeleteConfirm ] = useState(false);
    const navigate = useNavigate();

    async function deleteAllData() {
        try {
            const result = await api.deleteAllData();
            if (result) {
                navigate(`/p/${profileId}`, { replace: true })
            }
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="text-eft font-mono overflow-x-auto">
            <div className='border border-eft px-4 py-2 w-3/6 mb-4'>
                <h2 className='text-lg'>Server Settings</h2>

                <div className='flex mt-2 text-xs'>
                    <div>
                        <strong>Enable Telemetry</strong>
                        <p className='opacity-75'>
                            If enabled, statistical data is sent to the Raid Review telemetry server after each raid.
                        </p>
                        <p className='opacity-75 mt-2'>
                            For more information on what this is used for <a target='_blank' className="underline" href="https://github.com/ekky-llc/spt-raid-review/blob/main/TELEMETRY.md">read here</a>.
                        </p>
                    </div>
                    <div className='flex justify-end items-start w-full'>
                        { telemetryEnabled ? 
                            <button className="text-sm p-2 py-1 text-sm cursor-pointer bg-eft text-black hover:opacity-75 border border-black/0" onClick={() => setTelemetryEnabled(!telemetryEnabled)}>Enabled</button> :
                            <button className="text-sm p-2 py-1 text-sm cursor-pointer border border-eft text-eft" onClick={() => setTelemetryEnabled(!telemetryEnabled)}>Disabled</button>
                        }
                    </div>
                </div>

            </div>

            <div className='border border-rose-500 p-2 text-rose-500 px-4 py-2 w-3/6 mb-4'>
                <h2 className='text-lg'>Danger Zone</h2>

                <div className='flex mt-2 text-xs'>
                <div>
                        <strong>Delete All Data</strong>
                        <p className='opacity-75'>
                            Deletes all data from the SQlite Database, and removes all temporary files including positional data.</p>
                        <p className='opacity-75 mt-2'>
                             I hope you know what you are doing this is not recoverable.
                        </p>
                    </div>
                    <div className='flex justify-end items-start w-full'>
                            <button 
                                className={`w-100 text-sm p-2 py-1 ${deleteConfirm ? 'hidden' : ''} text-sm cursor-pointer border border-rose-500 hover:bg-rose-500/25 text-rose-00 mb-2`} 
                                onClick={() => setDeleteConfirm(true)}
                            >Delete</button>
                            <button 
                                className={`w-100 text-sm p-2 py-1 ${deleteConfirm ? '' : 'hidden'} text-sm cursor-pointer border border-rose-500 hover:bg-rose-500/25 text-rose-00 mb-2`}
                                onClick={() => deleteAllData()}
                            >Yes, Please Delete</button>
                    </div>
                </div>

            </div>
        </div>
    )
}