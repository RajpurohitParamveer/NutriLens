import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Android icon sizes
const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const sourceIcon = path.join(rootDir, 'src/assets/nutrilens-icon.png');
const androidResDir = path.join(rootDir, 'android/app/src/main/res');

async function generateAndroidIcons() {
  console.log('Generating Android app icons...');
  
  // Check if source icon exists
  if (!existsSync(sourceIcon)) {
    console.error(`Source icon not found: ${sourceIcon}`);
    process.exit(1);
  }

  // Generate icons for each density
  for (const [folder, size] of Object.entries(androidSizes)) {
    const folderPath = path.join(androidResDir, folder);
    
    // Create directory if it doesn't exist
    if (!existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true });
    }

    // Generate regular icon
    const iconPath = path.join(folderPath, 'ic_launcher.png');
    await sharp(sourceIcon)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(iconPath);
    console.log(`✓ Generated ${iconPath} (${size}x${size})`);

    // Generate round icon
    const roundIconPath = path.join(folderPath, 'ic_launcher_round.png');
    await sharp(sourceIcon)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(roundIconPath);
    console.log(`✓ Generated ${roundIconPath} (${size}x${size})`);

    // Generate foreground icon for adaptive icon
    const foregroundPath = path.join(folderPath, 'ic_launcher_foreground.png');
    await sharp(sourceIcon)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(foregroundPath);
    console.log(`✓ Generated ${foregroundPath} (${size}x${size})`);
  }

  console.log('\n✅ All Android icons generated successfully!');
}

generateAndroidIcons().catch(console.error);

