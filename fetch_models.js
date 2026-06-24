import 'dotenv/config';

const fetchModels = async (url, key) => {
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${key}` }
        });
        const data = await response.json();
        const scout = data.data.find(m => m.id.includes('llama-4-scout'));
        console.log('Llama 4 Scout Modalities:', scout?.input_modalities);
    } catch (e) {
        console.error('Error fetching', url, e.message);
    }
};

fetchModels('https://api.x.ai/v1/models', process.env.XAI_API_KEY).then(() => {
    fetchModels('https://api.groq.com/openai/v1/models', process.env.GROQ_API_KEY);
});
