import { useLoaderData, useOutletContext } from "react-router-dom";
import _ from "lodash";

import api from "../api/api";

import Map from '../component/Map'
import "./MapView.css";
import { TrackingPositionalData, TrackingRaidData } from "../types/api_types";

export async function loader(loaderData: any) {
  const positions = await api.getRaidPositionalData(
    loaderData.params.profileId,
    loaderData.params.raidId,
    true
  );

  return { positions, profileId : loaderData.params.profileId, raidId : loaderData.params.raidId };
}

export default function MapView() {
  const { positions, profileId, raidId } = useLoaderData() as {
    positions: TrackingPositionalData[][];
    profileId: string,
    raidId: string
  };

  const { raidData } = useOutletContext() as {
    raidData: TrackingRaidData
  };

  return <>
    <Map raidData={raidData} profileId={profileId} raidId={raidId} positions={positions} />
  </>;
}
