import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress/cli'
import { viteBundler } from '@vuepress/bundler-vite'

export default defineUserConfig({
  lang: 'en-US',

  title: 'Raid Review',
  description: 'All documentation regarding the SPT Raid Review mod.',

  theme: defaultTheme({
    logo: '',

    colorMode: 'dark',
    colorModeSwitch: false,
    
    navbar: ['/', '/get-started'],
  }),

  bundler: viteBundler(),
})
