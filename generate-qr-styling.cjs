const { QRCodeCanvas } = require('qr-code-styling-node/lib/qrcode.js');
const fs = require('fs');

async function generate() {
    try {
        const qrCode = new QRCodeCanvas({
            width: 1024,
            height: 1024,
            data: "https://dropsiders.com",
            image: "./public/Logo.png",
            margin: 10,
            qrOptions: {
                typeNumber: 0,
                mode: "Byte",
                errorCorrectionLevel: "H"
            },
            imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.4,
                margin: 20
            },
            dotsOptions: {
                type: "rounded", // rounded dots!
                color: "#ff0033" // dropsiders neon red
            },
            backgroundOptions: {
                color: "#000000", // black background
            },
            cornersSquareOptions: {
                type: "extra-rounded",
                color: "#ff0033"
            },
            cornersDotOptions: {
                type: "dot",
                color: "#ff0033"
            }
        });

        // The lib allows calling toBuffer() or similar
        const buffer = await qrCode.toBuffer("png");
        fs.writeFileSync("./public/dropsiders_qr_rounded.png", buffer);
        console.log("Rounded QR Code with black background saved to ./public/dropsiders_qr_rounded.png");
    } catch (err) {
        console.error(err);
    }
}

generate();
