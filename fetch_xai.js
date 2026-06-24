import 'dotenv/config';
import fs from 'fs';

const fetchModels = async (url, key) => {
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${key}` }
        });
        const data = await response.json();
        fs.writeFileSync('xai_models.json', JSON.stringify(data, null, 2));
        console.log('Saved to xai_models.json');
    } catch (e) {
        console.error('Error fetching', url, e.message);
    }
};

fetchModels('https://api.x.ai/v1/models', process.env.XAI_API_KEY);
