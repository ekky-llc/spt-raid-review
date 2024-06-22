import { Bezier } from 'bezier-js';
import { positional_data, positional_data__grouped } from 'src/Controllers/PositionalData/CompileRaidPositionalData';

function ExtractKeysAndValues(obj: Record<string, any>): { keys: string; values: string } {
    function processObject(inputObj: Record<string, any>, parentKey?: string): { keys: string; values: string } {
        const keys = [];
        const values = [];

        for (const key in inputObj) {
            if (inputObj.hasOwnProperty(key)) {
                const currentKey = parentKey ? `${parentKey}.${key}` : key;
                const value = inputObj[key];

                if (Array.isArray(value)) {
                    // Process array elements
                    for (let i = 0; i < value.length; i++) {
                        const arrayKey = `${currentKey}[${i}]`;
                        keys.push(arrayKey);
                        values.push(String(value[i]));
                    }
                } else if (typeof value === 'object' && value !== null) {
                    // Process nested objects
                    const nestedResult = processObject(value, currentKey);
                    keys.push(nestedResult.keys);
                    values.push(nestedResult.values);
                } else {
                    keys.push(currentKey);
                    values.push(String(value));
                }
            }
        }

        return {
            keys: keys.join(',') + '\n',
            values: values.join(',') + '\n'
        };
    }

    const result = processObject(obj);

    return result;
}

function generateControlPoints(data: positional_data[]) {
    const controlPoints = [];
    const tension = 0.3;

    for (let i = 0; i < data.length; i++) {
        
        const p0 = data[i - 1] || data[i];
        const p1 = data[i];
        const p2 = data[i + 1] || data[i];
        const p3 = data[i + 2] || data[i + 1] || data[i];
        
        const cp1 = {
            x: p1.x + (p2.x - p0.x) * tension,
            y: p1.y + (p2.y - p0.y) * tension,
            z: p1.z + (p2.z - p0.z) * tension
        };
        
        const cp2 = {
            x: p2.x - (p3.x - p1.x) * tension,
            y: p2.y - (p3.y - p1.y) * tension,
            z: p2.z - (p3.z - p1.z) * tension
        };

        controlPoints.push(cp1, cp2);
    };

    return controlPoints;
}

function interpolateBezier(point1, control1, control2, point2, t) {
    const curve = new Bezier(
        point1.x, point1.y, point1.z,
        control1.x, control1.y, control1.z,
        control2.x, control2.y, control2.z,
        point2.x, point2.y, point2.z
    );

    const interpolatedPoint = curve.get(t);
    return {
        x: interpolatedPoint.x,
        y: interpolatedPoint.y,
        z: interpolatedPoint.z,
    };
}

function interpolateDirection(startDir, endDir, t) {
    // Simple linear interpolation between startDir and endDir
    return startDir + (endDir - startDir) * t;
}


function generateInterpolatedFramesBezier(positionsByPlayer: positional_data__grouped, originalFps : number, targetFps : number) {

    const players = Object.keys(positionsByPlayer)
    for (let i = 0; i < players.length; i++) {
        const positions = positionsByPlayer[i];
        if (positions === undefined) continue;

        const interpolatedFrames = [];
        const frameInterval = originalFps / targetFps;
        const controlPoints = generateControlPoints(positions);

        for (let j = 0; j < positions.length - 1; j++) {
            const point1 = positions[j];
            const point2 = positions[j + 1];
            const control1 = controlPoints[j * 2];
            const control2 = controlPoints[j * 2 + 1];
    
            interpolatedFrames.push(point1);
    
            const timeDiff = (point2.time - point1.time) / frameInterval;
            for (let t = 1; t < frameInterval; t++) {
                const interpolatedPoint = interpolateBezier(point1, control1, control2, point2, t / frameInterval);
                const interpolatedDir = interpolateDirection(point1.dir, point2.dir, t / frameInterval);
                const interpolatedTime = point1.time + (timeDiff * t);
    
                interpolatedFrames.push({
                    x: interpolatedPoint.x,
                    y: interpolatedPoint.y,
                    z: interpolatedPoint.z,
                    dir: interpolatedDir,
                    time: interpolatedTime,
                    profileId: point1.profileId,
                    raid_id: point1.raid_id
                });
            }
        }
        interpolatedFrames.push(positions[positions.length - 1]);
        positionsByPlayer[i] = interpolatedFrames;
    }

    return positionsByPlayer;
}


export {
    ExtractKeysAndValues,
    interpolateBezier,
    generateInterpolatedFramesBezier
};