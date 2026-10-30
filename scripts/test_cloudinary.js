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

async function test() {
  console.log('Testing Cloudinary config:', process.env.CLOUDINARY_CLOUD_NAME);
  try {
    const ping = await cloudinary.api.ping();
    console.log('Cloudinary ping response:', ping);
    
    // Check if coming-soon-perfume exists
    try {
      const res = await cloudinary.api.resource('utoorateazami/products/coming-soon-perfume');
      console.log('Resource found:', res.secure_url);
    } catch (e) {
      console.log('Resource utoorateazami/products/coming-soon-perfume NOT found on Cloudinary:', e.message);
    }

    // List some existing resources in utoorateazami
    const list = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'utoorateazami',
      max_results: 15,
    });
    console.log(`Found ${list.resources.length} resources in utoorateazami:`);
    list.resources.forEach(r => console.log(' - ' + r.public_id + ' (' + r.secure_url + ')'));
  } catch (err) {
    console.error('Cloudinary error:', err);
  }
}

test();
