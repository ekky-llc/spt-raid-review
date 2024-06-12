// @ts-nocheck

import { useEffect, useRef, useMemo, useCallback, useLayoutEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, useLoaderData, Link } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import _, { forIn, transform } from 'lodash';
import ResizeObserver from 'resize-observer-polyfill';

import { msToHMS } from '../pages/Profile.js'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.js';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import 'leaflet-fullscreen/dist/Leaflet.fullscreen.js';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';
import '../modules/leaflet-control-coordinates.js';
import '../modules/leaflet-control-groupedlayer.js';
import '../modules/leaflet-control-raid-info.js';
import { calculateNewPosition, findInsertIndex } from '../modules/utils'

import './Map.css'

import { useMapImages } from '../modules/maps-index.js';
import { TrackingPositionalData } from '../types/api_types.js';
import api from '../api/api.js';
import { start } from 'repl';
import { PlayerSlider } from './MapPlayerSlider.js';
import { off } from 'process';

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
    if (!latLng && !latLng.lng && !latLng.lat) {
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

function calculateProportionalRadius(mapBounds) {
    const baseRadius = 0.5;

    const [maxLon, minLat] = mapBounds[0];
    const [minLon, maxLat] = mapBounds[1];
    
    const width = maxLon - minLon;
    const height = maxLat - minLat;
  
    // Assuming width is our reference size
    const referenceWidth = 145.5; // This can be your original reference width
  
    const scalingFactor = width / referenceWidth;
  
    return baseRadius * scalingFactor;
};
  
const colors = [
    "#3357FF", // Blue
    "#FF5733", // Red-Orange
    "#33FF57", // Green
    "#FF33A1", // Pink
    "#33FFF3", // Cyan
    "#FF33E9", // Magenta
    "#FFD433", // Yellow
    "#8D33FF", // Purple
    "#33FF8D", // Light Green
    "#FF9633", // Orange
    "#3366FF", // Royal Blue
    "#FF3380", // Hot Pink
    "#FFA533", // Light Orange
    "#33FFAF", // Mint Green
    "#5733FF", // Indigo
    "#FF33D4", // Light Magenta
    "#33FFCC", // Teal
    "#FF5733", // Coral
    "#5733FF", // Dark Violet
    "#FFD433", // Gold
    "#B833FF", // Violet
    "#33FF57", // Lime
    "#33FF57", // Forest Green
    "#FF3333", // Red
    "#3399FF", // Sky Blue
    "#FF33B8", // Rose
    "#8CFF33", // Lime Green
    "#33FFD5", // Turquoise
    "#FF6F33", // Dark Orange
    "#FF3333", // Crimson
    "#FF5733", // Tomato
    "#33D4FF", // Deep Sky Blue
    "#FF5733", // Salmon
    "#FF3380", // Deep Pink
    "#33FF57", // Spring Green
    "#33FF57", // Medium Sea Green
    "#FF33E9", // Orchid
    "#FFD433", // Khaki
    "#FF33A1", // Hot Pink
    "#FF33D4", // Light Pink
    "#8D33FF", // Plum
    "#33FFF3", // Light Cyan
    "#FF9633", // Dark Salmon
    "#33FF8D", // Pale Green
    "#FF33A1", // Deep Pink
    "#33FF8D", // Sea Green
    "#33FFF3", // Aqua
];

export default function Map({ raidData, profileId, raidId, positions }) {
    const navigate = useNavigate();
    const [ searchParams ] = useSearchParams();
    const [ currentMap, setCurrentMap ] = useState('')

    // Map
    const [ availableLayers, setAvailableLayers ] = useState([]);
    const [ selectedLayer, setSelectedLayer ] = useState('');
    const [ followPlayer, setFollowPlayer ] = useState(9999);
    const [ playerFocus, setPlayerFocus ] = useState(null);
    const [ proportionalScale, setProportionalScale ] = useState(0);

    // Player
    const [ playing, setPlaying ] = useState(false);
    const [ playbackSpeed, setPlaybackSpeed ] = useState(1);
    const [ timeCurrentIndex, setTimeCurrentIndex ] = useState(0);
    const [ timeStartLimit, setTimeStartLimit ] = useState(0);
    const [ timeEndLimit, setTimeEndLimit ] = useState(0);
    const [ sliderTimes, setSliderTimes ] = useState([]);
    const [ hideSettings, setHideSettings ] = useState(true);
    const [ hidePlayers, setHidePlayers ] = useState(false);
    const [ hideEvents, setHideEvents ] = useState(false);
    const [ preserveHistory, setPreserveHistory ] = useState(false);
    const [ hideNerdStats, setHideNerdStats ] = useState(true);

    // Events
    const [ events, setEvents ] = useState([]);

    const focusItem = useRef(searchParams.get('q') ? searchParams.get('q').split(',') : []);
    const mapViewRef = useRef({});

    useEffect(() => {

        const locations = {
            "bigmap": "customs",
            "Sandbox": "ground-zero",
            "develop": "ground-zero",
            "factory4_day": "factory",
            "factory4_night": "factory",
            "hideout": "hideout",
            "Interchange": "interchange",
            "laboratory": "the-lab",
            "Lighthouse": "lighthouse",
            "privatearea": "private-area",
            "RezervBase": "reserve",
            "Shoreline": "shoreline",
            "suburbs": "suburbs",
            "TarkovStreets": "streets-of-tarkov",
            "terminal": "terminal",
            "town": "town",
            "Woods": "woods",
            "base": "base"
        };

        setCurrentMap(locations[raidData.location]);

        const newEvents = []
        for (let i = 0; i < raidData.kills.length; i++) {
            const kill = raidData.kills[i];
            newEvents.push({
                time: kill.time,
                profileId: kill.profileId,
                profileNickname: raidData.players.find(p => p.profileId === kill.profileId).name,
                killedId: kill.killedId,
                killedNickname: raidData.players.find(p => p.profileId === kill.killedId).name,
                weapon: kill.weapon,
                distance: Number(kill.distance),
                source: JSON.parse(kill.positionKiller),
                target: JSON.parse(kill.positionKilled)
            })
        }

        setEvents(newEvents);
    }, [raidData])

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
    const [MAP, SET_MAP] = useState(null);

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

    // Map Renderer
    useEffect(() => {
        if (!mapData || mapData.projection !== 'interactive') {
            return;
        }

        let newAvailableLayers = mapData.layers.map(x => { return { name: x.name, value: x.name } });
        setAvailableLayers([{ name: 'Base', value: '' }, ...newAvailableLayers]);

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

        setProportionalScale(calculateProportionalRadius(mapData.bounds));

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

        SET_MAP(map);
        
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

        if (selectedLayer === '') {
            layerOptions.opacity = 1;
        } else {
            layerOptions.opacity = 0.3;
        }

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

        for (const layer of mapData.layers) {
            let heightLayer;

            const layerOptions = {
                name: layer.name,
                extents: layer.extents || baseLayer.options?.extents,
                type: 'map-layer',
                overlay: Boolean(layer.extents),
            };
        
            heightLayer = L.imageOverlay(layer.svgPath, bounds, layerOptions);

            if (selectedLayer === layer.name || mapViewRef.current.layer === layer.name) {
                heightLayer.addTo(map);
            } else if (!selectedLayer && layer.show) {
                heightLayer.addTo(map);
            }
        }

        // Set default zoom level
        // map.fitBounds(bounds);
        // map.fitWorld({ maxZoom: Math.max(mapData.maxZoom, mapData.minZoom) });

        // maxBounds are bigger than the map and the map center is not in 0,0 so we need to move the view to real center
        // console.log("Center:", L.latLngBounds(bounds).getCenter(true));
        if (!mapViewRestored) {
            map.setView(L.latLngBounds(bounds).getCenter(true), undefined, {animate: false});
        }

        mapRef.current = map;

        const mapDiv = document.getElementById('leaflet-map');
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
            window.dispatchEvent(new Event('resize'));
        });
        resizeObserver.observe(mapDiv);

    }, [mapData, mapRef, navigate, mapViewRef, selectedLayer]);

    // Positon Renderer
    useEffect(() => {             

        let times = [];

        if (MAP) {
            clearMap(MAP)
        }

        for (let i = 0; i < positions.length; i++) {
            const playerPositions = positions[i];
            const cleanPositions = [];
            let currentDirection = 0;
            
            const currentIndexId = playerPositions[0].profileId;
            const isPlayerDead = events.find(e => e.killedId === currentIndexId && e.time < timeEndLimit);

            for (let j = 0; j < playerPositions.length; j++) {
                const playerPosition = playerPositions[j];
                times.push(playerPosition.time);


                if (timeEndLimit && timeStartLimit) {
                    if (playerPosition.time > (!isPlayerDead ? timeStartLimit : (timeEndLimit * -1000)) && playerPosition.time < timeEndLimit ) {
                        cleanPositions.push([playerPosition.z, playerPosition.x])
                    }
                }

                if (playerPositions.length - 1 === j) {
                    currentDirection = playerPosition.dir;
                }

            }

            // Hide player movement if enabled
            if (!hidePlayers && MAP && cleanPositions.length > 0) {

                // If player is focused, opacques out all other players
                if (playerFocus !== null && playerFocus === i) {
                    L.polyline(cleanPositions, { color: colors[i], weight: 4, opacity: 1 }).addTo(MAP).addTo(MAP).on('click', () => { setFollowPlayer(i); console.log(i, followPlayer);});
                    L.circle(cleanPositions[cleanPositions.length - 1], { radius: proportionalScale, color: colors[i], fillOpacity: 1, fillRule: 'nonzero' }).addTo(MAP).on('click', () => {setFollowPlayer(i); console.log(i, followPlayer);});
                } else {
                    L.polyline(cleanPositions, { color: colors[i], weight: 4, opacity: preserveHistory ? 0.1 : isPlayerDead ? 0 : 0.1 }).addTo(MAP).addTo(MAP).on('click', () => {setFollowPlayer(i); console.log(i, followPlayer);});
                    if (!isPlayerDead) {

                        L.circle(cleanPositions[cleanPositions.length - 1], { radius: proportionalScale, color: colors[i], opacity: isPlayerDead ? 0 : 0.1, fillOpacity: 1, fillRule: 'nonzero' })
                        .addTo(MAP);

                        if (followPlayer === i) {
                            MAP.panTo(cleanPositions[cleanPositions.length - 1], 4)
                        }
                    }
                }
                
                // Normal rendering
                if (playerFocus === null) {
                    L.polyline(cleanPositions, { color: colors[i], weight: 4, opacity: preserveHistory ? 0.8 : isPlayerDead ? 0 : 0.8 }).addTo(MAP).addTo(MAP).on('click', () => {setFollowPlayer(i); console.log(i, followPlayer);});
                    if (!isPlayerDead) {

                        L.circle(cleanPositions[cleanPositions.length - 1], { radius: proportionalScale, color: colors[i], fillOpacity: 1, fillRule: 'nonzero' })
                        .addTo(MAP);

                        if (followPlayer === i) {
                            MAP.setZoom(3)
                            MAP.panTo(cleanPositions[cleanPositions.length - 1], 4)
                        }
                    }
                }

            }
        }

        for (let i = 0; i < events.length; i++) {
            const e = events[i];
            
            const toBeIndex = findInsertIndex(e.time, sliderTimes);
            if (toBeIndex < timeCurrentIndex) {
                if (!hideEvents && MAP) {
                    if (preserveHistory || toBeIndex > (timeCurrentIndex - 200)) {
                        var killerIcon = L.divIcon({className: 'killer-icon', html: `<img src="/target.png" />`});
                        L.marker([e.source.z, e.source.x], {icon: killerIcon}).addTo(MAP);
                        L.polyline([[e.source.z, e.source.x],[e.target.z, e.target.x]], { color: 'red', weight: 2, dashArray: [10], dashOffset: 3,  opacity: 0.75 }).addTo(MAP);
                    }
                    
                    var deathHtml = `☠️<span class="tooltiptext event event-map text-sm">${e.profileId === e.killedId ? `<strong>${e.profileNickname}</strong><br/>died` : `<strong>${e.profileNickname}</strong><br/>killed<br/><strong>${e.killedNickname}</strong>`}</span>`
                    var deathIcon = L.divIcon({className: 'death-icon tooltip event', html:deathHtml });
                    L.marker([e.target.z, e.target.x], {icon: deathIcon}).addTo(MAP).on('click', () => highlight([[e.target.z, e.target.x], [e.source.z, e.source.x]], e.time));
                }
            }
        }
        
        if (sliderTimes.length === 0) {
            times = _.chain(times).uniq().sort((t) => t).value();
            setSliderTimes(times);
            setTimeStartLimit(times[0]);
            setTimeEndLimit(times[times.length - 1]);
            setTimeCurrentIndex(times.length - 1);
        }

        if (preserveHistory) {
            setTimeStartLimit(sliderTimes[0])
        } else {
            setTimeStartLimit(sliderTimes[Math.max(0, timeCurrentIndex - 200)]);
        }

        function clearMap(m) {
            for (const key in m._layers) {
                const layer = m._layers[key];
                if (layer._path !== undefined || layer._icon !== undefined) {
                    m.removeLayer(layer)
                }
            }
        }

    }, [mapData, mapRef, navigate, mapViewRef, timeEndLimit, timeStartLimit, timeCurrentIndex, MAP, preserveHistory, events, hideEvents, hidePlayers, followPlayer, playerFocus]);

    // Slider Updater
    useEffect(() => {
        if (!playing || sliderTimes.length === 0) {
            return;
        }
    
        const interval = setInterval(() => {

            setTimeCurrentIndex(prevIndex => {
                // Check if we've reached the end of the sliderTimes
                if (prevIndex >= sliderTimes.length - 1) {
                    clearInterval(interval);
                    setPlaying(false);
                    return prevIndex;
                }
    
                const frame = sliderTimes[prevIndex];
                const startFrame = sliderTimes[Math.max(0, prevIndex - 200)];
    
                if (!preserveHistory && startFrame) {
                    setTimeStartLimit(startFrame);
                }

                if (preserveHistory) {
                    setTimeStartLimit(sliderTimes[0])
                }
    
                setTimeEndLimit(frame);
    
                return prevIndex + 1;
            });
        }, 1000 / (24 * playbackSpeed));
    
        return () => clearInterval(interval);
    }, [playing, sliderTimes, playbackSpeed, timeCurrentIndex, preserveHistory]);
    
    function playPositions() {
        if (timeCurrentIndex === sliderTimes.length - 1) {
            setTimeEndLimit(sliderTimes[0])
            setTimeStartLimit(sliderTimes[0]);
            setTimeCurrentIndex(0);
        }
        setPlaying(prevPlaying => !prevPlaying);
    }
    
    function highlight(coords, time) {
        if (!MAP) return; 
        const frameIndex = findInsertIndex(time, sliderTimes) + 1;
        setTimeCurrentIndex(frameIndex);
        setTimeEndLimit(sliderTimes[frameIndex]);
        setTimeStartLimit(sliderTimes[frameIndex - 200]);
        MAP.flyToBounds(coords, { maxZoom: 4,  animate: true });
        return 
    }

    function playerWasKilled(playerId: string, time: number): boolean {
        if (raidData && raidData.kills) {
          return !!raidData.kills.find((kill) => kill.killedId === playerId && kill.time < time);
        } else {
          return false;
        }
    }

    return (
        <div className="map-container" key="map-wrapper">
            <div className='parent'>
                <nav className='flex top'>
                    <div>
                        { availableLayers.map(layer => (
                            <button key={layer.value} className={`text-sm p-2 mr-2 py-1 text-sm ${layer.value === selectedLayer ? 'bg-eft text-black' : 'cursor-pointer border border-eft text-eft'} mb-2 ml-auto`} onClick={() => setSelectedLayer(layer.value)}>{layer.name}</button>
                        ))}
                    </div>
                    <Link to={`/p/${profileId}/raid/${raidId}`} className='text-sm p-2 py-1 text-sm cursor-pointer border border-eft text-eft mb-2 ml-auto'>Close</Link>
                </nav>
                <aside className='sidebar border border-eft mr-3 p-3 overflow-x-auto'>
                    <div className="playerfeed text-eft">
                        <strong>Legend</strong>
                        <ul>
                            { raidData.players.filter(p => p.spawnTime < timeEndLimit).map((player, index) => 
                                <li className="flex items-center justify-between player-legend-item px-2" key={player.profileId} onMouseEnter={() => setPlayerFocus(index)} onMouseLeave={() => setPlayerFocus(null)} onClick={() => setFollowPlayer(followPlayer === index ? 999999 : index)}>
                                    <div className={`flex flex-row items-center ${playerWasKilled(player.profileId, timeEndLimit)? "line-through opacity-25": ""}`}>
                                        <span style={{width: '8px', height: '8px', borderRadius: '50%', marginRight: '8px', background : colors[index]}}></span>
                                        <span>
                                            {player.name}
                                        </span>
                                    </div>
                                    { followPlayer === index ? 
                                        <span className='text-xs'>
                                            [FOLLOWING]
                                        </span> : ''
                                    }
                                </li>
                            )}
                        </ul>
                    </div>
                </aside>
                <div className="map-wrapper border border-eft map">
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
                    <div className="kill-stream">
                        {events
                            .filter(e => findInsertIndex(e.time, sliderTimes) < timeCurrentIndex)
                            .reverse()
                            .slice(0, 4)
                            .map(e => (
                                <div className="text-eft" key={e.id}>
                                    <span className="tooltiptext event">
                                        <strong>{e.profileNickname}</strong> killed <strong>{e.killedNickname}</strong> [<a className="underline cursor-pointer" onClick={() => highlight([[e.target.z, e.target.x], [e.source.z, e.source.x]], e.time)}>VIEW</a>]
                                    </span>
                                </div>
                            ))}
                    </div>
                    <div id="leaflet-map" ref={onMapContainerRefChange} className={'leaflet-map-container'}/>
                </div>
                <div className="dev__time_sliders p-3 border border-eft mt-4 timeline">
                        <PlayerSlider
                            events={hideEvents ? [] : events}
                            sliderTimes={sliderTimes}
                            timeCurrentIndex={timeCurrentIndex}
                            setTimeCurrentIndex={setTimeCurrentIndex}
                            setTimeStartLimit={setTimeStartLimit}
                            setTimeEndLimit={setTimeEndLimit}
                            preserveHistory={preserveHistory}
                            playerFocus={playerFocus}
                        />
                        <input className='w-full hidden' type="range" min={sliderTimes[0]} max={sliderTimes[sliderTimes.length - 1]} value={timeEndLimit} onChange={e => setTimeEndLimit(e.target.value)} />
                        <input className='w-full hidden' type="range" min={sliderTimes[0]} max={sliderTimes[sliderTimes.length - 1]} value={timeStartLimit} onChange={e => setTimeStartLimit(e.target.value)} />
                    <div className="text-eft mb-2 flex justify-between">
                        <span>{ msToHMS(timeEndLimit) }</span>
                        <span className={`${hideNerdStats ? 'invisible' : ''}`}>{ ((timeCurrentIndex / sliderTimes.length) * 100).toFixed(0) }% | {24 * playbackSpeed}fps | Frame: {timeCurrentIndex} / { sliderTimes.length - 1 }  | Cut In/Out (ms): { timeStartLimit } / { timeEndLimit }</span>
                        <span>{ msToHMS(sliderTimes.length > 0 ? sliderTimes[sliderTimes.length - 1] : 0) }</span>
                    </div>
                    <div className='flex gap-1'>
                        <button className={`text-sm p-2 py-1 text-sm ${playing ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => playPositions()}>{ playing ? '⏸️' : '▶️' }</button>
                        <button className={`text-sm p-2 py-1 text-sm ${!playing ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setPlaying(false)}>⏹️</button>
                        <button className={`text-sm p-2 py-1 text-sm ${playbackSpeed === 1 ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setPlaybackSpeed(1)}>1x</button>
                        <button className={`text-sm p-2 py-1 text-sm ${playbackSpeed === 2 ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setPlaybackSpeed(2)}>2x</button>
                        <button className={`text-sm p-2 py-1 text-sm ${playbackSpeed === 4 ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setPlaybackSpeed(4)}>4x</button>
                        <button className={`text-sm p-2 py-1 text-sm ${playbackSpeed === 8 ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setPlaybackSpeed(8)}>8x</button>
                        <button className={`text-sm p-2 py-1 mr-4 text-sm ${playbackSpeed === 16 ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setPlaybackSpeed(16)}>16x</button>
                        <button className={`text-sm p-2 py-1 text-sm ${!hideSettings ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setHideSettings(!hideSettings)}>⚙️</button>
                        <div className={`border border-eft p-1 flex gap-1 ${hideSettings ? 'invisible' : ''}`}>
                            <button className={`text-xs p-1 text-sm cursor-pointer ${hideEvents ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setHideEvents(!hideEvents)}>Hide Events</button>
                            <button className={`text-xs p-1 text-sm cursor-pointer ${hidePlayers ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setHidePlayers(!hidePlayers)}>Hide Players</button>
                            <button className={`text-xs p-1 text-sm cursor-pointer ${preserveHistory ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft tooltip info`} onClick={() => setPreserveHistory(!preserveHistory)}>
                                Preserve
                                <span class="tooltiptext info">If enabled, keeps all activity visible throughout playback, otherwise, only recent activity is kept visible.</span>
                            </button>
                            <button className={`text-xs p-1 text-sm cursor-pointer ${!hideNerdStats ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setHideNerdStats(!hideNerdStats)}>Debug</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>)
}