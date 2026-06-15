# QR Studio

A clean, dependency-free QR code generator that runs entirely in your browser. No sign-up, no cloud, no tracking — paste your content, customize the look, and download.

## ✨ Features

- 📝 Multiple content types: **Text**, **URL**, **Phone**, **Wi-Fi**, and **Raw/Custom** (vCard, geo, mailto, etc.)
- 🎨 Customizable foreground and background colors
- 📐 Adjustable output size and quiet margin
- 🛡️ Selectable error correction level (L, M, Q, H)
- 🌗 Light/dark theme toggle (saved across visits)
- 📋 Copy encoded content to clipboard
- ⬇️ Download as **PNG** or **SVG**
- ⚡ Zero dependencies — QR encoding implemented from scratch in plain JavaScript

## 🧰 Tech Stack

- HTML5, CSS3, vanilla JavaScript
- Custom QR code encoder (`qrcode.js`) implementing the ISO/IEC 18004 standard — byte mode, versions 1–10, all four error correction levels, with Reed–Solomon error correction and optimal mask selection

## 📁 Project Structure

```
qr-studio/
├── index.html     # Page structure and generator UI
├── style.css      # Styling and theming
├── qrcode.js       # QR code encoding engine (ISO/IEC 18004)
└── script.js       # UI logic, rendering, and export
```

## 🚀 Usage

No build step or server required.

1. Clone or download the repository:
   ```bash
   git clone https://github.com/MadhurjyaBaruah/mini-projects.git
   cd mini-projects/qr-studio
   ```
2. Open `index.html` in your browser (or serve it with any static file server).
3. Choose a content type (Text, URL, Phone, Wi-Fi, or Raw).
4. Fill in the details, adjust size, margin, error correction, and colors.
5. Click **Generate**.
6. Download the result as **PNG** or **SVG**, or copy the encoded content.

## 🔍 How It Works

`qrcode.js` builds the QR matrix from scratch:

- Encodes input as UTF-8 bytes in byte mode
- Selects the smallest QR version (1–10) that fits the data at the chosen error correction level
- Applies Reed–Solomon error correction
- Places finder, alignment, and timing patterns
- Tests all 8 mask patterns and picks the one with the lowest penalty score
- Returns a boolean matrix that `script.js` renders to a `<canvas>` and exports as PNG/SVG

## 🌐 Browser Support

Works in any modern browser supporting Canvas, `<input type="color">`, and the Clipboard API.

## 📄 License

Part of the [mini-projects](https://github.com/MadhurjyaBaruah/mini-projects) repository.
