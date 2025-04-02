import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createBrowserRouter, RouteObject, RouterProvider } from "react-router";
import "./index.css";

import Layout, { loader as LayoutLoader } from './pages/V2/Layout';
import Raids, { loader as RaidsLoader } from './pages/V2/Raids';
import Settings, { loader as SettingsLoader } from './pages/V2/Settings';
import Raid, { loader as RaidLoader, communityLoader as CommunityRaidLoader } from "./pages/V2/Raid";
import RaidOverview from "./pages/V2/RaidOverview";
import RaidMap, { loader as RaidMapLoader, communityLoader as CommunityRaidMapLoader } from "./pages/V2/RaidMap";
import RaidCharts from "./pages/V2/RaidCharts";
import RaidTimeline from "./pages/V2/RaidTimeline";
import RaidSettings, { loader as RaidSettingsLoader } from "./pages/V2/RaidSettings";
import RaidImport from "./pages/V2/RaidImport";

import CommunityHome from "./pages/Community/CommunityHome";
import Account from "./pages/Community/Account";
import Auth from "./pages/Community/Auth";
import SignOut from "./pages/Community/SignOut";
import RaidListings, { loader as RaidListingsLoader } from "./pages/Community/RaidListings";
import RaidShare, { loader as RaidShareLoader } from "./pages/V2/RaidShare";
import RaidMerge, { loader as RaidMergeLoader } from "./pages/V2/RaidMerge";

import { ErrorPage } from './pages/Shared/ErrorPage';
import { RedirectedErrorPage } from './pages/Shared/RedirectedErrorPage';

const v2_routes = [
  {
    path: "/",
    element: <Layout />,
    loader: LayoutLoader,
    children: [
      {
        path: "/",
        element: <Raids />,
        loader: RaidsLoader,
        errorElement: <RedirectedErrorPage />,
      },
      {
        path: "/settings",
        element: <Settings />,
        loader: SettingsLoader,
        errorElement: <RedirectedErrorPage />,
      },
      {
        path: "/import",
        element: <RaidImport />,
        errorElement: <RedirectedErrorPage />,
      },
      {
        path: '/merge',
        element: <RaidMerge />,
        loader: RaidMergeLoader,
        errorElement: <RedirectedErrorPage />,
      },
      {
        path: "/raid/:raidId",
        element: <Raid />,
        loader: RaidLoader,
        children: [
          {
            path: "/raid/:raidId",
            element: <RaidOverview />,
            errorElement: <RedirectedErrorPage />,
          },
          {
            path: "/raid/:raidId/charts",
            element: <RaidCharts />,
            errorElement: <RedirectedErrorPage />,
          },
          {
            path: "/raid/:raidId/timeline",
            element: <RaidTimeline />,
            errorElement: <RedirectedErrorPage />,
          },
          {
            path: "/raid/:raidId/map",
            element: <RaidMap />,
            loader: RaidMapLoader
          },
          {
            path: "/raid/:raidId/share",
            element: <RaidShare />,
            loader: RaidShareLoader,
            errorElement: <RedirectedErrorPage />,
          },
          {
            path: "/raid/:raidId/settings",
            element: <RaidSettings />,
            loader: RaidSettingsLoader,
            errorElement: <RedirectedErrorPage />,
          }
        ]
      }
    ]
  },
  {
    path: "/error",
    element: <ErrorPage />
  }
] as RouteObject[];

const community_routes = [
  {
    path: '/',
    element: <CommunityHome />,
    children: [
      {
        path: '/',
        element: <RaidListings />,
        loader: RaidListingsLoader,
        errorElement: <RedirectedErrorPage />,
      },
      {
        path: '/raid/:raidId',
        element: <Raid />,
        loader: CommunityRaidLoader,
        children: [
          {
            path: "/raid/:raidId",
            element: <RaidOverview />,
            errorElement: <RedirectedErrorPage />,
          },
          {
            path: "/raid/:raidId/charts",
            element: <RaidCharts />,
            errorElement: <RedirectedErrorPage />,
          },
          {
            path: "/raid/:raidId/timeline",
            element: <RaidTimeline />,
            errorElement: <RedirectedErrorPage />,
          },
          {
            path: "/raid/:raidId/map",
            element: <RaidMap />,
            loader: CommunityRaidMapLoader
          }
        ]
      },
      {
        path: '/my-account',
        element: <Account />,
        errorElement: <RedirectedErrorPage />,
      },
      {
        path: '/auth',
        element: <Auth />,
        errorElement: <RedirectedErrorPage />,
      },
      {
        path: '/sign-out',
        element: <SignOut />,
        errorElement: <RedirectedErrorPage />,
      }
    ]
  },
  {
    path: "/error",
    element: <ErrorPage />
  }
] as RouteObject[];

const routeToUse = import.meta.env.VITE_COMMUNITY ? community_routes : v2_routes;
const router = createBrowserRouter(routeToUse);

ReactDOM.createRoot(document.getElementById("root") as Element).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// Temporary Fix for Recharts: 
// - https://github.com/recharts/recharts/issues/3615
const error = console.error;
console.error = (...args: any) => {
  if (/defaultProps/.test(args[0])) return;
  error(...args);
};