import { LoaderFunctionArgs, useLoaderData, useOutletContext } from "react-router-dom";
import _ from "lodash";

import api from "../api/api";
import MapComponent from '../component/MapComponent'
import { TrackingPositionalData, TrackingRaidData } from "../types/api_types";
import cyr_to_en from '../assets/cyr_to_en.json';

import "./MapView.css";

export async function loader(loaderData: LoaderFunctionArgs) {
  const positions = await api.getRaidPositionalData(
    loaderData.params.profileId as string,
    loaderData.params.raidId as string,
    true
  );
  const intl = await api.getIntl();
  
  const intl_dir : Record<string, string> = {...intl, ...cyr_to_en};

  return { positions, profileId : loaderData.params.profileId, raidId : loaderData.params.raidId, intl_dir};
}

export default function MapView() {
  const { positions, profileId, raidId, intl_dir } = useLoaderData() as {
    positions: TrackingPositionalData[][];
    profileId: string,
    raidId: string,
    intl_dir: Record<string, string>
  };

  const { raidData } = useOutletContext() as {
    raidData: TrackingRaidData
  };

  return <>
    <MapComponent raidData={raidData} profileId={profileId} raidId={raidId} positions={positions} intl_dir={intl_dir} />
  </>;
}
