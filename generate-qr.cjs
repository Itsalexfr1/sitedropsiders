const QRCode = require('qrcode');
const { Jimp } = require('jimp'); // Depending on Jimp v1, wait, Jimp > 1.x might be different. Let's use old require('jimp') syntax if it's default 0.16.x or newer.
// Standard require:
let jimp;
try {
  jimp = require('jimp');
} catch(e) {
  jimp = require('jimp').default || require('jimp').Jimp; 
}


async function generate() {
    try {
        const qrPath = './qr_temp.png';
        
        // 1. Generate QR Code
        await QRCode.toFile(qrPath, 'https://dropsiders.com', {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 1024,
            color: {
                dark: '#ff0033',  // Dropsiders Red
                light: '#0a0a0a'  // Dark background
            }
        });

        // 2. Load QR Code and Logo into Jimp
        // Wait, jimp may be imported differently depending on verion.
        // let's use dynamic import if it's jimp v1
        const jimpModule = require('jimp');
        
        console.log("Reading qr code");
        const qrImage = await jimpModule.read(qrPath);
        
        console.log("Reading logo");
        const logo = await jimpModule.read('./public/Logo.png');

        // Resize logo to fit nicely in the center (approx 1/4th of QR code size, so 250x250)
        logo.resize({ w: 250 });
        
        // Calculate center coordinates
        const x = (qrImage.bitmap.width - logo.bitmap.width) / 2;
        const y = (qrImage.bitmap.height - logo.bitmap.height) / 2;

        // Composite logo onto QR code
        qrImage.composite(logo, x, y);

        // Save final result
        const outputPath = './public/Dropsiders-QRCode.png';
        await qrImage.write(outputPath);
        console.log('QR Code generated successfully at:', outputPath);

    } catch (err) {
        console.error('Error generating QR code:', err);
    }
}

generate();
