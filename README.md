# My Annotation Extension

This is a simple extension for annotating text in the browser. It allows you to highlight text and add notes to it. The annotations are stored in the browser's local storage, so they will persist even after you close the browser.

## Features

- Highlight text
- Draw shapes (rectangle, circle, line)
- View all annotations
- Edit annotation colors and shapes
- Delete individual annotations
- Clear all annotations

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/my-annotation-extension.git
   cd my-annotation-extension
   ```
2. Load the extension in your browser:
    - For Chrome:
      1. Open Chrome and go to `chrome://extensions/`
      2. Enable "Developer mode" in the top right corner
      3. Click "Load unpacked" and select the `my-annotation-extension` directory
    - For Firefox:
      1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
      2. Click "Load Temporary Add-on" and select the `manifest.json` file in the `my-annotation-extension` directory
    - For Edge:
      1. Open Edge and go to `edge://extensions/`
      2. Enable "Developer mode" in the top right corner
      3. Click "Load unpacked" and select the `my-annotation-extension` directory
    - For Safari:
      1. Open Safari and go to `Develop > Show Extension Builder`
      2. Click the "+" button and select "Add Extension"
      3. Select the `my-annotation-extension` directory
      4. Click "Install" to install the extension
3. Open the extension popup by clicking the extension icon in the browser toolbar.
4. Start annotating text on any webpage!

## Usage

1. Highlight the text you want to annotate by selecting it when in "Highlight Text" mode.
2. Draw shapes by clicking and dragging when in "Draw Shape" mode.
3. To view all annotations, click the "View Annotations" button in the popup.
4. In the annotations view, you can:
   - See all pages with annotations
   - Edit the color of highlights and shapes
   - Change the shape type
   - Delete individual annotations
   - Clear all annotations for a page
5. To delete an annotation, click the "Delete" button next to the annotation in the list.
6. To clear all annotations on the current page, click the "Clear Annotations" button.

## Credits

Icon application by [Grok](https://x.com/i/grok)

First implementation by [Google AI Studio](https://aistudio.google.com/)

## Contributing

If you want to contribute to this project, feel free to open an issue or submit a pull request. Any contributions are welcome!

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Chrome Extensions](https://developer.chrome.com/docs/extensions)