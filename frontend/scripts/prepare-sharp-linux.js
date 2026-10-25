'use strict'

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const targetDir = path.resolve(__dirname, '../node_modules/@img')
const tmpDir = path.resolve(__dirname, '../node_modules/@img/.tmp_unpack')

fs.mkdirSync(tmpDir, { recursive: true })

console.log('Packing sharp Linux packages for frontend...')
execSync('npm pack @img/sharp-linux-x64@0.34.5 @img/sharp-libvips-linux-x64@1.2.4', {
  cwd: tmpDir,
  stdio: 'inherit',
})

console.log('Extracting to @img...')
const tar = process.platform === 'win32' ? 'tar.exe' : 'tar'
for (const file of fs.readdirSync(tmpDir)) {
  if (file.endsWith('.tgz')) {
    const pkgName = file.includes('libvips') ? 'sharp-libvips-linux-x64' : 'sharp-linux-x64'
    const dest = path.join(targetDir, pkgName)
    fs.rmSync(dest, { recursive: true, force: true })
    fs.mkdirSync(dest, { recursive: true })
    execSync(`${tar} -xzf "${path.join(tmpDir, file)}" -C "${dest}" --strip-components=1`, {
      stdio: 'inherit',
    })
    console.log(`✓ Extracted ${pkgName}`)
  }
}

fs.rmSync(tmpDir, { recursive: true, force: true })
console.log('Frontend Sharp Linux dependencies prepared successfully!')
