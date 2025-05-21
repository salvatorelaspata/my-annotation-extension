# My Annotation Extension

This is a simple extension for annotating text in the browser. It allows you to highlight text and add notes to it. The annotations are stored in the browser's local storage, so they will persist even after you close the browser.

## Features

- Highlight text
- Add notes to highlighted text
- View all annotations
- Delete annotations
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

1. Highlight the text you want to annotate.
2. Click the extension icon in the browser toolbar to open the popup.
3. Enter your note in the text area and click "Save" to save the annotation.
4. To view all annotations, click the "View Annotations" button in the popup.
5. To delete an annotation, click the "Delete" button next to the annotation in the list.
6. To clear all annotations, click the "Clear All" button in the popup.
7. To edit an annotation, click the "Edit" button next to the annotation in the list, make your changes, and click "Save".
8. To highlight text, select the text and click the "Highlight" button in the popup.
9. To remove the highlight, select the highlighted text and click the "Remove Highlight" button in the popup.
10. To view the highlighted text, click the "View Highlights" button in the popup.
11. To remove all highlights, click the "Remove All Highlights" button in the popup.

## Credits

Icon application by [Grok](https://x.com/i/grok)

First implementation by [Google AI Studio](https://aistudio.google.com/)

## Contributing

If you want to contribute to this project, feel free to open an issue or submit a pull request. Any contributions are welcome!

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Chrome Extensions](https://developer.chrome.com/docs/extensions)