import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { DiscordAccount, RaidReviewAccount } from '../types/api_types'

interface RaidReviewStoreState {
    discordToken: null | string
    setDiscordToken: (token: string) => void
    discordAccount: null | DiscordAccount
    setDiscordAccount: (discordAccount: DiscordAccount) => void
    raidReviewAccount: null | RaidReviewAccount
    setRaidReviewAccount: (discordAccount: RaidReviewAccount) => void
    signOut: () => void
}

const useRaidReviewCommunityStore = create<RaidReviewStoreState>()(
  devtools(
      (set) => ({
        discordToken: null,
        setDiscordToken: (token) => set( () => ({ discordToken: token })),

        discordAccount: null,
        setDiscordAccount: (discordAccount) => set((state) => ({ ...state, discordAccount })),

        raidReviewAccount: null,
        setRaidReviewAccount: (raidReviewAccount) => set((state) => ({ ...state, raidReviewAccount })),

        signOut: () => set(state => ({ ...state, discordToken: null, discordAccount: null, raidReviewAccount: null }))
      }),
      {
        name: 'raidReviewCommunityStore',
      },
  ),
)

export {
    useRaidReviewCommunityStore
}