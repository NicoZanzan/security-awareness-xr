// generate-qr.js
const QRCode = require('qrcode');

// Replace with your actual Vercel URL
const appUrl = 'https://security-awareness-ar.vercel.app';

QRCode.toFile('qr-code.png', appUrl, {
  width: 300,
  errorCorrectionLevel: 'H'
}, function(err) {
  if (err) throw err;
  console.log('QR code generated successfully as qr-code.png');
});