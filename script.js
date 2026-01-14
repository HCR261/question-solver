// 错题本应用 - 主逻辑
let currentStep = 1;
let selectedSubject = null;
let selectedGrade = null;
let questionText = "";
let questionImage = null;

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
    const ocrKey = document.getElementById('ocrKey').value;
    const aiKey = document.getElementById('aiKey').value;
    
    if (!ocrKey || !aiKey) {
        alert('请填写所有API密钥！');
        return;
    }
    
    localStorage.setItem('ocrKey', ocrKey);
    localStorage.setItem('aiKey', aiKey);
    
    document.getElementById('configModal').style.display = 'none';
    alert('配置保存成功！');
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
        // 在界面上显示图片（可选）
        document.getElementById('questionText').innerHTML = 
            `<img src="${e.target.result}" style="max-width:100%; border-radius:10px;" alt="题目图片">`;
        
        // 进行OCR识别
        performOCR(file);
    };
    reader.readAsDataURL(file);
    
    // 进入下一步
    goToStep(3);
}

// 执行OCR识别
async function performOCR(file) {
    const ocrKey = localStorage.getItem('ocrKey');
    if (!ocrKey) {
        showConfigModal();
        return;
    }
    
    // 显示识别中
    document.getElementById('questionText').innerHTML = '正在识别文字...';
    
    try {
        // 将图片转换为base64
        const base64 = await fileToBase64(file);
        
        // 这里简化处理：实际应该调用百度OCR API
        // 由于是教学，我们先用模拟数据
        setTimeout(() => {
            // 模拟OCR结果
            const mockQuestions = [
                "已知函数 f(x) = 2x² - 3x + 1，求 f(2) 的值。",
                "解方程：3x + 5 = 2x + 12",
                "计算：(2+3)×4÷2 = ?",
                "一个圆的半径是5cm，求面积（π取3.14）",
                "What is the capital of France?"
            ];
            
            const randomText = mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
            questionText = randomText;
            
            document.getElementById('questionText').textContent = randomText;
        }, 2000);
        
    } catch (error) {
        console.error('OCR失败:', error);
        document.getElementById('questionText').textContent = '识别失败，请手动输入';
    }
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

// AI解题
async function solveWithAI() {
    const aiKey = localStorage.getItem('aiKey');
    if (!aiKey) {
        showConfigModal();
        return;
    }
    
    if (!questionText) {
        alert('请先获取题目');
        return;
    }
    
    if (!selectedSubject || !selectedGrade) {
        alert('请选择科目和学段');
        return;
    }
    
    // 显示加载状态
    document.querySelector('.ai-btn').style.display = 'none';
    document.getElementById('loadingAI').style.display = 'block';
    
    try {
        // 构建提示词
        const prompt = `你是一位${selectedGrade}的${selectedSubject}老师，请解答以下题目：

题目：${questionText}

要求：
1. 给出详细解题步骤
2. 解释关键概念
3. 提供易错点提示
4. 语言适合${selectedGrade}学生理解

请开始解答：`;
        
        // 这里简化处理：实际应该调用DeepSeek API
        // 由于是教学，我们先用模拟数据
        setTimeout(() => {
            // 模拟AI解答
            const mockSolutions = {
                "已知函数 f(x) = 2x² - 3x + 1，求 f(2) 的值。": 
                    "解题步骤：\n1. 将x=2代入函数：f(2) = 2×2² - 3×2 + 1\n2. 计算平方：2²=4\n3. 代入计算：2×4=8，-3×2=-6\n4. 最终结果：8 - 6 + 1 = 3\n\n答案：f(2) = 3",
                
                "解方程：3x + 5 = 2x + 12":
                    "解题步骤：\n1. 将方程移项：3x - 2x = 12 - 5\n2. 合并同类项：x = 7\n\n答案：x = 7",
                
                "计算：(2+3)×4÷2 = ?":
                    "解题步骤：\n1. 先算括号内：2+3=5\n2. 乘以4：5×4=20\n3. 除以2：20÷2=10\n\n答案：10",
                
                "一个圆的半径是5cm，求面积（π取3.14）":
                    "解题步骤：\n1. 圆面积公式：S = πr²\n2. 代入半径：S = 3.14 × 5²\n3. 计算平方：5²=25\n4. 最终计算：3.14 × 25 = 78.5\n\n答案：78.5cm²",
                
                "What is the capital of France?":
                    "解题步骤：\n1. France is a country in Europe\n2. The capital city of France is Paris\n3. Paris is known as the 'City of Love'\n\n答案：The capital of France is Paris."
            };
            
            const solution = mockSolutions[questionText] || 
                "AI解答：\n1. 解析题目要求\n2. 应用相关知识\n3. 逐步计算\n4. 得出结论\n\n详细解答会根据具体题目变化。";
            
            // 显示解答
            document.getElementById('loadingAI').style.display = 'none';
            document.getElementById('solution').style.display = 'block';
            document.getElementById('solutionText').textContent = solution;
            
        }, 3000);
        
    } catch (error) {
        console.error('AI解题失败:', error);
        alert('AI解题失败，请检查网络和API配置');
        
        // 恢复按钮
        document.querySelector('.ai-btn').style.display = 'block';
        document.getElementById('loadingAI').style.display = 'none';
    }
}

// 保存错题
function saveQuestion() {
    if (!questionText) {
        alert('没有题目可保存');
        return;
    }
    
    // 创建错题记录
    const record = {
        id: Date.now(),
        subject: selectedSubject,
        grade: selectedGrade,
        question: questionText,
        time: new Date().toLocaleString(),
        image: questionImage ? '有图片' : '无图片'
    };
    
    // 从本地存储获取历史记录
    let history = JSON.parse(localStorage.getItem('questionHistory') || '[]');
    history.unshift(record);
    
    // 保存到本地存储
    localStorage.setItem('questionHistory', JSON.stringify(history));
    
    alert('错题保存成功！');
    
    // 可选：返回首页
    setTimeout(() => {
        goToStep(1);
        document.querySelector('.ai-btn').style.display = 'block';
        document.getElementById('solution').style.display = 'none';
    }, 1000);
}