import _ from 'lodash';

import { positional_data, positional_data__grouped } from "src/Controllers/PositionalData/CompileRaidPositionalData";

export function calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function calculateTotalDistance(positions_grouped : positional_data__grouped) : number {

    const positions = _.valuesIn(positions_grouped) as unknown as positional_data[][];
    const distances = [];
    for (let i = 0; i < positions.length; i++) {
        const playerPositions = positions[i];

        let previousPoint = null;
        let totalDistance = 0;
        for (let j = 0; j < playerPositions.length; j++) {
            const position = playerPositions[j];
            if (previousPoint) {
                totalDistance += calculateDistance(previousPoint, position);
            }
            previousPoint = position;
        }
        distances.push(totalDistance);
    
    }
    const combinedTotalDistance = _.sumBy(distances);
    console.log(`[RAID-REVIEW] Total distance traveled: ${combinedTotalDistance}`);

    return combinedTotalDistance;
}