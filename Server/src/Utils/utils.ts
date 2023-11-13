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

export {
    ExtractKeysAndValues
};