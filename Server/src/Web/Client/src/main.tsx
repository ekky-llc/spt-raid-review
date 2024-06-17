import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import Home, { loader as profilesLoader } from './pages/Home';
import Profile, { loader as coreLoader } from './pages/Profile'
import Raid, { loader as raidLoader } from './pages/Raid';
import MapView, { loader as mapLoader } from './pages/MapView';
import RaidSettings, { loader as raidSettingsLoader } from './pages/RaidSettings';
import ServerSettings, { loader as serverSettingsLoader } from "./pages/ServerSettings";
import About from "./pages/About";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    loader: profilesLoader,
  },
  {
    path: "/p/:profileId",
    element: <Profile />,
    shouldRevalidate : () => true, 
    loader: coreLoader,
    children: [
      {
        path: "/p/:profileId/raid/:raidId/",
        loader: raidLoader,
        element: <Raid />,
        children: [
          {
            path: "/p/:profileId/raid/:raidId/map",
            loader: mapLoader,
            element: <MapView />,
          },
          {
            path: "/p/:profileId/raid/:raidId/settings",
            loader: raidSettingsLoader,
            element: <RaidSettings />,
          },
        ],
      },
      {
        path: "/p/:profileId/about",
        // loader: raidLoader,
        element: <About />,
      },
      {
        path: "/p/:profileId/settings",
        loader: serverSettingsLoader,
        element: <ServerSettings />,
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as Element).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);