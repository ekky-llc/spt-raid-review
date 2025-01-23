// @ts-nocheck

import { useEffect, useRef, useMemo, useCallback, useLayoutEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, useLoaderData, NavLink } from 'react-router';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import ResizeObserver from 'resize-observer-polyfill';
import _, { forIn, map, transform } from 'lodash';
import { start } from 'repl';
import L from 'leaflet';

import api from '../api/api.js';
import { msToHMS, intl } from '../helpers/index.js';
import { calculateNewPosition, findInsertIndex } from '../modules/utils.js'
import { useMapImages } from '../modules/maps-index.js';
import { TrackingPositionalData } from '../types/api_types.js';
import { PlayerSlider } from './MapPlayerSlider.js';

import BotMapping from '../assets/botMapping.json'

import 'leaflet/dist/leaflet.css';
import '../modules/leaflet-heat.js'
import './Map.css'
import { transliterateCyrillicToLatin } from '../helpers/transliterateCyrillicToLatin.js';
import { community_api } from '../api/community_api.js';

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
    
    return newBounds;
}

function getBounds(bounds) {
    if (!bounds) {
        return undefined;
    }
    return L.latLngBounds([bounds[0][1], bounds[0][0]], [bounds[1][1], bounds[1][0]]);
    //return [[bounds[0][1], bounds[0][0]], [bounds[1][1], bounds[1][0]]];
}

function calculateProportionalRadius(mapBounds, zoomLevel) {
    const baseRadius = 2;
    const [maxLon, minLat] = mapBounds[0];
    const [minLon, maxLat] = mapBounds[1];
    
    const width = maxLon - minLon;
    const height = maxLat - minLat;

    const referenceWidth = 145.5;
    const scalingFactor = width / referenceWidth;
    
    const zoomAdjustment = Math.pow(2, zoomLevel - 1);

    return baseRadius * scalingFactor / zoomAdjustment;
}
  
const colors = [
    "#3357FF", // Blue
    "#FFD433", // Yellow
    "#33FFF3", // Cyan
    "#9370DB", // MediumPurple
    "#BC8F8F", // RosyBrown
    "#FF5733", // Red-Orange
    "#7FFFD4", // Aquamarine
    "#FFFF99", // Canary
    "#ae85f9", // Light Purple
    "#FF9633", // Orange
    "#3366FF", // Royal Blue
    "#B87333", // Copper
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
    "#660000", // Blood red
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
    "#ae85f9", // Light Purple
    "#FF33D4", // Light Pink
    "#8D33FF", // Plum
    "#33FFF3", // Light Cyan
    "#FF9633", // Dark Salmon
    "#33FF8D", // Pale Green
    "#FF33A1", // Deep Pink
    "#33FF8D", // Sea Green
    "#33FFF3", // Aqua
];

