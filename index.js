const { fetch } = require('./facebook/fetchData.js');
const { savePosts } = require('./database/saveData');
const { run } = require('./database/xlsx.js');
const fs = require('fs');

(async () => {
    try {
        await fetch();
        const results = 'facebook/results.json';
        const data = fs.readFileSync(results, 'utf8');

        if (!data) {
            throw new Error('results.json is empty or does not exist');
        }

        const resultsData = JSON.parse(data);

        if (!Array.isArray(resultsData) || resultsData.length === 0) {
            throw new Error('results.json does not contain valid data');
        }

        await savePosts(resultsData);
        await run();
    } catch (error) {
        if (error.message.includes('fetch')) {
            console.error('Error fetching data:', error);
        } else if (error.message.includes('save')) {
            console.error('Error saving data:', error);
        } else {
            console.error('Unknown error:', error);
        }
        process.exit(1);
    }
})();
