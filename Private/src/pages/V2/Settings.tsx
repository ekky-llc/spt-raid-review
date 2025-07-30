import { useLoaderData } from "react-router";

import { useEffect, useState } from "react";

const ls_globalSettingsKey = 'rr:global_settings';
export function getGlobalSettings() : any {

    const default_globalSettings = {
        translateCyrillic : true
    }

    const ls_globalSettings = localStorage.getItem(ls_globalSettingsKey);
    if (ls_globalSettings) {
        return JSON.parse(ls_globalSettings);
    } 
    
    else {
        localStorage.setItem(ls_globalSettingsKey, JSON.stringify(default_globalSettings));
        return default_globalSettings;
    }
}

export async function loader() {
    return getGlobalSettings();
}

export default function Settings() {

    const { translateCyrillic } = useLoaderData() as {
        translateCyrillic: boolean
    };

    const [ translateCyrillicSetting, setTranslateCyrillicSetting ] = useState(translateCyrillic);

    // Save everytime a setting changes
    useEffect(() => {

        const globalSettingsToCache = {
            translateCyrillic : translateCyrillicSetting
        }
        localStorage.setItem(ls_globalSettingsKey, JSON.stringify(globalSettingsToCache));

    }, [ translateCyrillicSetting ])

    return (
        <div className="settings-container">
            <>
                <div>
                    <div className="text-eft font-mono overflow-x-auto mt-2">

                        <strong>Global Settings</strong>
                        <div className="flex items-center justify-between border border-eft p-2">
                            <span>Translate Cyrillic Names [Experimental]</span>
                            <button 
                                className={`w-100 text-sm p-2 py-1 text-sm cursor-pointer border border-eft ${translateCyrillicSetting ? 'bg-eft text-black' : 'text-eft hover:bg-neutral-500/25'}`}
                                onClick={() => setTranslateCyrillicSetting(!translateCyrillicSetting)}
                            >{translateCyrillicSetting ? 'True' : 'False'}</button>
                        </div>

                    </div>
                </div>
            </>
        </div>
    )
}