export default function MapComponent({ raidData, raidId, positions, intl_dir, communityHub }) {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [currentMap, setCurrentMap] = useState('')

    // Mobile
    const [showLayer, setShowLayer] = useState(false);

    // Map
    const [mapIsReady, setMapIsReady] = useState(false);
    const [heatmapEnabled, setHeatmapEnabled] = useState(false)
    const [heatmapData, setHeatmapData] = useState([])
    const [availableLayers, setAvailableLayers] = useState([])
    const [availableStyles, serAvailableStyles] = useState([])
    const [selectedStyle, setSelectedStyle] = useState('svg')
    const [selectedLayer, setSelectedLayer] = useState('')
    const [followPlayer, setFollowPlayer] = useState(null)
    const [followPlayerZoomed, setFollowPlayerZoomed] = useState(false)
    const [calculatedPlayerInfo, setCalculatedPlayerInfo] = useState({})
    const [calculatedLayerInfo, setCalculatedLayerInfo] = useState({})
    const [playerFocus, setPlayerFocus] = useState(null)
    const [proportionalScale, setProportionalScale] = useState(0)
    const [MAP, SET_MAP] = useState(null)
    const [mapHeight, setMapHeight] = useState(600)

    // Player
    const [playing, setPlaying] = useState(false)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)
    const [timeCurrentIndex, setTimeCurrentIndex] = useState(0)
    const [timeStartLimit, setTimeStartLimit] = useState(0)
    const [timeEndLimit, setTimeEndLimit] = useState(0)
    const [dropOffIndex, setDropOffIndex] = useState(200)
    const [sliderTimes, setSliderTimes] = useState([])
    const [hideSettings, setHideSettings] = useState(true)
    const [hidePlayers, setHidePlayers] = useState(false)
    const [hideEvents, setHideEvents] = useState(false)
    const [hideBallistics, setHideBallistics] = useState(false)
    const [hideNerdStats, setHideNerdStats] = useState(true)
    const [preserveHistory, setPreserveHistory] = useState(false)

    // Events
    const [events, setEvents] = useState([])

    const focusItem = useRef(searchParams.get('q') ? searchParams.get('q').split(',') : [])
    const mapViewRef = useRef({})

    const ref = useRef()
    const mapRef = useRef(null)

    const onMapContainerRefChange = useCallback(
        (node) => {
            if (node) {
                node.style.height = `${mapHeight}px`
            }
        },
        [mapHeight]
    )

    let allMaps = useMapImages()

    const mapData = useMemo(() => {
        const map = allMaps[currentMap]

        if (map && map.layers) {
            let newAvailableLayers = map.layers.map((x) => ({ name: x.name, value: x.name }))
            setAvailableLayers([{ name: 'Base', value: '' }, ...newAvailableLayers])

            let newAvailableStyles = [!map.tilePath || { name: 'Satellite', value: 'tile' }, !map.svgPath || { name: 'Map', value: 'svg' }].filter((f) => f)
            serAvailableStyles(newAvailableStyles)
        }

        return map
    }, [allMaps, currentMap])

    /**
     * Removes the scroll bar when in the map view mode
     */
    useEffect(() => {
        if (window.location.pathname.includes('map')) {
            document.querySelector('body').style = 'overflow: hidden;'
        }

        return () => {
            document.querySelector('body').style = 'overflow: auto;'
        }
    }, [])

    /**
     * Sets the location for the map based on the raidData location value
     */
    useEffect(() => {
        const locations = {
            bigmap: 'customs',
            Sandbox: 'ground-zero',
            Sandbox_high: 'ground-zero',
            develop: 'ground-zero',
            factory4_day: 'factory',
            factory4_night: 'factory',
            hideout: 'hideout',
            Interchange: 'interchange',
            laboratory: 'the-lab',
            Lighthouse: 'lighthouse',
            privatearea: 'private-area',
            RezervBase: 'reserve',
            Shoreline: 'shoreline',
            suburbs: 'suburbs',
            TarkovStreets: 'streets-of-tarkov',
            terminal: 'terminal',
            town: 'town',
            woods: 'woods',
            Woods: 'woods',
            base: 'base',
        }

        setCurrentMap(locations[raidData.location])

        const newEvents = []
        if (raidData && raidData.players) {
            for (let i = 0; i < raidData.kills.length; i++) {
                const kill = raidData.kills[i]

                const profileNickname = raidData.players.find((p) => p.profileId === kill.profileId)
                const killedNickname = raidData.players.find((p) => p.profileId === kill.killedId)

                newEvents.push({
                    time: kill.time,
                    profileId: kill.profileId,
                    profileNickname: profileNickname ? transliterateCyrillicToLatin(intl(profileNickname.name, intl_dir)) : 'Unknown',
                    killedId: kill.killedId,
                    killedNickname: killedNickname ? transliterateCyrillicToLatin(intl(killedNickname.name, intl_dir)) : 'Unknown',
                    weapon: kill.weapon,
                    distance: Number(kill.distance),
                    source: JSON.parse(kill.positionKiller),
                    target: JSON.parse(kill.positionKilled),
                })
            }
        }

        setEvents(newEvents)
    }, [raidData])

    /**
     * Resets the leaflet transform using the values of the current map data
     */
    useEffect(() => {
        ref?.current?.resetTransform()
    }, [currentMap])

    /**
     * Renders all the related data for the map
     */
    useEffect(() => {
        if (!mapData || mapData.projection !== 'interactive') {
            return
        }

        let mapCenter = [0, 0]
        let mapZoom = mapData.minZoom + 1
        let mapViewRestored = false
        const maxZoom = Math.max(7, mapData.maxZoom)

        if (mapRef.current?._leaflet_id) {
            if (mapRef.current.options.id === mapData.id) {
                if (mapViewRef.current.center) {
                    mapCenter = [mapViewRef.current.center.lat, mapViewRef.current.center.lng]
                    mapViewRestored = true
                }
                if (typeof mapViewRef.current.zoom !== 'undefined') {
                    mapZoom = mapViewRef.current.zoom
                    mapViewRestored = true
                }
            } else {
                mapViewRef.current.center = undefined
                mapViewRef.current.zoom = undefined
                mapViewRef.current.layer = undefined
            }
            mapRef.current.remove()
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
            preferCanvas: true,
        })

        const zoomLevel = map.getZoom()
        setProportionalScale(calculateProportionalRadius(mapData.bounds, zoomLevel))

        const updateProportionalScale = () => {
            const zoomLevel = map.getZoom()
            const newProportionalScale = calculateProportionalRadius(mapData.bounds, zoomLevel)
            setProportionalScale(newProportionalScale)
        }

        map.on('zoom', () => {
            mapViewRef.current.zoom = map.getZoom()
            updateProportionalScale()
        })

        map.on('move', () => {
            mapViewRef.current.center = map.getCenter()
        })

        const bounds = getBounds(mapData.bounds)
        const baseLayerOptions = {
            maxZoom: maxZoom,
            maxNativeZoom: mapData.maxZoom,
            extents: [
                {
                    height: mapData.heightRange || [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
                    bounds: [mapData.bounds],
                },
            ],
            type: 'map-layer',
        }

        const tileSize = mapData.tileSize || 256

        // Create separate layer groups for base layers and overlay layers
        const baseLayerGroup = L.layerGroup().addTo(map)
        const overlayLayerGroup = L.layerGroup().addTo(map)

        // Add base layers
        if (mapData.tilePath && selectedStyle === 'tile') {
            const tileLayer = L.tileLayer(mapData.tilePath, {
                tileSize,
                bounds,
                ...baseLayerOptions,
            })
            baseLayerGroup.addLayer(tileLayer)
        }

        if (mapData.svgPath && selectedStyle === 'svg') {
            const svgBounds = mapData.svgBounds ? getBounds(mapData.svgBounds) : bounds
            const svgLayer = L.imageOverlay(mapData.svgPath, svgBounds, baseLayerOptions)
            baseLayerGroup.addLayer(svgLayer)
        }

        // Add overlay layers
        if (mapData.layers) {
            for (let i = 0; i < mapData.layers.length; i++) {
                const layer = mapData.layers[i]
                const layerOptions = {
                    ...baseLayerOptions,
                    name: layer.name,
                    extents: layer.extents || baseLayerOptions.extents,
                    type: 'map-layer',
                    overlay: Boolean(layer.extents),
                }

                if (layer.tilePath && selectedStyle === 'tile') {
                    const tileLayer = L.tileLayer(layer.tilePath, {
                        tileSize,
                        bounds,
                        ...layerOptions,
                    })
                    overlayLayerGroup.addLayer(tileLayer)
                }

                if (layer.svgPath && selectedStyle === 'svg') {
                    const svgBounds = layer.svgBounds ? getBounds(layer.svgBounds) : bounds
                    const svgLayer = L.imageOverlay(layer.svgPath, svgBounds, layerOptions)
                    overlayLayerGroup.addLayer(svgLayer)
                }
            }
        }
        // Set initial visibility based on selectedLayer
        if (selectedLayer === '') {
            baseLayerGroup.addTo(map)
        } else {
            overlayLayerGroup.addTo(map)
        }

        // Function to handle layer visibility and opacity based on selectedLayer
        const toggleLayers = () => {
            // Set opacity for base layers
            baseLayerGroup.eachLayer((layer) => {
                if (selectedLayer === '') {
                    layer.setOpacity(1) // Active layer
                } else {
                    layer.setOpacity(0.3) // Inactive layers
                }
            })

            // Set opacity for overlay layers
            overlayLayerGroup.eachLayer((layer) => {
                if (selectedLayer === layer.options.name) {
                    layer.setOpacity(1) // Active layer
                } else {
                    layer.setOpacity(0) // Inactive layers
                }
            })
        }

        // Toggle layers when selectedLayer changes
        toggleLayers()

        if (map && !mapViewRestored) {
            map.setView(L.latLngBounds(bounds).getCenter(true), undefined, { animate: false })
        }

        mapRef.current = map
        SET_MAP(map);
        setTimeout(() => {
            setMapIsReady(true)
        }, 500)

        if (heatmapEnabled) {
            L.heatLayer(heatmapData, { radius: 10, max: 1, blur: 10 }).addTo(map)
        }
        
    }, [mapData, mapRef, mapViewRef, selectedLayer, selectedStyle, heatmapEnabled, heatmapData])

    // Heatmap Fetcher
    useEffect(() => {
        if (!mapIsReady) return;

        (async () => {
            if (heatmapData.length === 0) {
                let data = null;
                if (communityHub) {
                    data = await community_api.getRaidHeatmapData(raidId)
                } else {
                    data = await api.getRaidHeatmapData(raidId)
                }
                if (data) {
                    setHeatmapData(data)
                }
            }
        })()

        var overlayParent = document.querySelector('.map-container')
        if (overlayParent === undefined) return
        if (heatmapEnabled) {
            overlayParent?.classList.add('heatmap-active')
        } else {
            overlayParent?.classList.remove('heatmap-active')
        }
    }, [mapIsReady, heatmapEnabled])

    // Positon Renderer
    useEffect(() => {
        if (!mapIsReady) return;

        let times = []

        clearMap(MAP, { start: timeStartLimit, end: timeEndLimit })

        const playerPositionKeys = Object.keys(positions)
        for (let i = 0; i < playerPositionKeys.length; i++) {
            if (MAP === undefined) continue

            const playerId = playerPositionKeys[i]
            const playerPositions = positions[playerId]
            const cleanPositions = []
            let currentDirection = 0

            const isPlayerDead = events.find((e) => e.killedId === playerId && e.time < timeEndLimit)

            if (playerPositions === undefined) continue
            for (let j = 0; j < playerPositions.length; j++) {
                const playerPosition = playerPositions[j]
                if (playerPosition === undefined) continue
                times.push(playerPosition.time)

                if (timeEndLimit && timeStartLimit) {
                    if (playerPosition.time > (!isPlayerDead ? timeStartLimit : timeEndLimit * -1000) && playerPosition.time < timeEndLimit) {
                        cleanPositions.push([playerPosition.z, playerPosition.x])
                    }
                }

                if (playerPositions.length - 1 === j) {
                    currentDirection = playerPosition.dir
                }
            }

            const index = calculatedPlayerInfo[playerId]?.index || raidData.players.findIndex((p) => p.profileId === playerId)
            // if (!index) continue;
            const player = calculatedPlayerInfo[playerId]?.player || raidData.players[index]
            const pickedColor = calculatedPlayerInfo[playerId]?.pickedColor || getPlayerColor(player, index)
            if (calculatedPlayerInfo[playerId] === undefined) {
                let newAddition = { ...calculatedPlayerInfo }
                newAddition[playerId] = { player, index, pickedColor }
                setCalculatedPlayerInfo(newAddition)
            }

            // Hide player movement if enabled
            if (MAP && !hidePlayers && cleanPositions.length > 0) {
                let endOfLine = cleanPositions[cleanPositions.length - 1]

                // Focused Player
                if (playerFocus !== null && playerFocus === i) {

                    if (!MAP) return
                    L.polyline(cleanPositions, { color: pickedColor, weight: 4, opacity: 1 })
                        .addTo(MAP)
                        .on('click', () => {
                            setFollowPlayer(playerId)
                            setFollowPlayerZoomed(false)
                        })
                    L.circle(endOfLine, { radius: proportionalScale, color: pickedColor, fillOpacity: 1, fillRule: 'nonzero' })
                        .addTo(MAP)
                        .on('click', () => {
                            setFollowPlayer(playerId)
                            setFollowPlayerZoomed(false)
                        })
                } else {
                    let focusedOpacityPolyLine = preserveHistory ? 0.1 : isPlayerDead ? 0 : 0.1
                    let focusedOpacityCircle = isPlayerDead ? 0 : 0.1

                    if (!MAP) return
                    L.polyline(cleanPositions, { color: pickedColor, weight: 4, opacity: focusedOpacityPolyLine })
                        .addTo(MAP)
                        .on('click', () => {
                            setFollowPlayer(playerId)
                            setFollowPlayerZoomed(false)
                        })
                    if (!isPlayerDead) {
                        L.circle(endOfLine, { radius: proportionalScale, color: pickedColor, opacity: focusedOpacityCircle, fillOpacity: 1, fillRule: 'nonzero' }).addTo(MAP)
                        if (followPlayer === playerId) {
                            MAP.panTo(endOfLine, 4)
                        }
                    }
                }

                // Normal rendering
                if (playerFocus === null) {
                    let focusedOpacityPolyLine = preserveHistory ? 0.8 : isPlayerDead ? 0 : 0.8
                    L.polyline(cleanPositions, { color: pickedColor, weight: 4, opacity: focusedOpacityPolyLine })
                        .addTo(MAP)
                        .on('click', () => {
                            setFollowPlayer(playerId)
                            setFollowPlayerZoomed(false)
                        })
                    if (!isPlayerDead) {
                        L.circle(endOfLine, { radius: proportionalScale, color: pickedColor, fillOpacity: 1, fillRule: 'nonzero' }).addTo(MAP)
                        if (followPlayer === playerId) {
                            if (!followPlayerZoomed) {
                                // This is here to make sure the user can adjust zoom as a player is followed
                                MAP.setZoom(3)
                                setFollowPlayerZoomed(true)
                            }
                            MAP.panTo(endOfLine, 4)
                        }
                    }
                }
            }
        }

        if (sliderTimes.length === 0) {
            times = _.chain(times).uniq().sort((t) => t).value()
            setSliderTimes(times)
            setTimeStartLimit(times[0])
            setTimeEndLimit(times[times.length - 1])
            setTimeCurrentIndex(0)
        }
    }, [mapIsReady, mapViewRef, timeEndLimit, timeStartLimit, timeCurrentIndex, MAP, preserveHistory, events, hideEvents, hidePlayers, followPlayer, playerFocus])

    // Slider Time Update
    useEffect(() => {
        if (preserveHistory) {
            setTimeStartLimit(sliderTimes[0])
        } else {
            setTimeStartLimit(sliderTimes[Math.max(0, timeCurrentIndex - dropOffIndex)])
        }
    }, [sliderTimes, timeCurrentIndex, preserveHistory])

    // Event Update
    const addedLayers = useRef(new Map());
    useEffect(() => {
        if (!mapIsReady) return;

        const createdLayers = new Map();
        for (let i = 0; i < events.length; i++) {
            const e = events[i];
    
            const toBeIndex = findInsertIndex(e.time, sliderTimes);
    
            // Killer marker
            var killerIcon = L.divIcon({ className: 'killer-icon', html: `<img src="/target.png" />` });
            var killerMarker = L.marker([e.source.z, e.source.x], { icon: killerIcon });
            killerMarker.eventTime = e.time;
            killerMarker.eventType = 'killerIcon';
            killerMarker.addTo(MAP);
            createdLayers.set(`killer-${e.time}-${e.source.z}-${e.source.x}`, killerMarker);
    
            // Polyline
            var polyline = L.polyline(
                [
                    [e.source.z, e.source.x],
                    [e.target.z, e.target.x],
                ],
                { color: 'red', weight: 2, dashArray: [10], dashOffset: 3, opacity: 1 }
            );
            polyline.eventTime = e.time;
            polyline.eventType = 'killerLine';
            polyline.addTo(MAP);
            createdLayers.set(`line-${e.time}-${e.source.z}-${e.source.x}-${e.target.z}`, polyline);
    
            // Death marker
            var deathHtml = `<img src="/skull.png" /><span class="tooltiptext event event-map text-sm">${
                e.profileId === e.killedId ? `<strong>${e.profileNickname}</strong><br/>died` : `<strong>${e.profileNickname}</strong><br/>killed<br/><strong>${e.killedNickname}</strong>`
            }</span>`;
            var deathIcon = L.divIcon({ className: 'death-icon tooltip event', html: deathHtml });
            var deathMarker = L.marker([e.target.z, e.target.x], { icon: deathIcon });
            deathMarker.eventTime = e.time;
            deathMarker.eventType = 'deathIcon';
            deathMarker.addTo(MAP).on('click', () =>
                highlight(
                    [
                        [e.target.z, e.target.x],
                        [e.source.z, e.source.x],
                    ],
                    e.time
                )
            );
            createdLayers.set(`death-${e.time}-${e.target.z}-${e.target.x}`, deathMarker);
        }
    
        addedLayers.current = createdLayers;
    
        return () => {
            createdLayers.forEach((layer) => {
                MAP.removeLayer(layer);
            });
        };
    }, [MAP, events, mapIsReady]);
    
    useEffect(() => {
        const timeRange = { start: preserveHistory ? 0 : sliderTimes[timeCurrentIndex - dropOffIndex] || 0, end: sliderTimes[timeCurrentIndex] };
    
        addedLayers.current.forEach((layer, key) => {
            if (layer instanceof L.Marker) {
                const layerElement = layer.getElement();
                if (layerElement) {
                    // if (layer.eventTime > timeRange.start && layer.eventTime < timeRange.end) {
                    if (layer.eventTime > timeRange.start && layer.eventTime < timeRange.end) {
                        layerElement.classList.remove('invisible');
                    } else {
                        layerElement.classList.add('invisible');
                    }
                }
            } 
            
            else if (layer instanceof L.Polyline) {
                if (layer.eventTime > timeRange.start && layer.eventTime < timeRange.end) {
                    layer.setStyle({ opacity: 1 });
                } else {
                    layer.setStyle({ opacity: 0 });
                }
            }
        });
    }, [sliderTimes, timeCurrentIndex]);    

    // Ballistics Update
    let ballisticsLayers = new Map();
    useEffect(() => {
        if (hideBallistics) return;
        if (!mapIsReady || !MAP) return;

        const createdLayers = new Map();
        for (let i = 0; i < raidData.ballistic.length; i++) {
            const ballistic = raidData.ballistic[i];
            const toBeIndex = findInsertIndex(ballistic.time, sliderTimes);

            let passedTime = toBeIndex < timeCurrentIndex;
            let expiredTime = toBeIndex + 40 > timeCurrentIndex;
            if (passedTime && expiredTime) {
                let source = JSON.parse(ballistic.source);
                let target = JSON.parse(ballistic.target);

                let ballisticsId = `${i}-${ballistic.time}-${source.z}-${source.x}-${target.z}-${target.x}`;
                let exists = ballisticsLayers.get(ballisticsId);

                let hit = !!ballistic.hitPlayerId;
                if (!exists && (target && source)) {
                    const pickedColor = calculatedPlayerInfo[ballistic.profileId]?.pickedColor;
                    const position = [[source.z, source.x], [target.z, target.x]];

                    const polyline = L.polyline(position, { 
                        color: pickedColor ? pickedColor : 'red', 
                        weight: 1, 
                        opacity: 0.5, 
                        fillOpacity: 0.5, 
                        dashOffset: 2, 
                        dashArray: [2, 6, 2]
                    });
                    polyline.eventTime = ballistic.time;
                    polyline.eventCollision = ballistic.hitPlayerId;
                    polyline.eventType = 'ballisticsLine';
                    polyline.eventId = ballisticsId;

                    if (MAP) {
                        polyline.addTo(MAP);
                    }

                    ballisticsLayers.set(ballisticsId, true);
                }
            }
        }

    }, [timeCurrentIndex, hideBallistics]);

    // Slider Updater
    useEffect(() => {
        if (!playing || sliderTimes.length === 0) {
            return
        }

        const interval = setInterval(() => {
            setTimeCurrentIndex((prevIndex) => {

                // Check if we've reached the end of the sliderTimes
                if (prevIndex >= sliderTimes.length - 1) {
                    clearInterval(interval)
                    setPlaying(false)
                    return prevIndex
                }

                const frame = sliderTimes[prevIndex]
                const startFrame = sliderTimes[Math.max(0, prevIndex - dropOffIndex)]

                if (!preserveHistory && startFrame) {
                    setTimeStartLimit(startFrame)
                }

                if (preserveHistory) {
                    setTimeStartLimit(sliderTimes[0])
                }

                setTimeEndLimit(frame)

                return prevIndex + 1
            })
        }, 1000 / (24 * playbackSpeed))

        return () => clearInterval(interval)
    }, [playing, sliderTimes, playbackSpeed, timeCurrentIndex, preserveHistory])

    // Keyboard Support
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
          switch (event.key) {
            case ' ':
              event.preventDefault(); // Prevent page scrolling
              setPlaying((prev) => !prev);
              break;
      
            case 'ArrowUp':
              setPlaybackSpeed((prev) => Math.min(prev * 2, 16)); // Cap at 16x
              break;
      
            case 'ArrowDown':
              setPlaybackSpeed((prev) => Math.max(prev / 2, 1)); // Min at 1x
              break;
      
            case 'ArrowRight': {
              setTimeCurrentIndex((prev) => {
                const newIndex = Math.min(prev + playbackSpeed, sliderTimes.length - 1);
      
                if (!preserveHistory) {
                  setTimeStartLimit(sliderTimes[Math.max(0, newIndex - 200)]);
                } else {
                  setTimeStartLimit(sliderTimes[0]);
                }
      
                setTimeEndLimit(sliderTimes[newIndex]);
                return newIndex;
              });
              break;
            }
      
            case 'ArrowLeft': {
              setPlaying(false); // Pause while scrubbing backwards
              setTimeCurrentIndex((prev) => {
                const newIndex = Math.max(prev - playbackSpeed, 0);
      
                if (!preserveHistory) {
                  setTimeStartLimit(sliderTimes[Math.max(0, newIndex - 200)]);
                } else {
                  setTimeStartLimit(sliderTimes[0]);
                }
      
                setTimeEndLimit(sliderTimes[newIndex]);
                return newIndex;
              });
              break;
            }
      
            default:
              break;
          }
        };
      
        window.addEventListener('keydown', handleKeyDown);
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
      }, [sliderTimes, playbackSpeed, preserveHistory]);         

    function clearMap(m, timeRange) {
        if (!m || !mapIsReady) return;
    
        for (const key in m._layers) {
            const layer = m._layers[key];
        
            // Remove polylines without eventType or not being ballisticsLine, and circles
            if ((layer instanceof L.Polyline && (!layer.eventType || layer.eventType !== 'ballisticsLine')) || layer instanceof L.Circle) {
                m.removeLayer(layer);
                continue;
            }
    
            // Handle ballistics lines
            if (layer.eventTime) {
                const toBeIndex = findInsertIndex(layer.eventTime, sliderTimes);
    
                let passedTime = toBeIndex > timeCurrentIndex;
                let expiredTime = toBeIndex + 40 < timeCurrentIndex ;
    
                if (layer.eventType === 'ballisticsLine' && (expiredTime || passedTime)) {
                    m.removeLayer(layer);
                    ballisticsLayers.delete(layer.eventId);
                }
            }
        }
    } 

    function playPositions() {
        if (timeCurrentIndex === sliderTimes.length - 1) {
            setTimeEndLimit(sliderTimes[0])
            setTimeStartLimit(sliderTimes[0])
            setTimeCurrentIndex(0)
        }
        setPlaying((prevPlaying) => !prevPlaying)
    }

    function highlight(coords, time) {
        if (!MAP) return
        const frameIndex = findInsertIndex(time, sliderTimes) + 1
        setTimeCurrentIndex(frameIndex)
        setTimeEndLimit(sliderTimes[frameIndex])
        setTimeStartLimit(sliderTimes[frameIndex - dropOffIndex])
        MAP.flyToBounds(coords, { maxZoom: 4, animate: true })
        return
    }

    function playerIsDead(playerId: string, time: number): boolean {
        if (raidData && raidData.kills) {
            let playerWasKilled = !!raidData.kills.find((kill) => kill.killedId === playerId && kill.time < time);
            
            return playerWasKilled
        } else {
            return false
        }
    }

    function getPlayerBrain(player: TrackingRaidDataPlayers): string {
        if (player) {
            let brainOutput = 'Unknown'
            let botMapping = BotMapping[player.type]
            if (player.name === 'Knight') {
                botMapping = {
                    type: 'GOON',
                }
            }
            if (!botMapping) {
                botMapping = {
                    type: 'UNKNOWN',
                }
            }

            if ((player.team === 'Bear' || player.team === 'Usec') && player.mod_SAIN_brain != 'UNKNOWN') {
                return `${player.mod_SAIN_brain.trim()}`
            }

            if (player.mod_SAIN_brain === 'PLAYER') brainOutput = 'Human'
            if (player.mod_SAIN_brain != null) brainOutput = `${player.mod_SAIN_brain.trim()}`

            if (botMapping.type === 'UNKNOWN') brainOutput = `${player.team === 'Savage' ? 'Scav' : 'PMC'}`
            if (player.mod_SAIN_brain === 'UNKNOWN' && (player.team === 'Bear' || player.team === 'Usec')) brainOutput = 'PMC'
            if (botMapping.type === 'SCAV') brainOutput = `Scav`

            if (botMapping.type === 'BOSS') brainOutput = `Boss`

            if (botMapping.type === 'GOON') brainOutput = `Goon`
            if (botMapping.type === 'FOLLOWER') brainOutput = `Follower`
            if (botMapping.type === 'RAIDER') brainOutput = `Raider`
            if (botMapping.type === 'ROGUE') brainOutput = `Rogue`
            if (botMapping.type === 'CULT') brainOutput = `Cultist`
            if (botMapping.type === 'SNIPER') brainOutput = `Sniper`
            if (botMapping.type === 'PLAYER_SCAV') brainOutput = `${player.mod_SAIN_brain.trim()} - Player Scav`
            if (botMapping.type === 'BLOODHOUND') brainOutput = `Bloodhound`

            return brainOutput
        }
    }

    function getPlayerDifficultyAndBrain(player: TrackingRaidDataPlayers): string {
        if (player) {
            let difficulty = player.mod_SAIN_difficulty
            let brain = getPlayerBrain(player)
            if (difficulty !== null && difficulty !== '') {
                return `${difficulty} - ${brain}`
            }
            return `${brain}`
        }

        return ''
    }

    function getPlayerColor(player: TrackingRaidDataPlayers, index: number): string {
        if (player === undefined) {
            console.debug(player, index)
            return
        }

        let botMapping = BotMapping[player.type]
        if (player.name === 'Knight') {
            botMapping = {
                type: 'GOON',
            }
        }
        if (!botMapping) {
            botMapping = {
                type: 'UNKNOWN',
            }
        }

        switch (botMapping.type) {
            case 'SCAV':
                return '#33FF57' // Green - Scav
            case 'BOSS':
                return '#FF0000' // Red - Boss
            case 'ROGUE':
            case 'FOLLOWER':
                return '#ff7b00' // Orange - Follower
            case 'BLOODHOUND':
                return '#6d0000' // Dark Red - Raider
            case 'RAIDER':
                return '#FF00FF' // Magenta - Raider
            case 'PLAYER_SCAV':
                return '#33FF8D' // Light Green - Scav Player
            case 'SNIPER':
                return '#00911a' // Dark Green - Sniper
            case 'GOON':
                return '#ff005d' // Between Magenta & Red  - Goon
            case 'CULT':
                return '#6f00ff' // Dark Purple - Cultist
            case 'OTHER':
                return '#00eeff' // Other - Cyan
            default:
                if (player.type === 'PLAYER' && player.team === 'Savage') return '#33FF57' // Green - Scav
                else return colors[index % colors.length] // PMC
        }
    }


    return (
        <div className="map-container" key="map-wrapper">
            <div className="parent">
                <div id="mobile-nav" className='lg:hidden flex w-full mb-2 justify-between'>
                    <div className='flex gap-2'>
                        <button onClick={() => setShowLayer(true)} className='py-1 px-4 bg-eft text-sm text-black hover:opacity-75'>Layers</button>
                    </div>
                    <NavLink to={`/raid/${raidId}`} className="py-1 px-4 bg-eft text-sm text-black hover:opacity-75">
                        Close
                    </NavLink>
                </div>
                <nav className={`flex top ${showLayer && 'open'}`}>
                    {showLayer && (
                        <div className='p-2 border-b-2 border-eft'>
                                <button onClick={() => setShowLayer(false)} className='py-1 px-4 bg-eft text-sm text-black hover:opacity-75 w-full'>Close</button>
                        </div>
                    )}
                    <div className={showLayer ? `flex flex-col h-fit p-2` : 'flex h-[40px]'}>
                        {availableLayers.map((layer) => (
                            <button
                                key={layer.value}
                                className={`text-sm p-2 mr-2 py-1 text-sm ${layer.value === selectedLayer ? 'bg-eft text-black' : 'cursor-pointer border border-eft text-eft'} mb-2 ml-auto w-full`}
                                onClick={() => setSelectedLayer(layer.value)}
                            >
                                {layer.name}
                            </button>
                        ))}
                    </div>
                    <div className={`lg:flex ${showLayer ? `flex flex-col p-2 border-t-2 border-eft` : 'ml-4'}`}>
                        {availableStyles.map((style) =>
                            style.name ? (
                                <button
                                    key={style.value}
                                    className={`text-sm p-2 mr-2 py-1 text-sm ${style.value === selectedStyle ? 'bg-eft text-black' : 'cursor-pointer border border-eft text-eft'} mb-2 ml-auto w-full`}
                                    onClick={() => setSelectedStyle(style.value)}
                                >
                                    {style.name}
                                </button>
                            ) : (
                                ''
                            )
                        )}
                    </div>
                    <NavLink to={`/raid/${raidId}`} className="text-sm p-2 py-1 text-sm cursor-pointer border border-eft text-eft mb-2 ml-auto hidden lg:block">
                        Close
                    </NavLink>
                </nav>
                <aside className="sidebar border border-eft mr-3 p-3 overflow-x-auto">
                    <div className="playerfeed text-eft">
                        <strong>Legend</strong>
                        <ul>
                            {raidData.players
                                .filter((p) => p.spawnTime < timeEndLimit)
                                .map((player, index) => (
                                    <li
                                        className="flex items-center justify-between player-legend-item px-2"
                                        key={player.profileId}
                                        onMouseEnter={() => setPlayerFocus(index)}
                                        onMouseLeave={() => setPlayerFocus(null)}
                                        onClick={() => {
                                            setFollowPlayer(followPlayer === player.profileId ? null : player.profileId)
                                            setFollowPlayerZoomed(false)
                                        }}
                                    >
                                        <div className={`flex flex-row items-center ${playerIsDead(player.profileId, timeEndLimit) ? 'line-through opacity-25' : ''}`}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', marginRight: '8px', background: getPlayerColor(player, index) }}></span>
                                            <div>
                                                <span className="capitalize">
                                                    {transliterateCyrillicToLatin(intl(player.name, intl_dir))} ({getPlayerDifficultyAndBrain(player)})
                                                </span>
                                            </div>
                                        </div>
                                        {followPlayer === player.profileId ? <span className="text-xs">[FOLLOWING]</span> : ''}
                                    </li>
                                ))}
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
                        <TransformComponent></TransformComponent>
                    </TransformWrapper>
                    <div className="kill-stream">
                        {events
                            .filter((e) => findInsertIndex(e.time, sliderTimes) < timeCurrentIndex)
                            .reverse()
                            .slice(0, 4)
                            .map((e, i) => (
                                <div className="text-black" key={`${e.profileId}_${i}`}>
                                    <span className="tooltiptext event">
                                        [
                                        <a
                                            className="underline cursor-pointer"
                                            onClick={() =>
                                                highlight(
                                                    [
                                                        [e.target.z, e.target.x],
                                                        [e.source.z, e.source.x],
                                                    ],
                                                    e.time
                                                )
                                            }
                                        >
                                            VIEW
                                        </a>
                                        ] <strong>{e.profileNickname}</strong> killed <strong>{e.killedNickname}</strong> ({intl([e.weapon.replace('Name', 'ShortName')], intl_dir)} - {e.distance.toFixed(0)}m)
                                    </span>
                                </div>
                            ))}
                    </div>
                    <div id="view-switcher" className='border border-eft bg-black'>
                        <button className={`positional border border-eft ${heatmapEnabled ? 'opacity-50' : ''}`} onClick={() => setHeatmapEnabled(false)}>
                            
                        </button>
                        <button className={`heatmap border border-eft ${heatmapEnabled ? '' : 'opacity-50'}`} onClick={() => setHeatmapEnabled(true)}>
                            
                        </button>
                    </div>
                    <div id="leaflet-map" ref={onMapContainerRefChange} className={'leaflet-map-container'} />
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
                    <div className="times text-eft mb-2 flex justify-between">
                        <span>{msToHMS(timeEndLimit)}</span>
                        <span className={`${hideNerdStats ? 'invisible' : ''}`}>
                            {((timeCurrentIndex / sliderTimes.length) * 100).toFixed(0)}% | {24 * playbackSpeed}fps | Frame: {timeCurrentIndex} / {sliderTimes.length - 1} | Cut In/Out (ms): {timeStartLimit} / {timeEndLimit}
                        </span>
                        <span>{msToHMS(sliderTimes.length > 0 ? sliderTimes[sliderTimes.length - 1] : 0)}</span>
                    </div>
                    <div className="flex gap-1">
                        <button className={`text-sm p-2 py-1 text-sm ${playing ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => playPositions()}>
                            {playing ? '⏸️' : '▶️'}
                        </button>
                        <button className={`text-sm p-2 py-1 text-sm ${!playing ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setPlaying(false)}>
                            ⏹️
                        </button>

                        <button className={`text-sm p-2 py-1 text-sm ${playbackSpeed === 1 ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setPlaybackSpeed(1)}>
                            1x
                        </button>
                        <button className={`text-sm p-2 py-1 text-sm ${playbackSpeed === 2 ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setPlaybackSpeed(2)}>
                            2x
                        </button>
                        <button className={`text-sm p-2 py-1 text-sm ${playbackSpeed === 4 ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setPlaybackSpeed(4)}>
                            4x
                        </button>
                        <button className={`text-sm p-2 py-1 text-sm ${playbackSpeed === 8 ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setPlaybackSpeed(8)}>
                            8x
                        </button>
                        <button className={`text-sm p-2 py-1 mr-4 text-sm ${playbackSpeed === 16 ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setPlaybackSpeed(16)}>
                            16x
                        </button>

                        <button className={`text-sm p-2 py-1 text-sm ${!hideSettings ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft md:block hidden`} onClick={() => setHideSettings(!hideSettings)}>
                            ⚙️
                        </button>
                        <div className={`border border-eft p-1 flex gap-1 ${hideSettings ? 'invisible' : ''}`}>
                            <button className={`text-xs p-1 text-sm cursor-pointer ${hidePlayers ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setHidePlayers(!hidePlayers)}>
                                Hide Players
                            </button>
                            <button className={`text-xs p-1 text-sm cursor-pointer ${hideEvents ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setHideEvents(!hideEvents)}>
                                Hide Events
                            </button>
                            <button className={`text-xs p-1 text-sm cursor-pointer ${hideBallistics ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setHideBallistics(!hideBallistics)}>
                                Hide Ballistics
                            </button>
                            <button className={`text-xs p-1 text-sm cursor-pointer ${preserveHistory ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft tooltip info`} onClick={() => setPreserveHistory(!preserveHistory)}>
                                Preserve
                                <span className="tooltiptext info">If enabled, keeps all activity visible throughout playback, otherwise, only recent activity is kept visible.</span>
                            </button>
                            <button className={`text-xs p-1 text-sm cursor-pointer ${!hideNerdStats ? 'bg-eft text-black ' : 'cursor-pointer text-eft'} border border-eft`} onClick={() => setHideNerdStats(!hideNerdStats)}>
                                Debug
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}