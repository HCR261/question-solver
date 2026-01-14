// DeepSeek AI解题接口
const axios = require('axios');

module.exports = async (req, res) => {
    // 允许跨域
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只支持POST请求' });
    }
    
    try {
        const { question, subject, grade, apiKey } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: '缺少题目内容' });
        }
        
        // 使用用户提供的API Key或环境变量中的Key，这里已添加你的DeepSeek API Key
        const DEEPSEEK_API_KEY = apiKey || process.env.DEEPSEEK_API_KEY || 'sk-60afccaefff441a9ad1b9caf4d7febb1';
        
        if (!DEEPSEEK_API_KEY) {
            return res.status(400).json({ error: '缺少API Key配置' });
        }
        
        // 构建prompt
        const prompt = `你是一位${grade}的${subject}老师，请解答以下题目：

题目：${question}

要求：
1. 给出详细解题步骤，分步骤解释
2. 解释关键概念和公式
3. 指出常见错误和易错点
4. 语言简洁明了，适合${grade}学生理解
5. 如果有多种解法，请都列出来

请开始解答：`;
        
        // 调用DeepSeek API
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.3,
            stream: false
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        const answer = response.data.choices[0].message.content;
        
        res.status(200).json({
            success: true,
            answer: answer,
            usage: response.data.usage
        });
        
    } catch (error) {
        console.error('DeepSeek API错误:', error.response?.data || error.message);
        
        let errorMessage = 'AI解题失败';
        if (error.response) {
            if (error.response.status === 401) {
                errorMessage = 'API Key无效或已过期';
            } else if (error.response.status === 429) {
                errorMessage = '请求频率过高，请稍后再试';
            } else if (error.response.data?.error?.message) {
                errorMessage = error.response.data.error.message;
            }
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage,
            detail: error.message
        });
    }
};