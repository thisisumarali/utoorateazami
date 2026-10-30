const https = require('https');

const urls = [
  'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214150/utoorateazami/fbztgsjrb8waxskodrrw.jpg',
  'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214109/utoorateazami/yyl7ugkseajb4su7tdks.jpg',
  'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214148/utoorateazami/klca1a35cqgolxf7fxcd.jpg',
  'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214130/utoorateazami/d737dde3zfxxhpnkdeoa.png',
  'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214133/utoorateazami/f1ewuk9jii6ixb3h1gsa.jpg',
  'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214146/utoorateazami/aolnsv4n3am5ahyx0xrl.jpg',
];

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, statusCode: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', (e) => {
      resolve({ url, error: e.message });
    });
  });
}

async function run() {
  for (const u of urls) {
    const res = await checkUrl(u);
    console.log(`${res.statusCode} - ${res.contentType} - ${res.url}`);
  }
}
run();
