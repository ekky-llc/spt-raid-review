import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import Layout from './pages/V2/Layout';
import Raids, { loader as RaidsLoader } from './pages/V2/Raids';
import Raid, { loader as RaidLoader } from "./pages/V2/Raid";
import RaidOverview from "./pages/V2/RaidOverview";
import RaidMap, { loader as RaidMapLoader } from "./pages/V2/RaidMap";
import RaidCharts from "./pages/V2/RaidCharts";
import RaidTimeline from "./pages/V2/RaidTimeline";
import RaidSettings, { loader as RaidSettingsLoader } from "./pages/V2/RaidSettings";

const v2_routes = [
  {
    path : "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Raids />,
        loader: RaidsLoader
      },
      {
        path: "/raid/:raidId",
        element: <Raid />,
        loader: RaidLoader,
        children : [
          { 
            path: "/raid/:raidId",
            element: <RaidOverview />
          },
          { 
            path: "/raid/:raidId/charts",
            element: <RaidCharts />
          },
          { 
            path: "/raid/:raidId/timeline",
            element: <RaidTimeline />
          },
          { 
            path: "/raid/:raidId/map",
            element: <RaidMap />,
            loader: RaidMapLoader
          },
          { 
            path: "/raid/:raidId/settings",
            element: <RaidSettings />,
            loader: RaidSettingsLoader
          }
        ]
      }
    ]
  },
  
]

const router = createBrowserRouter(v2_routes);

ReactDOM.createRoot(document.getElementById("root") as Element).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);