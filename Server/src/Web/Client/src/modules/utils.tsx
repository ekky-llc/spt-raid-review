/**
 * Calculate the new x, z positions given a starting point, direction, and distance.
 * 
 * @param {number} startX - The starting x position.
 * @param {number} startZ - The starting z position.
 * @param {number} direction - The direction in degrees.
 * @param {number} distance - The distance to extend the line.
 * @returns {{x: number, z: number}} - The new x, z positions.
 */
export function calculateNewPosition(z: number, x: number, direction: number, distance: number) {
    // Convert direction to radians
    const radians = direction * (Math.PI / 180);

    // Calculate new positions
    const newX = x + distance * Math.cos(radians);
    const newZ = z + distance * Math.sin(radians);

    return [newZ, newX];
}

export function findInsertIndex(newObject : any, array :any) {
    let low = 0;
    let high = array.length;

    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (array[mid] < newObject) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }

    return low;
}