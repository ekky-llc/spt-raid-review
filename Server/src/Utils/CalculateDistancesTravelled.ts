import _ from 'lodash';

import { positonal_data } from "src/Controllers/Collection/CompileRaidPositionalData";

export function calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function calculateTotalDistance(positions : positonal_data[][]) : number {

    const distances = [];
    for (let i = 0; i < positions.length; i++) {
        const playerPositions = positions[i];

        let previousPoint = null;
        let totalDistance = 0;
        for (let j = 0; j < playerPositions.length; j++) {
            const positon = playerPositions[j];
            if (previousPoint) {
                totalDistance += calculateDistance(previousPoint, positon);
            }
            previousPoint = positon;
        }
        distances.push(totalDistance);
    
    }
    const combinedTotalDistance = _.sumBy(distances);
    console.log(`[RAID-REVIEW] Total distance traveled: ${combinedTotalDistance}`);

    return combinedTotalDistance;
}