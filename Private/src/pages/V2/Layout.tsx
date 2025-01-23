import { NavLink, Outlet, useNavigation, useLoaderData } from "react-router";
import GlobalSpinner from "../../component/GlobalSpinner";
import './Layout.css'
import api from "../../api/api";
import { useRaidReviewPrivateStore } from "../../store/private";
import { useEffect } from "react";


export async function loader() {
    const config = await api.getConfig();
    return { config }
}

export default function Home() {
    const { config } = useLoaderData() as { config: null | { [key: string] : any } };
    const raidReviewPrivateStore = useRaidReviewPrivateStore(s => s);
    const navigation = useNavigation();

    useEffect(() => {
        if (raidReviewPrivateStore?.config !== null || !config) return;
        (() => {
            raidReviewPrivateStore.setConfig(config);
        })()
    }, [])

    return (
        <main className="text-eft font-mono relative mb-4 lg:w-[1280px] px-2">
            { navigation.state === "loading" && <GlobalSpinner /> }

            <nav className="bg-eft border border-eft border-t-0 flex md:flex-row flex-col">
                <div className="lg:w-56 w-full">
                    <h1 className="font-bold text-2xl bg-black py-2 px-4 lg:text-left text-center">RAID REVIEW</h1>
                </div>
                <ul className="text-black w-full flex justify-between">
                    <li className="text-base h-full hover:bg-black/20">
                        <NavLink className="h-full w-full grid place-items-center px-4 underline" to="/">Recent</NavLink>
                    </li>
                    <li className="text-base h-full hover:bg-black/20">
                        <NavLink className="h-full w-full grid place-items-center px-4 underline" to="/settings">Settings</NavLink>
                    </li>
                </ul>
            </nav>

            <div>
                
            </div>

            <Outlet />

            <div className="text-xs text-center mt-4">
                Need help? Found a bug?<br />Join the <a target="_blank" className="underline" href="https://discord.gg/5AyDs66h8S">Discord</a>.
            </div>
        </main>
    )
}