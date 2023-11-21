import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import Home, { loader as profilesLoader } from './pages/Home';
import Profile, { loader as profileLoader } from './pages/Profile'
import Raid from './pages/Raid';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    loader: profilesLoader,
  },
  {
    path: "/p/:profileId",
    element: <Profile />,
    loader: profileLoader,
    children: [
      {
        path: "/p/:profileId/stats/",
        element: <>Stats</>
      },
      {
        path: "/p/:profileId/raids/",
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