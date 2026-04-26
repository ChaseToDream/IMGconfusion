import React, { useState, useRef } from 'react';
import './index.css';

function App() {
  const [originalImage, setOriginalImage] = useState(null);
  const [obfuscatedImage, setObfuscatedImage] = useState(null);
  const [restoredImage, setRestoredImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // 处理文件上传
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      processImage(file);
    }
  };

  // 处理拖放事件
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      processImage(file);
    }
  };

  // 处理图片
  const processImage = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target.result);
      setObfuscatedImage(null);
      setRestoredImage(null);
      setMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // 生成随机密钥
  const generateKey = () => {
    const key = new Uint32Array(16);
    window.crypto.getRandomValues(key);
    return Array.from(key, x => x.toString(16).padStart(8, '0')).join('');
  };

  // 图片混淆算法
  const obfuscateImage = async () => {
    if (!originalImage) {
      showMessage('Please upload an image first', 'error');
      return;
    }

    setProgress(0);
    showMessage('Obfuscating image...', 'info');

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const key = generateKey();

        // 分块处理图片数据
        const chunkSize = 1024 * 1024; // 1MB chunks
        const totalChunks = Math.ceil(data.length / chunkSize);

        for (let i = 0; i < data.length; i += 4) {
          // 使用密钥对每个像素进行混淆
          const pixelIndex = i / 4;
          const keyIndex = pixelIndex % key.length;
          const keyByte = key.charCodeAt(keyIndex);

          // 对RGB通道进行混淆
          data[i] ^= keyByte;     // R
          data[i + 1] ^= keyByte; // G
          data[i + 2] ^= keyByte; // B

          // 更新进度
          if (i % chunkSize === 0) {
            const currentChunk = Math.floor(i / chunkSize);
            setProgress(Math.floor((currentChunk / totalChunks) * 100));
            // 使用requestAnimationFrame避免UI阻塞
            await new Promise(resolve => requestAnimationFrame(resolve));
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const obfuscatedDataUrl = canvas.toDataURL('image/png');
        setObfuscatedImage({ data: obfuscatedDataUrl, key });
        setProgress(100);
        showMessage('Image obfuscated successfully!', 'success');
      };

      img.src = originalImage;
    } catch (error) {
      console.error('Error obfuscating image:', error);
      showMessage('Error obfuscating image', 'error');
    }
  };

  // 图片还原算法
  const restoreImage = async () => {
    if (!obfuscatedImage) {
      showMessage('Please obfuscate an image first', 'error');
      return;
    }

    setProgress(0);
    showMessage('Restoring image...', 'info');

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const { key } = obfuscatedImage;

      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 分块处理图片数据
        const chunkSize = 1024 * 1024; // 1MB chunks
        const totalChunks = Math.ceil(data.length / chunkSize);

        for (let i = 0; i < data.length; i += 4) {
          // 使用相同的密钥对每个像素进行还原
          const pixelIndex = i / 4;
          const keyIndex = pixelIndex % key.length;
          const keyByte = key.charCodeAt(keyIndex);

          // 对RGB通道进行还原
          data[i] ^= keyByte;     // R
          data[i + 1] ^= keyByte; // G
          data[i + 2] ^= keyByte; // B

          // 更新进度
          if (i % chunkSize === 0) {
            const currentChunk = Math.floor(i / chunkSize);
            setProgress(Math.floor((currentChunk / totalChunks) * 100));
            // 使用requestAnimationFrame避免UI阻塞
            await new Promise(resolve => requestAnimationFrame(resolve));
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const restoredDataUrl = canvas.toDataURL('image/png');
        setRestoredImage(restoredDataUrl);
        setProgress(100);
        showMessage('Image restored successfully!', 'success');
      };

      img.src = obfuscatedImage.data;
    } catch (error) {
      console.error('Error restoring image:', error);
      showMessage('Error restoring image', 'error');
    }
  };

  // 下载图片
  const downloadImage = (imageData, fileName) => {
    if (!imageData) return;

    const link = document.createElement('a');
    link.href = typeof imageData === 'string' ? imageData : imageData.data;
    link.download = fileName;
    link.click();
  };

  // 显示消息
  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Image Obfuscator</h1>
        <p>Securely obfuscate and restore your images with client-side processing</p>
      </div>

      <div className="card">
        {/* 图片上传区域 */}
        <div 
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            accept="image/*"
          />
          <div className="upload-area-label">
            <div className="upload-icon">📁</div>
            <div className="upload-text">Drag & drop your image here or click to select</div>
            <div className="upload-subtext">Supports JPG, PNG, GIF, and WebP formats</div>
          </div>
        </div>

        {/* 消息显示 */}
        {message && (
          <div className={`message message-${messageType}`}>
            {message}
          </div>
        )}

        {/* 进度条 */}
        {progress > 0 && progress < 100 && (
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="progress-text">{progress}%</div>
          </div>
        )}

        {/* 按钮组 */}
        <div className="button-group">
          <button 
            className={`button button-primary ${!originalImage ? 'button-disabled' : ''}`}
            onClick={obfuscateImage}
            disabled={!originalImage}
          >
            Obfuscate Image
          </button>
          <button 
            className={`button button-secondary ${!obfuscatedImage ? 'button-disabled' : ''}`}
            onClick={restoreImage}
            disabled={!obfuscatedImage}
          >
            Restore Image
          </button>
        </div>

        {/* 图片预览区域 */}
        <div className="image-container">
          {originalImage && (
            <div className="image-box">
              <h3>Original Image</h3>
              <img src={originalImage} alt="Original" className="image-preview" />
              <button 
                className="button button-secondary"
                onClick={() => downloadImage(originalImage, 'original-image.png')}
              >
                Download
              </button>
            </div>
          )}

          {obfuscatedImage && (
            <div className="image-box">
              <h3>Obfuscated Image</h3>
              <img src={obfuscatedImage.data} alt="Obfuscated" className="image-preview" />
              <button 
                className="button button-secondary"
                onClick={() => downloadImage(obfuscatedImage, 'obfuscated-image.png')}
              >
                Download
              </button>
              <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666' }}>
                Key: {obfuscatedImage.key}
              </div>
            </div>
          )}

          {restoredImage && (
            <div className="image-box">
              <h3>Restored Image</h3>
              <img src={restoredImage} alt="Restored" className="image-preview" />
              <button 
                className="button button-secondary"
                onClick={() => downloadImage(restoredImage, 'restored-image.png')}
              >
                Download
              </button>
            </div>
          )}
        </div>

        {/* 隐藏的canvas用于图像处理 */}
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      </div>

      <div className="card">
        <h3>About</h3>
        <p>This tool allows you to obfuscate and restore images using client-side processing. All image processing is done locally in your browser, ensuring your privacy and security. The obfuscation algorithm uses a secure XOR operation with a random key to scramble the image data, making it unrecognizable without the key.</p>
        <p>Supports images up to 4K resolution. For large images, the processing may take a few seconds, but the progress bar will keep you updated.</p>
      </div>
    </div>
  );
}

export default App;