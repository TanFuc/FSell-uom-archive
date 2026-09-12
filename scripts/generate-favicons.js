const fs = require('fs')
const path = require('path')
const sharp = require('../backend/node_modules/sharp')

async function run() {
  const root = path.resolve(__dirname, '..')
  const samplePath = path.join(root, 'frontend/public/assets/svg-sample.jpg')
  const iconSvgPath = path.join(root, 'frontend/public/icon.svg')

  // Generate PNG buffer
  const pngBuffer = await sharp(samplePath).png().toBuffer()
  const b64 = pngBuffer.toString('base64')

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 150 150" width="150" height="150">
  <image width="150" height="150" href="data:image/png;base64,${b64}" xlink:href="data:image/png;base64,${b64}"/>
</svg>
`
  fs.writeFileSync(iconSvgPath, svgContent, 'utf8')
  console.log('Updated frontend/public/icon.svg successfully!')

  // Also create apple-touch-icon and icon.png for rich metadata
  await sharp(samplePath).resize(180, 180).png().toFile(path.join(root, 'frontend/public/apple-touch-icon.png'))
  await sharp(samplePath).resize(192, 192).png().toFile(path.join(root, 'frontend/public/icon-192.png'))
  await sharp(samplePath).resize(512, 512).png().toFile(path.join(root, 'frontend/public/icon-512.png'))
  console.log('Generated PNG icons (apple-touch-icon.png, icon-192.png, icon-512.png)!')
}

run().catch(console.error)
