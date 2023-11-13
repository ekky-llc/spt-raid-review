import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import Home from './pages/Home';
import Profile from './pages/Profile';
import Raid from './pages/Raid';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    children : [{
      path: "/:accountId",
      element: <Profile />
    },{
      path: "/:raidId",
      element: <Raid />
    }]
  },
]);

ReactDOM.createRoot(document.getElementById("root") as Element).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);