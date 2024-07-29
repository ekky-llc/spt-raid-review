import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import './Raids.css'
import './RaidCharts.css'
import { useOutletContext } from 'react-router-dom';
import { TrackingPlayerStatus, TrackingRaidData } from '../../types/api_types';
import _ from 'lodash';
import { msToHMS } from '../../helpers';

export default function RaidCharts() {        
    const [ activeBots, setActiveBots ] = useState([] as any[]);
    const [ kills, setKills ] = useState([] as any[]);
    const [ lootings, setLootings ] = useState([] as any[]);
    const [ shots, setShots ] = useState([] as any[]);

    const { raid } = useOutletContext() as {
        raid: TrackingRaidData
    };

    useEffect(() => {
        if (raid) {

            // Calculate Active Bots
            let playersByTime = _.chain(raid.player_status).filter((ps: TrackingPlayerStatus) => ps.status === 'Alive').groupBy('time').valuesIn().value();
            const activeBotsChartData = [];
            for (let i = 0; i < playersByTime.length; i++) {
                const playerStatuses = playersByTime[i];
                const first = _.first(playerStatuses);

                activeBotsChartData.push({
                    name: msToHMS(Number(first?.time)),
                    uv: playerStatuses.length
                })
            }
            setActiveBots(activeBotsChartData)


            // Calculate Kills 
            const killsGroup = [];
            let currentKillGroup = [] as any[];
            if (raid.kills) {
                for (let i = 0; i < raid.kills.length; i++) {
                    if (currentKillGroup.length === 0) {
                        currentKillGroup.push(raid.kills[i]);
                    } else {
                        const lastObject = currentKillGroup[currentKillGroup.length - 1];
                        if (raid.kills[i].time - lastObject.time <= 30000) {
                            currentKillGroup.push(raid.kills[i]);
                        } else {
                            killsGroup.push(currentKillGroup);
                            currentKillGroup = [raid.kills[i]];
                        }
                    }
                }
                
                if (currentKillGroup.length > 0) {
                    killsGroup.push(currentKillGroup);
                }
            }

            const killChartData_ = [];
            for (let i = 0; i < killsGroup.length; i++) {
                const group = killsGroup[i];
                if (group && group[0] && group[0].time) {
                    killChartData_.push({
                        name: msToHMS(Number(group[0].time)),
                        uv: group.length
                    })
                }
            }
            setKills(killChartData_)


            // Calculate Lootings 
            const lootingsGroup = [];
            let currentLootingGroup = [] as any[];
            if (raid.looting) {
                for (let i = 0; i < raid.looting.length; i++) {
                    if (currentLootingGroup.length === 0) {
                        currentLootingGroup.push(raid.looting[i]);
                    } else {
                        const lastObject = currentLootingGroup[currentLootingGroup.length - 1];
                        if (Number(raid.looting[i].time) - Number(lastObject.time) <= 5000) {
                            currentLootingGroup.push(raid.looting[i]);
                        } else {
                            lootingsGroup.push(currentLootingGroup);
                            currentLootingGroup = [raid.looting[i]];
                        }
                    }
                }
                
                if (currentLootingGroup.length > 0) {
                    lootingsGroup.push(currentLootingGroup);
                }
            }

            const lootingChartData_ = [];
            for (let i = 0; i < lootingsGroup.length; i++) {
                const group = lootingsGroup[i];
                if (group && group[0] && group[0].time) {
                    lootingChartData_.push({
                        name: msToHMS(Number(group[0].time)),
                        uv: group.length
                    })
                }
            }
            setLootings(lootingChartData_)


            // Calculate Shots 
            const shotsGroup = [];
            let currentShotGroup = [] as any[];
            if (raid.ballistic) {
                for (let i = 0; i < raid.ballistic.length; i++) {
                    if (currentShotGroup.length === 0) {
                        currentShotGroup.push(raid.ballistic[i]);
                    } else {
                        const lastObject = currentShotGroup[currentShotGroup.length - 1];
                        if (raid.ballistic[i].time - lastObject.time <= 2000) {
                            currentShotGroup.push(raid.ballistic[i]);
                        } else {
                            shotsGroup.push(currentShotGroup);
                            currentShotGroup = [raid.ballistic[i]];
                        }
                    }
                }
                
                if (currentShotGroup.length > 0) {
                    shotsGroup.push(currentShotGroup);
                }
            }

            const shotChartData_ = [];
            for (let i = 0; i < shotsGroup.length; i++) {
                const group = shotsGroup[i];
                if (group && group[0] && group[0].time) {
                    shotChartData_.push({
                        name: msToHMS(Number(group[0].time)),
                        uv: group.length
                    })
                }
            }
            setShots(shotChartData_)



        }

    }, [raid])

    const CustomTooltip = () => {
        return null;
    };
    
    return (
        <section className="chart-container">
            <div className="chart my-4 mb-12 px-4">
                <div className='text-center w-full text-lg font-bold'>Active Bots By Time</div>
                <ResponsiveContainer>
                    <AreaChart
                        data={activeBots}
                        margin={{
                            top: 10,
                            right: 30
                        }}
                    >
                    <Tooltip content={<CustomTooltip />} />
                    <XAxis dataKey="name" angle={-90} dy={40} dx={-6} />
                    <YAxis tickCount={5}  />
                    <CartesianGrid strokeDasharray="1 1" stroke='#9a8866' />
                    <Area type="monotone" dataKey="uv" stroke="#9a8866" fill="#9a8866" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="chart my-4 mb-12 px-4">
                <div className='text-center w-full text-lg font-bold'>Kill Activity By Time</div>
                <ResponsiveContainer>
                    <AreaChart
                        data={kills}
                        margin={{
                            top: 10,
                            right: 30
                        }}
                    >
                    <Tooltip content={<CustomTooltip />} />
                    <YAxis tickCount={5}  />
                    <CartesianGrid strokeDasharray="1 1" stroke='#9a8866' />
                    <Area type="monotone" dataKey="uv" stroke="#9a8866" fill="#9a8866" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="chart my-4 mb-12 px-4">
                <div className='text-center w-full text-lg font-bold'>Looting Activity By Time</div>
                <ResponsiveContainer>
                    <AreaChart
                        data={lootings}
                        margin={{
                            top: 10,
                            right: 30
                        }}
                    >
                    <Tooltip content={<CustomTooltip />} />
                    {/* <XAxis dataKey="name" angle={-90} dy={40} dx={-6} /> */}
                    <YAxis tickCount={5}  />
                    <CartesianGrid strokeDasharray="1 1" stroke='#9a8866' />
                    <Area type="monotone" dataKey="uv" stroke="#9a8866" fill="#9a8866" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="chart my-4 mb-12 px-4">
                <div className='text-center w-full text-lg font-bold'>Projectile Activity By Time</div>
                <ResponsiveContainer>
                    <AreaChart
                        data={shots}
                        margin={{
                            top: 10,
                            right: 30
                        }}
                    >
                    <Tooltip content={<CustomTooltip />} />
                    <YAxis tickCount={10}  />
                    <CartesianGrid strokeDasharray="1 1" stroke='#9a8866' />
                    <Area type="monotone" dataKey="uv" stroke="#9a8866" fill="#9a8866" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
