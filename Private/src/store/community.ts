import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { DiscordAccount } from '../types/api_types'

interface RaidReviewStoreState {
    discordToken: null | string
    setDiscordToken: (token: string) => void
    discordAccount: null | DiscordAccount
    setDiscordAccount: (discordAccount: DiscordAccount) => void
    signOut: () => void
}

const useRaidReviewCommunityStore = create<RaidReviewStoreState>()(
  devtools(
    persist(
      (set) => ({
        discordToken: null,
        setDiscordToken: (token) => set( () => ({ discordToken: token })),

        discordAccount: null,
        setDiscordAccount: (discordAccount) => set((state) => ({ ...state, discordAccount })),

        signOut: () => set(state => ({ ...state, discordToken: null, discordAccount: null }))
      }),
      {
        name: 'raidReviewCommunityStore',
      },
    ),
  ),
)

export {
    useRaidReviewCommunityStore
}