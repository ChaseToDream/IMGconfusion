# Image Obfuscator

A secure and efficient image obfuscation and restoration tool that processes images entirely in the client-side browser, ensuring privacy and security.

## Features

- **Client-side Processing**: All image processing is done locally in your browser, no data is sent to any server
- **Secure Obfuscation**: Uses XOR encryption with a random key to scramble image data
- **Lossless Restoration**: Restored images are pixel-perfect copies of the original
- **Drag & Drop Support**: Easy image upload with drag-and-drop functionality
- **Real-time Progress**: Visual progress indicator during image processing
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **High Resolution Support**: Handles images up to 4K resolution
- **Fast Processing**: Optimized algorithm with chunked processing to avoid UI blocking

## Technologies Used

- **React**: A JavaScript library for building user interfaces
- **Vite**: A modern frontend build tool that provides fast development and optimized builds
- **HTML5 Canvas**: For client-side image processing
- **CSS3**: For responsive design and modern UI

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/image-obfuscator.git
cd image-obfuscator
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Usage

1. **Upload Image**: Drag and drop an image or click to select from your device
2. **Obfuscate Image**: Click the "Obfuscate Image" button to scramble the image
3. **Download Obfuscated Image**: Save the obfuscated image to your device
4. **Restore Image**: Click the "Restore Image" button to还原 the image to its original state
5. **Download Restored Image**: Save the restored image to your device

## Deployment

### Cloudflare Pages

1. Push your code to a GitHub repository
2. Log in to Cloudflare Pages
3. Create a new project and connect your GitHub repository
4. Set the build command to `npm run build`
5. Set the build output directory to `dist`
6. Click "Deploy Site"

### Vercel

1. Push your code to a GitHub repository
2. Log in to Vercel
3. Import your GitHub repository
4. Vercel will automatically detect the build settings
5. Click "Deploy"

## Privacy

All image processing is done entirely in your browser. No images are uploaded to any server, ensuring your privacy and security. The obfuscation key is generated locally and never stored anywhere.

## Performance

- **Fast Initial Load**: Optimized build with minimal bundle size
- **Efficient Processing**: Chunked processing for large images
- **Smooth UI**: Uses requestAnimationFrame to avoid UI blocking
- **Responsive Design**: Adapts to different screen sizes

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Built with React and Vite
- Uses HTML5 Canvas for image processing
- Inspired by the need for secure, client-side image obfuscation
