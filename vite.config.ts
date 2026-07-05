import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // React 运行时单独分包，便于长缓存
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  worker: {
    // 算法处理在 Worker 中执行，已是独立 chunk（含 shuffle/prng 重逻辑）
    // 主 bundle 仅引入算法元数据，重逻辑不会泄漏到首屏
    format: 'es',
  },
})
