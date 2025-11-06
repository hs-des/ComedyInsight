/**
 * Generate Placeholder Assets for Expo
 * 
 * This script creates placeholder PNG files for Expo app assets.
 * Replace these with your actual app icons and splash screens.
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a simple 1x1 transparent PNG placeholder
// In a real app, you'd use proper image files
const createPlaceholderPNG = (filename) => {
  // This is a minimal valid PNG (1x1 transparent pixel)
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x00, 0x00, 0x00, 0x0D, 0x0A,
    0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
    0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND
  ]);

  fs.writeFileSync(path.join(assetsDir, filename), pngBuffer);
  console.log(`✅ Created ${filename}`);
};

console.log('🎨 Generating placeholder assets for Expo...\n');

// Generate required assets
createPlaceholderPNG('icon.png');
createPlaceholderPNG('splash.png');
createPlaceholderPNG('adaptive-icon.png');
createPlaceholderPNG('favicon.png');

console.log('\n✨ Done! Replace these with your actual app assets.');
console.log('📝 Note: For production, use proper 1024x1024 icons and splash screens.');
