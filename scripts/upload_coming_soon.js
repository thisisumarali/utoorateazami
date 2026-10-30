const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    value = value.trim().replace(/^['"](.*)['"]$/, '$1');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function run() {
  const sourceImage = 'C:\\Users\\Hp\\.gemini\\antigravity-ide\\brain\\15132ac0-91ba-46ad-b70b-61ec0cca02c6\\coming_soon_perfume_1793364416395.jpg';
  
  // 1. Ensure public/images exists and copy
  const publicImagesDir = path.resolve(__dirname, '..', 'public', 'images');
  if (!fs.existsSync(publicImagesDir)) {
    fs.mkdirSync(publicImagesDir, { recursive: true });
  }
  const localDest = path.join(publicImagesDir, 'coming-soon-perfume.jpg');
  fs.copyFileSync(sourceImage, localDest);
  console.log('Copied to local:', localDest);

  // 2. Upload to Cloudinary with public_id: utoorateazami/products/coming-soon-perfume
  console.log('Uploading to Cloudinary as utoorateazami/products/coming-soon-perfume...');
  const res = await cloudinary.uploader.upload(sourceImage, {
    public_id: 'utoorateazami/products/coming-soon-perfume',
    overwrite: true,
    resource_type: 'image',
    format: 'jpg',
  });
  console.log('Cloudinary upload success!');
  console.log('Secure URL:', res.secure_url);
}

run().catch(console.error);
