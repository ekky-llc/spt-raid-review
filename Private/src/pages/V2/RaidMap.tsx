import { LoaderFunctionArgs, useLoaderData, useOutletContext } from "react-router-dom";
import _ from "lodash";

import api from "../../api/api";
import MapComponent from '../../component/MapComponent'
import { TrackingPositionalData, TrackingRaidData } from "../../types/api_types";
import cyr_to_en from '../../assets/cyr_to_en.json';

import "./RaidMap.css";
import { community_api } from "../../api/community_api";

export async function loader(loaderData: LoaderFunctionArgs) {
  const positions = await api.getRaidPositionalData(loaderData.params.raidId as string) || [];
  const intl = await api.getIntl();
  const intl_dir : Record<string, string> = {...intl, ...cyr_to_en};
  return { positions, raidId : loaderData.params.raidId, intl_dir, communityHub: false  };
}

export async function communityLoader(loaderData: LoaderFunctionArgs) {
  const positions = await community_api.getRaidPositionalData(loaderData.params.raidId as string) || [];
  const intl = await community_api.getIntl();
  const intl_dir : Record<string, string> = {...intl, ...cyr_to_en};
  return { positions, raidId : loaderData.params.raidId, intl_dir, communityHub: true };
}

export default function MapView() {
  const { positions, raidId, intl_dir, communityHub } = useLoaderData() as {
    positions: TrackingPositionalData[][];
    raidId: string,
    intl_dir: Record<string, string>,
    communityHub: boolean
  };

  const { raid } = useOutletContext() as {
    raid: TrackingRaidData
  };

  return <>
    <MapComponent raidData={raid} raidId={raidId} positions={positions} intl_dir={intl_dir} communityHub={communityHub}/>
  </>;
}
