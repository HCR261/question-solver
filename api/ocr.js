// 百度OCR API接口
const axios = require('axios');

module.exports = async (req, res) => {
    // 允许跨域请求
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    // 处理OPTIONS请求（预检请求）
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: '只支持POST请求' 
        });
    }
    
    try {
        const { imageBase64 } = req.body;
        
        if (!imageBase64) {
            return res.status(400).json({ 
                success: false, 
                error: '缺少图片数据，请重新上传图片' 
            });
        }
        
        // 你的百度OCR API配置 - 直接硬编码在这里
        const API_KEY = 'jDQiW43XHiMbkaJh5Q1jMbnZ';
        const SECRET_KEY = 'bcfiSyNMLQL3k0tOaxbr1GLZSSImeix1';
        
        console.log('开始OCR识别，API Key:', API_KEY.substring(0, 10) + '...');
        console.log('图片Base64长度:', imageBase64.length);
        
        // 1. 获取access_token
        const tokenUrl = 'https://aip.baidubce.com/oauth/2.0/token';
        
        console.log('请求access_token...');
        const tokenResponse = await axios.post(`${tokenUrl}?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`);
        
        if (!tokenResponse.data || !tokenResponse.data.access_token) {
            throw new Error('获取百度OCR访问令牌失败');
        }
        
        const accessToken = tokenResponse.data.access_token;
        console.log('access_token获取成功:', accessToken.substring(0, 20) + '...');
        
        // 2. 调用OCR接口
        const ocrUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${accessToken}`;
        
        console.log('调用OCR接口...');
        const formData = new URLSearchParams();
        formData.append('image', imageBase64);
        formData.append('language_type', 'CHN_ENG'); // 中英文混合
        formData.append('detect_direction', 'true'); // 检测图像朝向
        formData.append('paragraph', 'true'); // 输出段落信息
        
        const ocrResponse = await axios.post(ocrUrl, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            timeout: 30000 // 30秒超时
        });
        
        console.log('OCR响应状态:', ocrResponse.status);
        
        // 3. 提取识别结果
        let text = '';
        if (ocrResponse.data && ocrResponse.data.words_result) {
            ocrResponse.data.words_result.forEach((item, index) => {
                text += item.words;
                // 如果不是最后一行，添加换行
                if (index < ocrResponse.data.words_result.length - 1) {
                    text += '\n';
                }
            });
            
            console.log('识别到文字，字符数:', text.length);
            
            // 如果没有识别到文字，检查是否有错误
            if (text.trim() === '' && ocrResponse.data.error_msg) {
                throw new Error(`百度OCR错误: ${ocrResponse.data.error_msg}`);
            }
        } else {
            console.log('OCR响应数据异常:', ocrResponse.data);
            throw new Error('OCR响应数据格式不正确');
        }
        
        // 4. 返回结果
        res.status(200).json({
            success: true,
            text: text.trim(),
            words_count: text.length,
            direction: ocrResponse.data.direction || 0,
            raw: ocrResponse.data // 包含原始数据用于调试
        });
        
        console.log('OCR识别完成，返回结果');
        
    } catch (error) {
        console.error('OCR处理错误详情:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            stack: error.stack
        });
        
        let errorMessage = 'OCR识别失败';
        let errorDetail = error.message;
        
        if (error.response) {
            // 百度API返回的错误
            if (error.response.data && error.response.data.error_msg) {
                errorMessage = `百度OCR错误: ${error.response.data.error_msg}`;
                errorDetail = error.response.data.error_msg;
            } else if (error.response.status === 401) {
                errorMessage = 'API密钥无效或已过期';
                errorDetail = '请检查百度OCR的API Key和Secret Key是否正确';
            } else if (error.response.status === 429) {
                errorMessage = '请求过于频繁，请稍后再试';
                errorDetail = '百度OCR接口调用频率限制';
            } else {
                errorMessage = `HTTP错误 ${error.response.status}`;
                errorDetail = error.response.statusText;
            }
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = '请求超时，请稍后重试';
            errorDetail = 'OCR接口响应超时';
        } else if (error.message.includes('Network Error')) {
            errorMessage = '网络连接失败';
            errorDetail = '请检查网络连接后重试';
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage,
            detail: errorDetail,
            timestamp: new Date().toISOString()
        });
    }
};