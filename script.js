// 错题本应用 - 主逻辑
let currentStep = 1;
let selectedSubject = null;
let selectedGrade = null;
let questionText = "";
let questionImage = null;

// Toast提示函数
function showToast(message, type = 'info') {
    // 如果已经有toast，先移除
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    // 样式
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.3s;
        max-width: 80%;
        text-align: center;
    `;
    
    document.body.appendChild(toast);
    
    // 显示
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // 3秒后移除
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// 页面加载完成后运行
window.onload = function() {
    // 隐藏加载界面，显示应用
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        
        // 检查是否来自NFC
        checkNFC();
        
        // 检查API配置
        checkConfig();
    }, 1000);
};

// 检查URL中是否有NFC参数
function checkNFC() {
    const urlParams = new URLSearchParams(window.location.search);
    const nfc = urlParams.get('nfc');
    
    if (nfc === 'true') {
        // 如果是NFC启动，显示提示并自动开始
        document.querySelector('.welcome p').textContent = 'NFC标签启动成功！';
        showToast('NFC标签启动成功！', 'success');
        
        setTimeout(() => {
            goToStep(2);
        }, 1500);
    }
}

// 检查API配置
function checkConfig() {
    const ocrKey = localStorage.getItem('ocrKey');
    const aiKey = localStorage.getItem('aiKey');
    
    if (!ocrKey || !aiKey) {
        // 显示配置弹窗
        setTimeout(() => {
            showConfigModal();
        }, 2000);
    }
}

// 显示配置弹窗
function showConfigModal() {
    document.getElementById('configModal').style.display = 'flex';
}

// 保存配置
function saveConfig() {
    const ocrKey = document.getElementById('ocrKey').value.trim();
    const aiKey = document.getElementById('aiKey').value.trim();
    
    if (!ocrKey || !aiKey) {
        showToast('请填写所有API密钥！', 'error');
        return;
    }
    
    localStorage.setItem('ocrKey', ocrKey);
    localStorage.setItem('aiKey', aiKey);
    
    document.getElementById('configModal').style.display = 'none';
    showToast('配置保存成功！', 'success');
}

// 切换步骤
function goToStep(step) {
    // 隐藏所有步骤
    document.querySelectorAll('.step').forEach(s => {
        s.classList.remove('active');
    });
    
    // 显示目标步骤
    document.getElementById('step' + step).classList.add('active');
    currentStep = step;
}

// 选择科目
function selectSubject(subject) {
    selectedSubject = subject;
    
    // 移除所有激活状态
    document.querySelectorAll('.subject-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 激活当前按钮
    event.target.classList.add('active');
    
    // 启用下一步按钮
    document.querySelector('#step3 .next-btn').disabled = false;
}

// 选择学段
function selectGrade(grade) {
    selectedGrade = grade;
    
    // 移除所有激活状态
    document.querySelectorAll('.grade-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 激活当前按钮
    event.target.classList.add('active');
    
    // 启用下一步按钮
    document.querySelector('#step4 .next-btn').disabled = false;
}

// 拍照
function takePhoto() {
    // 创建文件选择输入，但有拍照属性
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // 使用后置摄像头
    
    input.onchange = function(e) {
        if (e.target.files && e.target.files[0]) {
            handleImageFile(e.target.files[0]);
        }
    };
    
    input.click();
}

// 从相册选择
function chooseFromAlbum() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        if (e.target.files && e.target.files[0]) {
            handleImageFile(e.target.files[0]);
        }
    };
    
    input.click();
}

// 处理图片文件
function handleImageFile(file) {
    questionImage = file;
    
    // 显示图片预览
    const reader = new FileReader();
    reader.onload = function(e) {
        // 在界面上显示图片
        document.getElementById('questionText').innerHTML = 
            `<img src="${e.target.result}" style="max-width:100%; border-radius:10px; margin:10px 0;" alt="题目图片">
             <p style="margin-top:10px; color:#666;">正在识别图片中的文字...</p>`;
        
        // 进行OCR识别
        performOCR(file);
    };
    reader.readAsDataURL(file);
    
    // 进入下一步
    goToStep(3);
}

// 文件转base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// 执行OCR识别
async function performOCR(file) {
    const ocrKey = localStorage.getItem('ocrKey');
    if (!ocrKey) {
        showConfigModal();
        showToast('请先配置百度OCR API密钥', 'error');
        return;
    }
    
    try {
        // 将图片转换为base64
        const base64 = await fileToBase64(file);
        // 移除data:image/png;base64,前缀
        const pureBase64 = base64.split(',')[1];
        
        if (!pureBase64) {
            throw new Error('图片转换失败');
        }
        
        showToast('正在调用百度OCR识别文字...', 'info');
        
        // 调用Vercel Serverless API
        const response = await fetch('/api/ocr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                imageBase64: pureBase64
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            questionText = data.text;
            document.getElementById('questionText').innerHTML = 
                `<strong>识别结果：</strong><br><br>` + 
                data.text.replace(/\n/g, '<br>');
            showToast('文字识别成功！', 'success');
        } else {
            throw new Error(data.error || '识别失败');
        }
        
    } catch (error) {
        console.error('OCR失败:', error);
        showToast('文字识别失败：' + error.message, 'error');
        
        // 显示错误但允许继续
        document.getElementById('questionText').innerHTML = 
            `<strong>识别失败，请手动输入题目：</strong><br><br>
             <textarea id="manualInput" style="width:100%; height:100px; padding:10px; border:1px solid #ddd; border-radius:5px;" 
                       placeholder="请在这里手动输入题目内容..."></textarea>
             <button onclick="useManualInput()" style="margin-top:10px; padding:10px 20px; background:#007bff; color:white; border:none; border-radius:5px;">使用手动输入</button>`;
    }
}

// 使用手动输入
function useManualInput() {
    const manualInput = document.getElementById('manualInput');
    if (manualInput && manualInput.value.trim()) {
        questionText = manualInput.value.trim();
        document.getElementById('questionText').textContent = questionText;
        showToast('已使用手动输入的题目', 'success');
    } else {
        showToast('请输入题目内容', 'error');
    }
}

// AI解题
async function solveWithAI() {
    const aiKey = localStorage.getItem('aiKey');
    if (!aiKey) {
        showConfigModal();
        showToast('请先配置DeepSeek API密钥', 'error');
        return;
    }
    
    if (!questionText) {
        showToast('请先获取题目内容', 'error');
        return;
    }
    
    if (!selectedSubject) {
        showToast('请选择科目', 'error');
        return;
    }
    
    if (!selectedGrade) {
        showToast('请选择学段', 'error');
        return;
    }
    
    // 显示加载状态
    document.querySelector('.ai-btn').style.display = 'none';
    document.getElementById('loadingAI').style.display = 'block';
    document.getElementById('solution').style.display = 'none';
    
    // 显示详细的加载状态
    const loadingSection = document.getElementById('loadingAI');
    loadingSection.innerHTML = `
        <div class="spinner-small"></div>
        <h3 style="margin:15px 0 10px;">AI正在思考解题思路...</h3>
        <p style="color:#666; margin-bottom:15px;">这可能需要10-30秒钟</p>
        <div style="text-align:left; background:#f8f9fa; padding:15px; border-radius:8px; margin-top:10px;">
            <p><strong>题目：</strong>${questionText.substring(0, 100)}${questionText.length > 100 ? '...' : ''}</p>
            <p><strong>科目：</strong>${selectedSubject}</p>
            <p><strong>学段：</strong>${selectedGrade}</p>
        </div>
    `;
    
    try {
        showToast('正在调用DeepSeek AI解题...', 'info');
        
        // 调用Vercel Serverless API
        const response = await fetch('/api/solve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: questionText,
                subject: selectedSubject,
                grade: selectedGrade,
                apiKey: aiKey
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 显示解答
            document.getElementById('loadingAI').style.display = 'none';
            document.getElementById('solution').style.display = 'block';
            document.getElementById('solutionText').innerHTML = 
                data.answer.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            showToast('AI解题成功！', 'success');
            
            // 显示解题统计
            if (data.usage) {
                const usageInfo = `本次解题消耗：${data.usage.total_tokens || '未知'} tokens`;
                showToast(usageInfo, 'info');
            }
            
        } else {
            throw new Error(data.error || 'AI解题失败');
        }
        
    } catch (error) {
        console.error('AI解题失败:', error);
        
        // 详细的错误信息
        let errorMessage = 'AI解题失败';
        if (error.message.includes('API Key') || error.message.includes('无效') || error.message.includes('过期')) {
            errorMessage = 'API密钥无效或已过期，请重新配置';
        } else if (error.message.includes('频率') || error.message.includes('quota') || error.message.includes('额度')) {
            errorMessage = 'API调用额度已用完，请检查账户余额';
        } else if (error.message.includes('网络')) {
            errorMessage = '网络连接失败，请检查网络';
        } else {
            errorMessage = error.message;
        }
        
        showToast('AI解题失败：' + errorMessage, 'error');
        
        // 恢复按钮，并提供重试选项
        document.querySelector('.ai-btn').style.display = 'block';
        document.getElementById('loadingAI').style.display = 'none';
        document.getElementById('loadingAI').innerHTML = `
            <div class="spinner-small"></div>
            <p>AI正在思考...</p>
        `;
        
        // 提供模拟解答作为备选
        setTimeout(() => {
            if (confirm('AI解题失败，是否查看示例解答？')) {
                showExampleSolution();
            }
        }, 1000);
    }
}

// 显示示例解答（备用）
function showExampleSolution() {
    const exampleSolutions = {
        "数学": `解题步骤示例：
1. 仔细阅读题目，理解已知条件和求解目标
2. 根据题目类型选择合适的公式或方法
3. 逐步计算，注意单位和精度
4. 检查结果是否合理

示例答案：根据具体题目而定`,
        "物理": `解题步骤示例：
1. 分析物理过程，确定物理模型
2. 列出已知条件和所求量
3. 选择合适的物理公式
4. 代入数值计算
5. 分析结果的物理意义

示例答案：根据具体题目而定`,
        "化学": `解题步骤示例：
1. 写出化学方程式并配平
2. 计算物质的量关系
3. 根据条件进行计算
4. 注意单位换算和有效数字

示例答案：根据具体题目而定`,
        "语文": `解题思路示例：
1. 理解题目要求，明确答题方向
2. 分析文本内容，找出关键信息
3. 组织语言，分点作答
4. 检查是否完整回答了问题

示例答案：根据具体题目而定`,
        "英语": `解题思路示例：
1. 仔细阅读题目要求
2. 分析语法结构和词汇用法
3. 注意时态和语态的一致性
4. 检查拼写和语法错误

示例答案：根据具体题目而定`
    };
    
    const solution = exampleSolutions[selectedSubject] || `解题思路：
1. 分析题目要求
2. 运用相关知识
3. 逐步推理
4. 得出结论

请配置正确的API密钥获取详细解答。`;
    
    document.getElementById('solution').style.display = 'block';
    document.getElementById('solutionText').innerHTML = solution.replace(/\n/g, '<br>');
    showToast('显示的是示例解答，请配置API获取真实解答', 'warning');
}

// 保存错题
function saveQuestion() {
    if (!questionText) {
        showToast('没有题目可保存', 'error');
        return;
    }
    
    // 创建错题记录
    const record = {
        id: Date.now(),
        subject: selectedSubject,
        grade: selectedGrade,
        question: questionText,
        solution: document.getElementById('solutionText').textContent || '未保存解答',
        time: new Date().toLocaleString(),
        image: questionImage ? '有图片' : '无图片'
    };
    
    // 从本地存储获取历史记录
    let history = JSON.parse(localStorage.getItem('questionHistory') || '[]');
    history.unshift(record);
    
    // 保存到本地存储
    localStorage.setItem('questionHistory', JSON.stringify(history));
    
    showToast('错题保存成功！', 'success');
    
    // 可选：返回首页
    setTimeout(() => {
        goToStep(1);
        document.querySelector('.ai-btn').style.display = 'block';
        document.getElementById('solution').style.display = 'none';
        document.getElementById('loadingAI').style.display = 'none';
        
        // 重置状态
        questionText = "";
        questionImage = null;
        selectedSubject = null;
        selectedGrade = null;
        
        // 重置UI
        document.querySelectorAll('.subject-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.grade-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('questionText').textContent = '这里会显示你的题目...';
    }, 1500);
}

// 页面卸载前提示保存
window.addEventListener('beforeunload', function (e) {
    if (questionText && !localStorage.getItem('questionHistory')) {
        // 如果有未保存的题目，提示用户
        e.preventDefault();
        e.returnValue = '您有未保存的错题，确定要离开吗？';
    }
});
