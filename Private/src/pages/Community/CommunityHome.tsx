import { NavLink, Outlet, useNavigation } from "react-router";

import GlobalSpinner from "../../component/GlobalSpinner";

import './Layout.css'
import { useRaidReviewCommunityStore } from "../../store/community";
import { useEffect } from "react";
import { community_api } from "../../api/community_api";

export default function CommunityHome() {
    const navigation = useNavigation();
    const raidReviewStore = useRaidReviewCommunityStore(s => s);    

    useEffect(() => {
        document.title = `Raid Review Community Hub`;
        
        if (raidReviewStore.discordAccount || raidReviewStore.raidReviewAccount) {
            raidReviewStore.setIsLoading(false);
            return;
        };

        (async () => {
            try {
                raidReviewStore.setIsLoading(true);
                const data = await community_api.verify();
                if (data) {
                    raidReviewStore.setDiscordAccount(data.discordAccount);
                    raidReviewStore.setRaidReviewAccount(data.raidReviewAccount);
                } 
                
                else {
                    raidReviewStore.setIsLoading(false);
                }
            } 
            
            catch (error) {
                console.error(error);
                raidReviewStore.setIsLoading(false);
            }
        })()

    }, [raidReviewStore.discordAccount, raidReviewStore.raidReviewAccount])

    const isDev = window.location.host.includes("localhost");
    const authLink = isDev ?
    "https://discord.com/oauth2/authorize?client_id=1199563113993867305&response_type=token&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fauth&scope=identify" :
    "https://discord.com/oauth2/authorize?client_id=1199563113993867305&response_type=token&redirect_uri=https%3A%2F%2Fcommunity.raid-review.online%2Fauth&scope=identify";

    return (
        <>
        { navigation.state === "loading" || raidReviewStore.isLoading && <GlobalSpinner /> }
        <main className="text-eft font-mono relative mb-4 px-4 lg:p-0 lg:w-[1280px] px-2">

            <nav className="bg-eft border border-eft border-t-0 grid md:grid-cols-[auto_1fr] grid-cols-1">
                <div className="lg:w-fit w-full">
                    <NavLink to="/">
                    <h1 className="font-bold md:text-2xl text-xl md:w-fit w-full bg-black py-2 px-4 md:text-left text-center">RAID REVIEW COMMUNITY HUB</h1>
                    </NavLink>
                </div>
                <ul className="text-black flex md:justify-end justify-center">

                    { raidReviewStore.isLoading ? '' : raidReviewStore.discordAccount && raidReviewStore.raidReviewAccount ? ( 
                        <>
                            { window.location.pathname.match(/my-account/gi) ? (
                                <li className="text-base h-full hover:bg-black/20">
                                    <NavLink className="h-full w-full grid place-items-center px-4 underline" to="/">
                                        Home
                                    </NavLink>
                                </li>
                            ) : (
                                <li className="text-base h-full hover:bg-black/20">
                                    <NavLink className="h-full w-full grid place-items-center px-4 underline" to="/my-account">
                                        My Account
                                    </NavLink>
                                </li>
                            )}
                            <li className="text-base h-full hover:bg-black/20">
                                <NavLink className="h-full w-full grid place-items-center px-4 underline" to="/sign-out">
                                    Sign Out
                                </NavLink>
                            </li>
                        </>
                    ) : (
                        <li className="text-base h-full hover:bg-black/20">
                            <a href={authLink} className="h-full w-full grid place-items-center px-4 underline">
                                Sign In With Discord
                            </a>
                        </li>
                    )}
                </ul>
            </nav>

            <Outlet />

            <div className="text-xs text-center mt-4">
                Need help? Found a bug?<br />Join the <a target="_blank" className="underline" href="https://discord.gg/5AyDs66h8S">Discord</a>.
            </div>
        </main>
        </>
    )
}