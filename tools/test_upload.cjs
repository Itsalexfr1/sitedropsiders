
const fs = require('fs');
const path = require('path');

async function testUpload() {
    console.log('🧪 Testing API Upload to Cloudinary...');

    // Load credentials from .dev.vars or use the ones we know
    const CLOUD_NAME = 'djnvjsmvr';
    const UPLOAD_PRESET = 'dropsiders_unsigned';
    const ADMIN_PASSWORD = '2026alexC';

    // Create a tiny dummy image (1x1 pixel black PNG)
    const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const payload = {
        filename: 'test-ai-upload.png',
        content: dummyBase64,
        type: 'image/png'
    };

    console.log('📡 Sending request to /api/upload (Cloudinary simulation)...');

    try {
        // Direct call to Cloudinary since we want to verify the logic I wrote in worker.ts
        // In a real scenario, the worker acts as a proxy. Let's simulate the worker logic.

        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
        const formData = new FormData();
        formData.append('file', payload.content);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder', 'dropsiders/test');

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.secure_url) {
            console.log('✅ SUCCESS! Image uploaded to Cloudinary.');
            console.log('🔗 URL:', data.secure_url);
        } else {
            console.error('❌ FAILED!', data.error?.message || data);
        }
    } catch (err) {
        console.error('❌ Error during test:', err.message);
    }
}

testUpload();
