# Icon Requirements for Chrome Web Store

## Required Icon Sizes:

### Extension Icons (for manifest.json):
- **16x16 pixels** - Small icon (used in extensions page)
- **48x48 pixels** - Medium icon (used in extensions management page)
- **128x128 pixels** - Large icon (used in Chrome Web Store)

### Store Listing Images:
- **128x128 pixels** - Store icon (same as manifest icon)
- **440x280 pixels** - Small promotional tile (optional)
- **920x680 pixels** - Large promotional tile (optional)
- **1280x800 pixels** - Marquee promotional tile (optional)

### Screenshots:
- **1280x800 pixels** or **640x400 pixels** - At least 1 screenshot required
- Maximum 5 screenshots allowed

## Design Guidelines:

### Icon Design:
- Use PNG format with transparency
- High contrast and clear visibility
- Represent the extension's functionality
- Avoid text in icons (should be readable at 16x16)
- Follow Google's Material Design principles

### Color Scheme Suggestion:
- Primary: #10a37f (ChatGPT green)
- Secondary: #1a1a1a (Dark text)
- Accent: #f7f7f8 (Light background)

### Icon Concept for ChatGPT Clarity:
- Chat bubble with a clarity/lens symbol
- Brain icon with chat elements
- Message icon with extension/plugin symbol
- Lightbulb with chat bubble (representing insights)

## Files to Create:
1. `icon16.png` - 16x16 pixels
2. `icon48.png` - 48x48 pixels  
3. `icon128.png` - 128x128 pixels

## How to Create Icons:

### Option 1: Online Icon Generators
- [Canva](https://www.canva.com) - Use templates and resize
- [Figma](https://www.figma.com) - Design and export multiple sizes
- [Icon Generator](https://www.favicon-generator.org/) - Generate from one image

### Option 2: Design Tools
- Adobe Illustrator/Photoshop
- GIMP (free alternative)
- Sketch (Mac only)

### Option 3: AI Tools
- DALL-E, Midjourney, or Stable Diffusion
- Ask for: "Chrome extension icon for ChatGPT helper, clean minimal design, chat bubble with clarity symbol"

## Next Steps:
1. Create the three icon sizes
2. Save them in the `/icons` folder
3. Update manifest.json to reference these icons
4. Test the icons in Chrome extensions page