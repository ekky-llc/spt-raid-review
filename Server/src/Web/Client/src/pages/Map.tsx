// @ts-nocheck

import { useEffect, useRef, useMemo, useCallback, useLayoutEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import ResizeObserver from 'resize-observer-polyfill';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.js';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import 'leaflet-fullscreen/dist/Leaflet.fullscreen.js';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';
import '../modules/leaflet-control-coordinates.js';
import '../modules/leaflet-control-groupedlayer.js';
import '../modules/leaflet-control-raid-info.js';

import './Map.css'

import positions from '../assets/positionPath.json'

import { setPlayerPosition } from '../../features/settings/settingsSlice.js';
import { useMapImages } from '../modules/maps-index.js';

function getCRS(mapData) {
    let scaleX = 1;
    let scaleY = 1;
    let marginX = 0;
    let marginY = 0;
    if (mapData) {    
        if (mapData.transform) {
            scaleX = mapData.transform[0];
            scaleY = mapData.transform[2] * -1;
            marginX = mapData.transform[1];
            marginY = mapData.transform[3];
        }
    }
    return L.extend({}, L.CRS.Simple, {
        transformation: new L.Transformation(scaleX, marginX, scaleY, marginY),
        projection: L.extend({}, L.Projection.LonLat, {
            project: latLng => {
                return L.Projection.LonLat.project(applyRotation(latLng, mapData.coordinateRotation));
            },
            unproject: point => {
                return applyRotation(L.Projection.LonLat.unproject(point), mapData.coordinateRotation * -1);
            },
        }),
    });
}

function applyRotation(latLng, rotation) {
    if (!latLng.lng && !latLng.lat) {
        return L.latLng(0, 0);
    }
    if (!rotation) {
        return latLng;
    }

    const angleInRadians = (rotation * Math.PI) / 180;
    const cosAngle = Math.cos(angleInRadians);
    const sinAngle = Math.sin(angleInRadians);

    const {lng: x, lat: y} = latLng;
    const rotatedX = x * cosAngle - y * sinAngle;
    const rotatedY = x * sinAngle + y * cosAngle;
    return L.latLng(rotatedY, rotatedX);
}

function pos(position) {
    return [position.z, position.x];
}

function getScaledBounds(bounds, scaleFactor) {
    // Calculate the center point of the bounds
    const centerX = (bounds[0][0] + bounds[1][0]) / 2;
    const centerY = (bounds[0][1] + bounds[1][1]) / 2;
    
    // Calculate the new width and height
    const width = bounds[1][0] - bounds[0][0];
    const height = bounds[1][1] - bounds[0][1];
    const newWidth = width * scaleFactor;
    const newHeight = height * scaleFactor;
    
    // Update the coordinates of the two points defining the bounds
    const newBounds = [
        [centerY - newHeight / 2, centerX - newWidth / 2],
        [centerY + newHeight / 2, centerX + newWidth / 2]
    ];

    // console.log("Initial Rectangle:", bounds);
    // console.log("Scaled Rectangle:", newBounds);
    // console.log("Center:", L.bounds(bounds).getCenter(true));
    
    return newBounds;
}

function checkMarkerBounds(position, markerBounds) {
    if (position.x < markerBounds.TL.x) markerBounds.TL.x = position.x;
    if (position.z > markerBounds.TL.z) markerBounds.TL.z = position.z;
    if (position.x > markerBounds.BR.x) markerBounds.BR.x = position.x;
    if (position.z < markerBounds.BR.z) markerBounds.BR.z = position.z;
}

function getBounds(bounds) {
    if (!bounds) {
        return undefined;
    }
    return L.latLngBounds([bounds[0][1], bounds[0][0]], [bounds[1][1], bounds[1][0]]);
    //return [[bounds[0][1], bounds[0][0]], [bounds[1][1], bounds[1][0]]];
}

function markerIsOnLayer(marker, layer) {
    if (!layer.options.extents) {
        return true;
    }
    var top = marker.options.top || marker.options.position.y;
    var bottom = marker.options.bottom || marker.options.position.y;
    for (const extent of layer.options.extents) {
        if (top >= extent.height[0] && bottom < extent.height[1]) {
            let containedType = 'partial';
            if (bottom >= extent.height[0] && top <= extent.height[1]) {
                containedType = 'full';
            }
            if (extent.bounds) {
                for (const boundsArray of extent.bounds) {
                    const bounds = getBounds(boundsArray);
                    if (bounds.contains(pos(marker.options.position))) {
                        return containedType;
                    }
                }
            } else {
                return containedType;
            }
        }
    }
    return false;
}

function markerIsOnActiveLayer(marker) {
    if (!marker.options.position) {
        return true;
    }

    const map = marker._map;

    // check if marker is completely contained by inactive layer
    const overlays = map.layerControl._layers.map(l => l.layer).filter(l => Boolean(l.options.extents) && l.options.overlay);
    for (const layer of overlays) {
        for (const extent of layer.options.extents) {
            if (markerIsOnLayer(marker, layer) === 'full' && !map.hasLayer(layer) && extent.bounds) {
                return false;
            }
        }
    }

    // check if marker is on active overlay
    const activeOverlay = Object.values(map._layers).find(l => l.options?.extents && l.options?.overlay);
    if (activeOverlay && markerIsOnLayer(marker, activeOverlay)) {
        return true;
    }

    // check if marker is on base layer
    const baseLayer = Object.values(map._layers).find(l => l.options?.extents && !L.options?.overlay);
    if (!activeOverlay && markerIsOnLayer(marker, baseLayer)) {
        return true;
    }

    return false;
}

function checkMarkerForActiveLayers(event) {
    const marker = event.target || event;
    const outline = marker.options.outline;
    const onLevel = markerIsOnActiveLayer(marker);
    if (onLevel) {
        marker._icon?.classList.remove('off-level');
        if (outline) {
            outline._path?.classList.remove('off-level');
        }
    } else {
        marker._icon?.classList.add('off-level');
        if (outline) {
            outline._path?.classList.add('off-level');
        }
    }
    /*if (marker.options.activeQuest === true) {
        marker._icon.classList.add('active-quest-marker');
        marker._icon.classList.remove('inactive-quest-marker');
    } else if (marker.options.activeQuest === false) {
        marker._icon.classList.remove('active-quest-marker');
        marker._icon.classList.add('inactive-quest-marker');
    }*/
}

function mouseHoverOutline(event) {
    const outline = event.target.options.outline;
    if (event.originalEvent.type === 'mouseover') {
        outline._path.classList.remove('not-shown');
    } else if (!outline._path.classList.contains('force-show')) {
        outline._path.classList.add('not-shown');
    }
}

function toggleForceOutline(event) {
    const outline = event.target.options.outline;
    outline._path.classList.toggle('force-show');
    if (outline._path.classList.contains('force-show')) {
        outline._path.classList.remove('not-shown');
    }
    activateMarkerLayer(event);
}

function activateMarkerLayer(event) {
    const marker = event.target || event;
    if (markerIsOnActiveLayer(marker)) {
        return;
    }
    const activeLayers = Object.values(marker._map._layers).filter(l => l.options?.extents && l.options?.overlay);
    for (const layer of activeLayers) {
        layer.removeFrom(marker._map);
    }
    const heightLayers = marker._map.layerControl._layers.filter(l => l.layer.options.extents && l.layer.options.overlay).map(l => l.layer);
    for (const layer of heightLayers) {
        if (markerIsOnLayer(marker, layer)) {
            layer.addTo(marker._map);
            break;
        }
    }
}

function outlineToPoly(outline) {
    if (!outline) return [];
    return outline.map(vector => [vector.z, vector.x]);
}

function addElevation(item, popup) {
    if (!showElevation) {
        return;
    }
    const elevationContent = L.DomUtil.create('div', undefined, popup);
    elevationContent.textContent = `Elevation: ${item.position.y.toFixed(2)}`;
    if (item.top && item.bottom && item.top !== item.position.y && item.bottom !== item.position.y) {
        const heightContent = L.DomUtil.create('div', undefined, popup);
        heightContent.textContent = `Top ${item.top.toFixed(2)}, bottom: ${item.bottom.toFixed(2)}`;
    }
}

function Map() {
    let currentMap = 'factory';
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const focusItem = useRef(searchParams.get('q') ? searchParams.get('q').split(',') : []);

    const mapViewRef = useRef({});

    // useEffect(() => {
    //     let viewableHeight = window.innerHeight - document.querySelector('.navigation')?.offsetHeight || 0;
    //     if (viewableHeight < 100) {
    //         viewableHeight = window.innerHeight;
    //     }

    //     document.documentElement.style.setProperty(
    //         '--display-height',
    //         `${viewableHeight}px`,
    //     );

    //     return function cleanup() {
    //         document.documentElement.style.setProperty(
    //             '--display-height',
    //             `auto`,
    //         );
    //     };
    // });

    const ref = useRef();
    const mapRef = useRef(null);

    const [mapHeight, setMapHeight] = useState(600);

    const onMapContainerRefChange = useCallback(node => {
        if (node) {
            node.style.height = `${mapHeight}px`;
        }
    }, [mapHeight]);

    useEffect(() => {
        ref?.current?.resetTransform();
    }, [currentMap]);

    let allMaps = useMapImages();

    const mapData = useMemo(() => {
        return allMaps[currentMap];
    }, [allMaps, currentMap]);

    useEffect(() => {
        if (!mapData || mapData.projection !== 'interactive') {
            return;
        }

        let mapCenter = [0, 0];
        let mapZoom = mapData.minZoom+1;
        let mapViewRestored = false;
        const maxZoom = Math.max(7, mapData.maxZoom);
        if (mapRef.current?._leaflet_id) {
            if (mapRef.current.options.id === mapData.id) {
                if (mapViewRef.current.center) {
                    mapCenter = [mapViewRef.current.center.lat, mapViewRef.current.center.lng];
                    mapViewRestored = true;
                }
                if (typeof mapViewRef.current.zoom !== 'undefined') {
                    mapZoom = mapViewRef.current.zoom;
                    mapViewRestored = true;
                }
            } else {
                mapViewRef.current.center = undefined;
                mapViewRef.current.zoom = undefined;
                mapViewRef.current.layer = undefined;
            }
            mapRef.current.remove();
        }
        const map = L.map('leaflet-map', {
            maxBounds: getScaledBounds(mapData.bounds, 1.5),
            center: mapCenter,
            zoom: mapZoom,
            minZoom: mapData.minZoom,
            maxZoom: maxZoom,
            zoomSnap: 0.1,
            scrollWheelZoom: true,
            wheelPxPerZoomLevel: 120,
            crs: getCRS(mapData),
            attributionControl: false,
            id: mapData.id,
        });

        map.on('zoom', (e) => {
            mapViewRef.current.zoom = map.getZoom();
        });
        map.on('move', (e) => {
            mapViewRef.current.center = map.getCenter();
        });

        const addLayer = (layer, layerKey, groupKey, layerName) => {
            layer.key = layerKey;
            const layerOptions = getLayerOptions(layerKey, groupKey, layerName);
            if (!layerOptions.layerHidden) {
                layer.addTo(map);
            }
            layerControl.addOverlay(layer, layerOptions.layerName, layerOptions);
        };

        L.control.coordinates({
            decimals: 2,
            labelTemplateLat: 'z: {y}',
            labelTemplateLng: 'x: {x}',
            enableUserInput: false,
            wrapCoordinate: false,
            position: 'bottomright',
            customLabelFcn: (latLng, opts) => {
                return `x: ${latLng.lng.toFixed(2)} z: ${latLng.lat.toFixed(2)}`;
            }
        }).addTo(map);
        
        positions

        L.polyline(positions, {color: 'red'}).addTo(map);

        const bounds = getBounds(mapData.bounds);
        const layerOptions = {
            maxZoom: maxZoom,
            maxNativeZoom: mapData.maxZoom,
            extents: [
                {
                    height: mapData.heightRange || [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
                    bounds: [mapData.bounds],
                }
            ],
            type: 'map-layer',
        };
        let tileLayer = false;
        const baseLayers = [];
        const tileSize = mapData.tileSize || 256;

        let svgLayer = true;
        if (mapData.svgPath) {
            const svgBounds = mapData.svgBounds ? getBounds(mapData.svgBounds) : bounds;
            svgLayer = L.imageOverlay(mapData.svgPath, svgBounds, layerOptions);
            baseLayers.push(svgLayer);
        }


        let baseLayer = svgLayer ? svgLayer : tileLayer;

        baseLayer.addTo(map);

        // Set default zoom level
        map.fitBounds(bounds);
        map.fitWorld({maxZoom: Math.max(mapData.maxZoom-3, mapData.minZoom)});

        // maxBounds are bigger than the map and the map center is not in 0,0 so we need to move the view to real center
        // console.log("Center:", L.latLngBounds(bounds).getCenter(true));
        if (!mapViewRestored) {
            map.setView(L.latLngBounds(bounds).getCenter(true), undefined, {animate: false});
        }

        mapRef.current = map;

        const mapDiv = document.getElementById('leaflet-map');
        const resizeObserver = new ResizeObserver(() => {
            //map.invalidateSize();
            //window.dispatchEvent(new Event('resize'));
        });
        resizeObserver.observe(mapDiv);

    }, [mapData, mapRef, navigate, mapViewRef]);

    return (
        <div className="display-wrapper" key="map-wrapper">
            <TransformWrapper
                ref={ref}
                initialScale={1}
                centerOnInit={true}
                wheel={{
                    step: 0.1,
                }}
                key="map-holder"
            >
                <TransformComponent>
                </TransformComponent>
            </TransformWrapper>
            <div id="leaflet-map" ref={onMapContainerRefChange} className={'leaflet-map-container'}/>
        </div>)
}
export default Map;