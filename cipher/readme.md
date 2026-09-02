# Cipher

A minimalist classical cipher tool that runs entirely in your browser. Encode and decode text using three historical encryption methods, with a live alphabet mapper that shows you exactly which letters shift where as you change settings.

No backend. No build step. No data leaves the page.

---

## Ciphers included

**Caesar**
Shifts every letter forward by a fixed number. Choose any shift from 1 to 25. Julius Caesar reportedly used a shift of 3, turning A into D, B into E, and so on.

**ROT13**
A Caesar cipher fixed at a shift of 13. Because 13 plus 13 equals 26 and the alphabet has 26 letters, applying ROT13 twice returns the original text. Widely used online to hide spoilers and punchlines.

**Vigenere**
Uses a repeating keyword to apply a different shift to each letter. A key of "cat" shifts the first letter by 2 (c), the second by 0 (a), the third by 19 (t), then repeats from the beginning. Significantly harder to break by hand than a simple Caesar cipher.

---

## The alphabet mapper

The strip between the controls and the text panels shows the live letter-to-letter mapping under your current settings. It updates the moment you change the shift value, switch ciphers, or toggle between encode and decode. The first four letters are highlighted as a worked example. It is hidden for Vigenere because the mapping changes per position.

---

## How to use it

1. Pick a cipher from the three tabs at the top
2. Set your shift amount (Caesar) or type a keyword (Vigenere)
3. Choose encode or decode
4. Type or paste text in the left panel
5. The transformed result appears on the right, with a brief scramble animation as it settles
6. Press copy to take the output elsewhere

The load sample button drops in a random phrase if you want to try it quickly without typing.

---

## Running locally

Open `index.html` directly in any modern browser. There is no build step and no package to install.

```bash
git clone https://github.com/yourusername/mini-projects.git
cd mini-projects/cipher
open index.html
```

For GitHub Pages, the project will be available at:
```
https://yourusername.github.io/mini-projects/cipher/
```

---

## Tech

Plain HTML, CSS, and JavaScript. No libraries, no frameworks, no build tools. The only external dependency is Google Fonts, loaded over HTTPS.

Fonts used:
- Space Grotesk (weights 300, 400, 500, 600) for all UI text
- Cormorant Garamond italic for single-word typographic emphasis

---

## Palette

| Role | Hex |
|------|-----|
| Background text, panels | `#FAF6EA` |
| Alphabet mapper accent | `#E4F1AF` |
| Output text, active states | `#5DB996` |
| Buttons, active tab, borders | `#108B4F` |

---

## Notes

These are historical teaching ciphers from the era of handwritten messages and wax seals. They are not modern encryption. Do not use them to protect anything that actually matters. They exist here for learning, puzzle solving, and curiosity about how people kept secrets before computers.

---

## License

MIT
