# 火山声音克隆工具

这是一个使用火山引擎API进行声音克隆的工具。该工具可以创建自定义音色，并使用HTTP方式生成语音。

## 环境设置

本项目使用 Conda 进行虚拟环境和依赖管理。

### 首次设置

1. 确保已安装 Conda
   - 如果尚未安装，请从 [Anaconda官网](https://www.anaconda.com/download) 下载并安装
   - 或者使用 [Miniconda](https://docs.conda.io/en/latest/miniconda.html) 进行轻量级安装

2. 创建虚拟环境：
   ```
   conda remove -n huoshan-voice-copy --all -y
   conda create -n huoshan-voice-copy python=3.10
   conda activate huoshan-voice-copy
   ```
   - 这将创建一个名为 huoshan-voice-copy 的虚拟环境
   - Python 版本设置为 3.10，确保与项目兼容

3. 安装依赖：
   ```
   pip install -r requirements.txt
   ```
   - 这将安装项目所需的所有依赖包
   - 包括 asyncio 等必要库

### 运行方式

1. 创建音色
   ```
   python uploadAndStatus.py
   ```
   - 此脚本用于上传音频样本并创建自定义音色
   - 需要准备一段清晰的语音样本（建议使用 wav 格式），时长在10s左右最好

2. 测试音色（HTTP方式）
   ```
   python tts_http_demo.py
   ```
   - 使用HTTP方式生成语音
   - 修改代码中的 text 变量来更改要转换的文本内容
   - 生成的音频将保存为 test_submit.mp3
   - 适合短文本转换

## 注意事项

1. 音频样本要求：
   - 格式：WAV
   - 时长：建议 10-30 秒
   - 质量：清晰无背景噪音
   - 内容：朗读文本，发音标准

2. 文本转换限制：
   - 单次转换文本长度有限制
   - 支持中文、英文等多种语言
   - 特殊字符可能需要转义处理

3. 性能考虑：
   - HTTP方式适合短文本
   - WebSocket方式适合长文本
   - 建议根据实际需求选择合适的转换方式

## 更新依赖

如果需要更新依赖，可以使用以下命令：

```
pip install -r requirements.txt --upgrade
```

## 添加新依赖

如果需要添加新的依赖，先更新 requirements.txt 文件，然后运行：

```
pip install -r requirements.txt
```

## 常见问题

1. 环境激活失败
   - 确保已正确安装 Conda
   - 检查环境名称是否正确
   - 尝试重新创建环境

2. 依赖安装失败
   - 检查网络连接
   - 尝试使用国内镜像源
   - 确保 Python 版本兼容

3. 音频生成失败
   - 检查音色ID是否正确
   - 确认文本内容是否合法
   - 查看错误日志获取详细信息 