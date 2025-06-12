'use client';

import { useState } from 'react';
import { extractTextFromImage, streamExtractTextFromImage } from '../services/api';
import { getJapaneseTtsAudioUrl, speakJapanese } from '../utils/helpers';

// 添加内联样式
const placeholderStyle = `
  #japaneseInput::placeholder {
    color: rgba(0, 0, 0, 0.4) !important;
    opacity: 0.6 !important;
  }
`;

interface InputSectionProps {
  onAnalyze: (text: string) => void;
  userApiKey?: string;
  userApiUrl?: string;
  useStream?: boolean;
}

export default function InputSection({ 
  onAnalyze,
  userApiKey,
  userApiUrl,
  useStream = true // 默认启用流式输出
}: InputSectionProps) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadStatusClass, setUploadStatusClass] = useState('');

  const handleAnalyze = () => {
    if (!inputText.trim()) {
      alert('请输入日语句子！');
      return;
    }

    setIsLoading(true);
    onAnalyze(inputText);
    setTimeout(() => setIsLoading(false), 300); // 简化示例，实际应在分析完成后设置
  };

  const handleSpeak = async () => {
    if (!inputText.trim()) return;
    setIsSpeaking(true);
    try {
      const url = await getJapaneseTtsAudioUrl(inputText, userApiKey);
      setTtsAudioUrl(url);
    } catch (e) {
      console.error('TTS error:', e);
      setTtsAudioUrl(null);
      speakJapanese(inputText);
    } finally {
      setIsSpeaking(false);
    }
  };

  // 根据文本长度估算合成时间
  const getEstimatedTime = (text: string): string => {
    const length = text.length;
    if (length <= 20) return '5-10秒';
    if (length <= 50) return '10-20秒';
    if (length <= 100) return '20-30秒';
    return '30-60秒';
  };



  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setUploadStatus('请上传图片文件！');
      setUploadStatusClass('mt-2 text-sm text-red-600');
      return;
    }

    setIsImageUploading(true);
    setUploadStatus('正在上传并识别图片中的文字...');
    setUploadStatusClass('mt-2 text-sm text-gray-600');

    try {
      // 压缩图片以减小数据大小
      const compressedImageData = await compressImage(file);
      
      // 优化提示词，明确不要换行符
      const imageExtractionPrompt = "请提取并返回这张图片中的所有日文文字。提取的文本应保持原始格式，但不要输出换行符，用空格替代。不要添加任何解释或说明。";
      
      if (useStream) {
        // 使用流式API进行图片文字提取
        streamExtractTextFromImage(
          compressedImageData,
          (chunk, isDone) => {
            setInputText(chunk);
            
            if (isDone) {
              setIsImageUploading(false);
              setUploadStatus('文字提取成功！请确认后点击"解析句子"。');
              setUploadStatusClass('mt-2 text-sm text-green-600');
            }
          },
          (error) => {
            console.error('Error during streaming image text extraction:', error);
            setUploadStatus(`提取时发生错误: ${error.message || '未知错误'}。`);
            setUploadStatusClass('mt-2 text-sm text-red-600');
            setIsImageUploading(false);
          },
          imageExtractionPrompt,
          userApiKey,
          userApiUrl
        );
      } else {
        // 使用传统API进行图片文字提取
        const extractedText = await extractTextFromImage(compressedImageData, imageExtractionPrompt, userApiKey, userApiUrl);
        setInputText(extractedText); 
        setUploadStatus('文字提取成功！请确认后点击"解析句子"。');
        setUploadStatusClass('mt-2 text-sm text-green-600');
        setIsImageUploading(false);
      }
    } catch (error) {
      console.error('Error during image text extraction:', error);
      setUploadStatus(`提取时发生错误: ${error instanceof Error ? error.message : '未知错误'}。`);
      setUploadStatusClass('mt-2 text-sm text-red-600');
      setIsImageUploading(false);
    } finally {
      // 清理file input
      event.target.value = '';
    }
  };

  // 图片压缩函数
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // 创建canvas进行图片压缩
          const canvas = document.createElement('canvas');
          // 确定压缩后尺寸（保持宽高比）
          let width = img.width;
          let height = img.height;
          
          // 如果图片尺寸大于1600px，按比例缩小
          const maxDimension = 1600;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // 在canvas上绘制压缩后的图片
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建canvas上下文'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          // 转换为dataURL，使用较低的质量
          const quality = 0.7; // 70%的质量，可以根据需要调整
          const dataUrl = canvas.toDataURL(file.type, quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('无法读取文件'));
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="premium-card">
      <style dangerouslySetInnerHTML={{ __html: placeholderStyle }} />
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">输入日语句子</h2>
      <div className="relative">
        <textarea 
          id="japaneseInput" 
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition duration-150 ease-in-out resize-none japanese-text" 
          rows={4} 
          placeholder="例：今日はいい天気ですね。或上传图片识别文字。"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ 
            fontSize: '16px', // 防止移动设备缩放
            WebkitTextFillColor: 'black', // Safari特定修复
            color: 'black',
            fontFamily: "'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif"
          }}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        ></textarea>
        {inputText.trim() !== '' && (
          <button 
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={() => setInputText('')}
            title="清空内容"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <input 
          type="file" 
          id="imageUploadInput" 
          accept="image/*" 
          className="hidden" 
          onChange={handleImageUpload}
        />
        <div className="flex gap-2 w-full sm:w-auto mb-2 sm:mb-0 sm:order-1">
          <button
            id="uploadImageButton"
            className="premium-button premium-button-secondary flex-1 sm:w-auto text-sm sm:text-base py-2 sm:py-3"
            onClick={() => document.getElementById('imageUploadInput')?.click()}
            disabled={isImageUploading}
            title="上传图片提取文字"
          >
            <i className="fas fa-camera"></i>
            {isImageUploading && <div className="loading-spinner ml-2" style={{ width: '18px', height: '18px' }}></div>}
          </button>

          <button
            id="speakButton"
            className="premium-button premium-button-secondary flex-1 sm:w-auto text-sm sm:text-base py-2 sm:py-3"
            onClick={handleSpeak}
            disabled={!inputText.trim() || isLoading || isSpeaking}
            title={inputText.trim() ? `朗读文本 (预计需要 ${getEstimatedTime(inputText)})` : '请先输入文本'}
          >
            <i className="fas fa-volume-up"></i>
            {isSpeaking && <div className="loading-spinner ml-2" style={{ width: '18px', height: '18px' }}></div>}
          </button>
        </div>

        <button
          id="analyzeButton"
          className="premium-button premium-button-primary w-full sm:w-auto sm:order-2 text-sm sm:text-base py-2 sm:py-3"
          onClick={handleAnalyze}
          disabled={isLoading}
        >
          {!isLoading && <span className="button-text">解析句子</span>}
          <div className="loading-spinner" style={{ display: isLoading ? 'inline-block' : 'none', width: '18px', height: '18px' }}></div>
          {isLoading && <span className="button-text">解析中...</span>}
        </button>
      </div>
      
      <div id="imageUploadStatus" className={uploadStatusClass}>{uploadStatus}</div>
      
      {ttsAudioUrl && (
        <div className="mt-3">
          <audio 
            key={ttsAudioUrl} 
            src={ttsAudioUrl} 
            controls 
            autoPlay 
            className="w-full"
            style={{ height: '40px' }}
          />
        </div>
      )}

      {isSpeaking && (
        <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>正在进行高质量语音合成，请稍候...</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                • 使用 Gemini TTS 技术，音质更自然<br/>
                • 当前文本预计需要：{getEstimatedTime(inputText)}<br/>
                • 请保持页面打开，不要离开或刷新
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 