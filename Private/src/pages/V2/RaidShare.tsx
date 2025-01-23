import { useState } from "react"
import { useLoaderData, useNavigate } from "react-router";

import { useRaidReviewPrivateStore } from "../../store/private";
import api from "../../api/api";
import GlobalSpinner from "../../component/GlobalSpinner";

export async function loader(loaderData: any) {

    const raidId = loaderData.params.raidId as string;
    const isShared = await api.isRaidShared(raidId);

    return { raidId, isShared }
}

export default function RaidShare() {

    const privateRaidReviewStore = useRaidReviewPrivateStore(s => s)
    const navigator = useNavigate();
    const { raidId, isShared: isSharedPreCheck } = useLoaderData() as { raidId: string, isShared: boolean };

    const [ isLoading, setIsLoading ] = useState(false);
    const [ loadingMessage, setLoadingMessage ] = useState('');
    const [ showProgress, setShowProgress ] = useState(true);

    const [ isShared, setIsShared ] = useState(isSharedPreCheck || false);
    const [ overwriteOldest, setOverwriteOldest ] = useState(false);

    const [ title, setTitle ] = useState('');
    const [ description, setDescription ] = useState('');
    const [ isPublic, setIsPublic ] = useState(true);
    const [ uploadToken, setUploadToken ] = useState('');
    const [ tokenIsValid, setTokenIsValid ] = useState(false);

    async function handleUpload() {

        if (!tokenIsValid) return;
        if (title.trim() === '') return;
        if (description.trim() === '') return;
        if (uploadToken.trim() === '') return;
        
        try {
            
            setIsLoading(true);
            setLoadingMessage('Sharing Raid');
            await api.shareRaid(raidId, {
                title: title.trim(),
                description: description.trim(),
                uploadToken,
                isPublic
            })
            setIsShared(true)
        } 
        
        catch (error) {
            console.log(error);
            navigator(`/error?message=${encodeURIComponent(`There was an issue sharing your raid with ID ${raidId}`)}`)
        }

        finally {
            setIsLoading(false);
            setLoadingMessage('');
            return;
        }
    }

    async function validateToken() {
        try {
            
            setIsLoading(true);
            setLoadingMessage('Validating Token');
            const validationResponse = await api.verifyToken(uploadToken);

            if (validationResponse && typeof validationResponse === 'object') {
                setTokenIsValid(true)
                setShowProgress(false);
                const raidsRemaining = validationResponse.limit - validationResponse.raids;
                if (raidsRemaining <= 0 && validationResponse.raids < validationResponse.limit) {
                    setLoadingMessage(`🟡 Valid Token, but you're out of raids. | Upload Count: ${validationResponse.raids}/${validationResponse.limit}`)
                } 
                
                else if (validationResponse.raids > validationResponse.limit) {
                    setLoadingMessage(`💀 Congrats, the police are coming. | Upload Count: ${validationResponse.raids}/${validationResponse.limit}`)
                } 

                else if (validationResponse.limit > 1) {
                    setLoadingMessage(`🟢 Valid Token, ty for being a supporter | Upload Count: ${validationResponse.raids}/${validationResponse.limit}`)
                }
                
                else {
                    setLoadingMessage(`🟢 Valid Token | Upload Count: ${validationResponse.raids}/${validationResponse.limit}`)
                }
            }                

            setTokenIsValid(false);

        } catch (error) {
            console.log(error);
            setTokenIsValid(false);
            navigator(`/error?message=${encodeURIComponent(`There was an issue validating your upload token ${raidId}`)}`)
        }

        finally {
            setTimeout(() => {
                setShowProgress(true);
                setIsLoading(false);
                setLoadingMessage('');
            }, 2000)
        }
    }

    return (
        <div className="settings-container">
            <>
                { isLoading && <GlobalSpinner message={loadingMessage} dots={showProgress} /> }
                { isShared ? (
                    <div className="text-eft font-mono overflow-x-auto">
                        <strong>Raid Uploaded</strong>
                        <div className="border border-eft p-2 flex flex-col gap-3">
                                <div className="flex flex-col">
                                    <div>
                                        <label className="ml-1" htmlFor="public_hub_link">Public Hub Link</label>
                                    </div>
                                    <input readOnly value={`${privateRaidReviewStore?.config?.public_hub_base_url}/raid/${raidId}`} className="placeholder-gray-700 bg-black px-2 py-1 border border-eft" type="text" name="public_hub_link" id="public_hub_link" placeholder="Public Hub Link..." required />
                                </div>
                                <a href={`${privateRaidReviewStore?.config?.public_hub_base_url}/raid/${raidId}`} className="py-1 px-4 bg-eft h-full border border-eft w-fit text-sm text-black hover:opacity-75">
                                    View Listing
                                </a>
                        </div>
                    </div>
                ) : (
                    <div className="text-eft font-mono overflow-x-auto">
                        <strong>Share Your Raid</strong>
                        <div className="grid grid-cols-[500px_auto] gap-4">
                            <div className="border border-eft p-2 flex flex-col gap-3">
                                <div className="flex flex-col">
                                    <div>
                                        { title.trim() !== "" ? (<span>✅</span>): (<span>❌</span>)}
                                        <label className="ml-1" htmlFor="title">Title</label>
                                    </div>
                                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="placeholder-gray-700 bg-black px-2 py-1 border border-eft" type="text" name="title" id="title" placeholder="Title..." required />
                                </div>

                                <div className="flex flex-col">
                                    <div>
                                        { description.trim() !== "" ? (<span>✅</span>): (<span>❌</span>)}
                                        <label className="ml-1" htmlFor="description">Description</label>
                                    </div>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="placeholder-gray-700  bg-black px-2 py-1 border border-eft" rows={5} name="description" id="description" placeholder="Description..." required />
                                </div>

                                <div className="flex flex-col">
                                    <label className="ml-1" htmlFor="isPublic">Visibility</label>
                                    <div>
                                        <select name="isPublic" id="isPublic" value={`${isPublic}`} onChange={(e) => setIsPublic(e.target.value === 'true')} className="placeholder-gray-700 bg-black px-2 py-1 border border-eft w-full mb-2">
                                            <option value="true">Public</option>
                                            <option value="false">Unlisted</option>
                                        </select>
                                    </div>
                                </div>

                                {overwriteOldest && (
                                    <div className="flex flex-col">
                                        <label className="ml-1" htmlFor="overwriteOldest">Overwrite Oldest</label>
                                        <div>
                                            <select name="overwriteOldest" id="overwriteOldest" value={`${overwriteOldest}`} onChange={(e) => setOverwriteOldest(e.target.value === 'true')} className="placeholder-gray-700 bg-black px-2 py-1 border border-eft w-full mb-2">
                                                <option value="true">Yes</option>
                                                <option value="false">No</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col">
                                    <div className="inline-block">
                                        <div className="inline-block">
                                            { tokenIsValid ? (<span>✅</span>): (<span>❌</span>)}
                                            <label className="ml-1" htmlFor="token">Upload Token</label>
                                        </div>
                                        {privateRaidReviewStore?.config?.public_hub_base_url && (
                                            <span className="ml-2">
                                                (<a className="underline underline-offset-2" href={`${privateRaidReviewStore.config.public_hub_base_url}/`} target="__blank">No Token? Generate One!</a>)
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-[80%_auto]">
                                        <input value={uploadToken} onChange={(e) => setUploadToken(e.target.value.trim())} className="placeholder-gray-700 bg-black px-2 py-1 border border-eft" type="text" name="token" id="token" placeholder="00000000-0000-0000-0000-000000000000" required />
                                        <button onClick={validateToken} className="py-1 px-4 bg-eft h-full border border-eft w-fit text-sm text-black hover:opacity-75">
                                            Validate
                                        </button>
                                    </div>
                                </div>
                                
                                <button onClick={handleUpload} className={`py-1 px-4 bg-eft text-sm text-black ${tokenIsValid && title && description ? 'hover:opacity-75' : 'opacity-25 cursor-not-allowed'}`}>
                                    Start Upload
                                </button>
                            </div>
                            <div className="border border-eft p-2"> 
                                <strong>Instructions</strong> 
                                <div className="text-sm mb-4">
                                    <p>
                                        Set your title, description, visibility and an upload token, which you can generate via the {privateRaidReviewStore?.config?.public_hub_base_url ? (<a className="underline underline-offset-2" href={`${privateRaidReviewStore.config.public_hub_base_url}/get-token`} target="__blank">public hub</a>) : 'public hub'}. Once have done this, and clicked on 'Start Upload' the server will package and upload your raid, and give you a public link you can visit/share.
                                    </p>
                                    <p className="mt-2">
                                        🍻 Enjoy
                                    </p>
                                </div>
                                { typeof privateRaidReviewStore?.config?.public_hub_base_url === 'string' && privateRaidReviewStore.config.public_hub_base_url.includes('raid-review.online') && ( 
                                    <>
                                        <strong>Quick Message</strong> 
                                        <div className="text-sm">
                                            <p> 
                                                This project,  and the servers/cloud storage powering this sharing feature is maintained and funded through my own money (& donations recieved).
                                            </p>
                                            <p className="mt-3"> 
                                                I've set upload limits to <strong className="underline underline-offset-4">1 raid at a time per user</strong> so I can ensure things dont get out of control, and to prevent my credit card from being eaten alive.
                                            </p>
                                            <p className="mt-3"> 
                                                If you’d like to increase this limit for your own account, there are options available to you here <a className="underline underline-offset-2" href="https://raid-review.online/upgrade" target="__blank">https://raid-review.online/#upgrade</a>
                                            </p>
                                            <p className="mt-3"> 
                                                Thank you for understanding, and I hope this feature helps or provides entertainment somehow.
                                            </p>
                                            <p className="mt-3"> 
                                                - Ekky
                                            </p>                                
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>        
                 )}
            </>
        </div>
    )
}
