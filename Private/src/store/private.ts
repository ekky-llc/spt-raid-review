import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface RaidReviewStoreState {
    config: null | { [keys: string] : string | boolean | number }
    setConfig: (config: { [keys: string] : string | boolean | number }) => void
}

const useRaidReviewPrivateStore = create<RaidReviewStoreState>()(
  devtools(
      (set) => ({
        config: null,
        setConfig: (config) => set( (state) => ({ ...state, config })),
      }),
      {
        name: 'raidReviewPrivateStore',
      },
  ),
)

export {
    useRaidReviewPrivateStore
}