const axios = require('axios');
const fs = require('fs').promises;
const { config } = require('./config')

async function getAllKeysFromKV(namespaceId, accountId, apiToken, cursor = '') {
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys`;
    const params = cursor ? { cursor } : {};

    try {
        const response = await axios.get(endpoint, {
            headers: {
                'Authorization': `Bearer ${apiToken}`
            },
            params
        });

        const keys = response.data.result;
        console.log(`Fetched ${keys.length} keys from Cloudflare KV Store.`);

        if (response.data.result_info.cursor) {
            // If there is a cursor, fetch the next batch of keys recursively
            const nextKeys = await getAllKeysFromKV(namespaceId, accountId, apiToken, response.data.result_info.cursor);
            return keys.concat(nextKeys);
        } else {
            // No more keys to fetch, return current batch
            return keys;
        }
    } catch (error) {
        console.error('Error fetching keys:', error);
        throw error;
    }
}

async function getAllDataFromKVAndSaveToFile(namespaceId, accountId, apiToken) {

        const allKeys = await getAllKeysFromKV(namespaceId, accountId, apiToken);
        console.log(allKeys.length)
        // const data = {};

        // Fetch each key's value
        const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values`;
        for (let index = 0; index < allKeys.length; index++) {
            const key = allKeys[index];
            const valueResponse = await axios.get(`${endpoint}/${key.name}`, {
                headers: {
                    'Authorization': `Bearer ${apiToken}`
                }
            }).catch(e => console.log(e));

            await fs.writeFile(`${__dirname}/data/${index}.json`, JSON.stringify(valueResponse.data, null, 2));
        }

}

// Call the function to fetch data and save to file
getAllDataFromKVAndSaveToFile(config.namespaceId, config.accountId, config.apiToken);