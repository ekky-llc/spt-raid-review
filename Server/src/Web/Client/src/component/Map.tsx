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
    "#FFFF99", // Canary
    "#FF33A1", // Pink
    "#33FFF3", // Cyan
    "#FF33E9", // Magenta
    "#FFD433", // Yellow
    "#8D33FF", // Purple //TODO: Reserved for Raiders so need to make sure it's not used by players
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
    "#FF3333", // Red //TODO: Reserved for bosses so need to make sure it's not used by players
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
    const [ selectedStyle, setSelectedStyle ] = useState('');
    const [ selectedLayer, setSelectedLayer ] = useState('');
    const [ followPlayer, setFollowPlayer ] = useState(9999);
    const [ followPlayerZoomed, setFollowPlayerZoomed ] = useState(false);
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
        if (window.location.pathname.includes('map')) {
            document.querySelector('body').style = "overflow: hidden;";
        }
    },[])

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
            "woods": "woods",
            "Woods": "woods",
            "base": "base"
        };

        setCurrentMap(locations[raidData.location]);
        // setCurrentMap("interchange");
        
        const newEvents = []
        if (raidData && raidData.players) { 
            for (let i = 0; i < raidData.kills.length; i++) {
                const kill = raidData.kills[i];

                const profileNickname = raidData.players.find(p => p.profileId === kill.profileId);
                const killedNickname = raidData.players.find(p => p.profileId === kill.killedId);

                newEvents.push({
                    time: kill.time,
                    profileId: kill.profileId,
                    profileNickname : profileNickname ? profileNickname.name : 'Unknown',
                    killedId: kill.killedId,
                    killedNickname : killedNickname ? killedNickname.name  : 'Unknown',
                    weapon: kill.weapon,
                    distance: Number(kill.distance),
                    source: JSON.parse(kill.positionKiller),
                    target: JSON.parse(kill.positionKilled)
                });
            }
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
        const map = allMaps[currentMap];

        if (map && map.layers) {
            let newAvailableLayers = map.layers.map(x => ({ name: x.name, value: x.name }));
            setAvailableLayers([{ name: 'Base', value: '' }, ...newAvailableLayers]);
        }

        return map;
    }, [allMaps, currentMap]);

    // Map Renderer

    useEffect(() => {
        if (!mapData || mapData.projection !== 'interactive') {
            return;
        }
    
        let mapCenter = [0, 0];
        let mapZoom = mapData.minZoom + 1;
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
    
        map.on('zoom', () => {
            mapViewRef.current.zoom = map.getZoom();
        });
    
        map.on('move', () => {
            mapViewRef.current.center = map.getCenter();
        });
    
        const bounds = getBounds(mapData.bounds);
        const baseLayerOptions = {
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
    
        const tileSize = mapData.tileSize || 256;
    
        // Create separate layer groups for base layers and overlay layers
        const baseLayerGroup = L.layerGroup().addTo(map);
        const overlayLayerGroup = L.layerGroup().addTo(map);
    
        // Add base layers
        if (mapData.tilePath) {
            const tileLayer = L.tileLayer(mapData.tilePath, {
                tileSize,
                bounds,
                ...baseLayerOptions,
            });
            baseLayerGroup.addLayer(tileLayer);
        }
    
        if (mapData.svgPath) {
            const svgBounds = mapData.svgBounds ? getBounds(mapData.svgBounds) : bounds;
            const svgLayer = L.imageOverlay(mapData.svgPath, svgBounds, baseLayerOptions);
            baseLayerGroup.addLayer(svgLayer);
        }
    
        // Add overlay layers
        if (mapData.layers) {
            for (let i = 0; i < mapData.layers.length; i++) {
                const layer = mapData.layers[i];
                const layerOptions = {
                    ...baseLayerOptions,
                    name: layer.name,
                    extents: layer.extents || baseLayerOptions.extents,
                    type: "map-layer",
                    overlay: Boolean(layer.extents),
                };
        
                if (layer.tilePath) {
                    const tileLayer = L.tileLayer(layer.tilePath, {
                        tileSize,
                        bounds,
                        ...layerOptions,
                    });
                    overlayLayerGroup.addLayer(tileLayer);
                }
        
                if (layer.svgPath) {
                    const svgBounds = layer.svgBounds ? getBounds(layer.svgBounds) : bounds;
                    const svgLayer = L.imageOverlay(layer.svgPath, svgBounds, layerOptions);
                    overlayLayerGroup.addLayer(svgLayer);
                }
            }
        }
        // Set initial visibility based on selectedLayer
        if (selectedLayer === '') {
            baseLayerGroup.addTo(map);
        } else {
            overlayLayerGroup.addTo(map);
        }
    
        // Function to handle layer visibility and opacity based on selectedLayer
        const toggleLayers = () => {
            // Set opacity for base layers
            baseLayerGroup.eachLayer(layer => {
                if (selectedLayer === '') {
                    layer.setOpacity(1); // Active layer
                } else {
                    layer.setOpacity(0.3); // Inactive layers
                }
            });

            // Set opacity for overlay layers
            overlayLayerGroup.eachLayer(layer => {
                if (selectedLayer === layer.options.name) {
                    layer.setOpacity(1); // Active layer
                } else {
                    layer.setOpacity(0); // Inactive layers
                }
            });
        };

    
        // Toggle layers when selectedLayer changes
        toggleLayers();
    
        if (map && !mapViewRestored) {
            map.setView(L.latLngBounds(bounds).getCenter(true), undefined, { animate: false });
        }
    
        mapRef.current = map;
    }, [mapData, mapRef, mapViewRef, selectedLayer, selectedStyle]);
    
    // Positon Renderer
    useEffect(() => {    
        
        requestAnimationFrame(() => {

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

                const player = raidData.players.find(p => p.profileId === currentIndexId);
                const index = raidData.players.findIndex(p => p.profileId === currentIndexId);
                const pickedColor = getPlayerColor(player, index);

                // Hide player movement if enabled
                if (!hidePlayers && MAP && cleanPositions.length > 0) {

                    // If player is focused, opacques out all other players
                    if (playerFocus !== null && playerFocus === i) {
                        L.polyline(cleanPositions, { color: pickedColor, weight: 4, opacity: 1 }).addTo(MAP).addTo(MAP).on('click', () => { setFollowPlayer(i); setFollowPlayerZoomed(false);});
                        L.circle(cleanPositions[cleanPositions.length - 1], { radius: proportionalScale, color: pickedColor, fillOpacity: 1, fillRule: 'nonzero' }).addTo(MAP).on('click', () => {setFollowPlayer(i); setFollowPlayerZoomed(false);});
                    } else {
                        L.polyline(cleanPositions, { color: pickedColor, weight: 4, opacity: preserveHistory ? 0.1 : isPlayerDead ? 0 : 0.1 }).addTo(MAP).addTo(MAP).on('click', () => {setFollowPlayer(i); setFollowPlayerZoomed(false);});
                        if (!isPlayerDead) {

                            L.circle(cleanPositions[cleanPositions.length - 1], { radius: proportionalScale, color: pickedColor, opacity: isPlayerDead ? 0 : 0.1, fillOpacity: 1, fillRule: 'nonzero' })
                            .addTo(MAP);

                            if (followPlayer === i) {
                                MAP.panTo(cleanPositions[cleanPositions.length - 1], 4)
                            }
                        }
                    }
                    
                    // Normal rendering
                    if (playerFocus === null) {
                        L.polyline(cleanPositions, { color: pickedColor, weight: 4, opacity: preserveHistory ? 0.8 : isPlayerDead ? 0 : 0.8 }).addTo(MAP).addTo(MAP).on('click', () => {setFollowPlayer(i); setFollowPlayerZoomed(false);});
                        if (!isPlayerDead) {

                            L.circle(cleanPositions[cleanPositions.length - 1], { radius: proportionalScale, color: pickedColor, fillOpacity: 1, fillRule: 'nonzero' })
                            .addTo(MAP);

                            if (followPlayer === i) {
                                if (!followPlayerZoomed) {
                                    MAP.setZoom(3)

                                    // This is here to make sure the user can adjust zoom as a player is followed
                                    setFollowPlayerZoomed(true);
                                }
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

        });

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

    function getPlayerBrain(player: TrackingRaidDataPlayers): string {
        if(player) {
          if (player.team === 'Savage') {
            return "(SCAV)";
          } else if(player.mod_SAIN_brain === "UNKNOWN" && (player.team === "Bear" || player.team === "Usec")) {
            return "(PMC)"
          }
          else return player.mod_SAIN_brain != null ? `(${player.mod_SAIN_brain})` : "(PMC)"
        }
        return "(UNKNOWN)"
    }

    function getPlayerColor(player: TrackingRaidDataPlayers, index: number): string {
        if (player && player.team === 'Savage') return "#33FF57"; // Green - Scav (bosses and raiders included for now)
        else return colors[index]; // PMC
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
                    <Link to={`/p/${profileId}/raid/${raidId}?return=1`} className='text-sm p-2 py-1 text-sm cursor-pointer border border-eft text-eft mb-2 ml-auto' reloadDocument>Close</Link>
                </nav>
                <aside className='sidebar bg-black border border-eft mr-3 p-3 overflow-x-auto'>
                    <div className="playerfeed text-eft">
                        <strong>Legend</strong>
                        <ul>
                            { raidData.players.filter(p => p.spawnTime < timeEndLimit).map((player, index) => 
                                <li className="flex items-center justify-between player-legend-item px-2" key={player.profileId} onMouseEnter={() => setPlayerFocus(index)} onMouseLeave={() => setPlayerFocus(null)} onClick={() => {setFollowPlayer(followPlayer === index ? 999999 : index); setFollowPlayerZoomed(false);}}>
                                    <div className={`flex flex-row items-center ${playerWasKilled(player.profileId, timeEndLimit)? "line-through opacity-25": ""}`}>
                                        <span style={{width: '8px', height: '8px', borderRadius: '50%', marginRight: '8px', background : getPlayerColor(player, index)}}></span>
                                        <span>
                                            {player.name} {getPlayerBrain(player)}
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
                            .map((e, i) => (
                                <div className="text-eft" key={`${e.profileId}_${i}`}>
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
                                <span className="tooltiptext info">If enabled, keeps all activity visible throughout playback, otherwise, only recent activity is kept visible.</span>
                            </button>
                            <button className={`text-xs p-1 text-sm cursor-pointer ${!hideNerdStats ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setHideNerdStats(!hideNerdStats)}>Debug</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>)
}