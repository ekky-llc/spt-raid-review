import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import Home, { loader as profilesLoader } from './pages/Home';
import Profile, { loader as coreLoader } from './pages/Profile'
import Raid, { loader as raidLoader } from './pages/Raid';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    loader: profilesLoader,
  },
  {
    path: "/p/:profileId",
    element: <Profile />,
    loader: coreLoader,
    children: [
      {
        path: "/p/:profileId/raid/:raidId",
        loader: raidLoader,
        element: <Raid />
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById("root") as Element).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);