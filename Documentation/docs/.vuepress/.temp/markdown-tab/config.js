import { CodeTabs } from "D:/Code/spt-aki-history/Documentation/node_modules/.pnpm/@vuepress+plugin-markdown-t_3bf48e510994c914a81d032c2bcef4bb/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/CodeTabs.js";
import { Tabs } from "D:/Code/spt-aki-history/Documentation/node_modules/.pnpm/@vuepress+plugin-markdown-t_3bf48e510994c914a81d032c2bcef4bb/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/Tabs.js";
import "D:/Code/spt-aki-history/Documentation/node_modules/.pnpm/@vuepress+plugin-markdown-t_3bf48e510994c914a81d032c2bcef4bb/node_modules/@vuepress/plugin-markdown-tab/lib/client/styles/vars.css";

export default {
  enhance: ({ app }) => {
    app.component("CodeTabs", CodeTabs);
    app.component("Tabs", Tabs);
  },
};
