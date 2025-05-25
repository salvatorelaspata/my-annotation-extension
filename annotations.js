document.addEventListener('DOMContentLoaded', function () {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const messageName = el.getAttribute('data-i18n');
    el.textContent = chrome.i18n.getMessage(messageName);
  });

  // Aggiorna anche il titolo della pagina
  document.title = chrome.i18n.getMessage("myAnnotationsTitle");
  const urlSelect = document.getElementById('url-select');
  const annotationList = document.getElementById('annotation-list');
  const refreshBtn = document.getElementById('refresh-btn');
  const clearAllBtn = document.getElementById('clear-all-btn');

  let currentUrls = [];
  let currentAnnotations = {};
  let activeTabUrl = '';

  // Available colors for highlights and shapes
  const highlightColors = ['yellow', 'lightgreen', 'lightblue', 'pink'];
  const shapeColors = ['red', 'green', 'blue', 'orange'];
  const shapeTypes = ['rectangle', 'circle', 'line'];

  // Initialize the page
  initPage();

  // Event listeners
  urlSelect.addEventListener('change', displayAnnotationsForUrl);
  refreshBtn.addEventListener('click', refreshAnnotations);
  clearAllBtn.addEventListener('click', clearAllAnnotations);

  async function initPage() {
    // Get the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      if (tabs && tabs[0]) {
        activeTabUrl = tabs[0].url;
        await loadAllAnnotations();
      }
    });
  }

  async function loadAllAnnotations() {
    // Get all saved annotations from chrome.storage.local
    chrome.storage.local.get(null, function (items) {
      currentAnnotations = {};
      currentUrls = [];

      // Filter out non-annotation items (those that don't have array values)
      for (const [key, value] of Object.entries(items)) {
        if (Array.isArray(value) && value.length > 0) {
          currentUrls.push(key);
          currentAnnotations[key] = value;
        }
      }

      // Populate the URL dropdown
      populateUrlSelect();

      // Display annotations for the first URL or the current URL if it exists
      if (currentUrls.includes(activeTabUrl)) {
        urlSelect.value = activeTabUrl;
      }
      displayAnnotationsForUrl();
    });
  }

  function populateUrlSelect() {
    // Clear the dropdown
    urlSelect.innerHTML = '';

    // Add each URL as an option
    currentUrls.sort().forEach(url => {
      const option = document.createElement('option');
      option.value = url;
      // Try to get the page title or use the URL
      option.textContent = url;
      urlSelect.appendChild(option);
    });

    // If no URLs, display a message
    if (currentUrls.length === 0) {
      const option = document.createElement('option');
      option.textContent = chrome.i18n.getMessage("noPagesWithAnnotations");
      option.disabled = true;
      urlSelect.appendChild(option);
      urlSelect.disabled = true;
    } else {
      urlSelect.disabled = false;
    }
  }

  function displayAnnotationsForUrl() {
    const url = urlSelect.value;
    const annotations = currentAnnotations[url] || [];

    // Clear the annotation list
    annotationList.innerHTML = '';

    if (annotations.length === 0) {
      annotationList.innerHTML = `<div class="empty-state">${chrome.i18n.getMessage("noAnnotationsForPage")}</div>`;
      return;
    }

    // Sort annotations by timestamp (newest first)
    annotations.sort((a, b) => b.timestamp - a.timestamp);

    // Display each annotation
    annotations.forEach(annotation => {
      const item = document.createElement('div');
      item.className = 'annotation-item';
      item.dataset.id = annotation.id;

      const type = document.createElement('div');
      type.className = 'annotation-type';

      const content = document.createElement('div');
      content.className = 'annotation-content';

      const meta = document.createElement('div');
      meta.className = 'annotation-meta';

      const date = new Date(annotation.timestamp);
      meta.textContent = date.toLocaleString();

      const actions = document.createElement('div');
      actions.className = 'annotation-actions';

      if (annotation.type === 'highlight') {
        type.textContent = chrome.i18n.getMessage("textHighlight");

        // Display the highlighted text
        const textSpan = document.createElement('span');
        textSpan.className = 'highlight-sample';
        textSpan.textContent = annotation.text || chrome.i18n.getMessage("selectedText");
        textSpan.style.backgroundColor = annotation.color;
        content.appendChild(textSpan);

        // Color picker for highlight
        const colorPicker = createColorPicker(highlightColors, annotation.color, 'highlight', annotation.id);
        actions.appendChild(colorPicker);
      } else if (annotation.type === 'shape') {
        const shapeLabel = chrome.i18n.getMessage("shapeLabel", [chrome.i18n.getMessage(annotation.shapeType + "Shape")]);
        type.textContent = shapeLabel;

        // Show a sample of the shape
        const shapeSample = document.createElement('div');
        shapeSample.className = 'shape-sample';

        if (annotation.shapeType === 'rectangle') {
          shapeSample.style.border = `2px solid ${annotation.color}`;
          shapeSample.style.backgroundColor = `${annotation.color}33`;
        } else if (annotation.shapeType === 'circle') {
          shapeSample.style.border = `2px solid ${annotation.color}`;
          shapeSample.style.backgroundColor = `${annotation.color}33`;
          shapeSample.style.borderRadius = '50%';
        } else if (annotation.shapeType === 'line') {
          shapeSample.style.backgroundColor = annotation.color;
          shapeSample.style.height = '2px';
          shapeSample.style.marginTop = '9px';
        }

        content.appendChild(shapeSample);
        const positionLabel = chrome.i18n.getMessage("positionLabel", [annotation.left, annotation.top]);
        content.appendChild(document.createTextNode(positionLabel));

        // Shape type selector
        const shapeTypeSelect = document.createElement('select');
        shapeTypeSelect.className = 'shape-type-select';

        shapeTypes.forEach(type => {
          const option = document.createElement('option');
          option.value = type;
          option.textContent = chrome.i18n.getMessage(type + "Shape");
          if (type === annotation.shapeType) {
            option.selected = true;
          }
          shapeTypeSelect.appendChild(option);
        });

        shapeTypeSelect.addEventListener('change', function () {
          updateAnnotation(annotation.id, url, { shapeType: this.value });
        });

        actions.appendChild(shapeTypeSelect);

        // Color picker for shape
        const colorPicker = createColorPicker(shapeColors, annotation.color, 'shape', annotation.id);
        actions.appendChild(colorPicker);
      }

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = chrome.i18n.getMessage("deleteButton");
      deleteBtn.className = 'danger';
      deleteBtn.addEventListener('click', function () {
        deleteAnnotation(annotation.id, url);
      });
      actions.appendChild(deleteBtn);

      item.appendChild(type);
      item.appendChild(content);
      item.appendChild(meta);
      item.appendChild(actions);

      annotationList.appendChild(item);
    });
  }

  function createColorPicker(colors, selectedColor, type, annotationId) {
    const colorPicker = document.createElement('div');
    colorPicker.className = 'color-picker';

    colors.forEach(color => {
      const colorOption = document.createElement('div');
      colorOption.className = 'color-option';
      if (color === selectedColor) {
        colorOption.className += ' selected';
      }
      colorOption.style.backgroundColor = color;
      colorOption.dataset.color = color;

      colorOption.addEventListener('click', function () {
        // Update the UI
        colorPicker.querySelectorAll('.color-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        this.classList.add('selected');

        // Update the annotation
        const url = urlSelect.value;
        updateAnnotation(annotationId, url, { color: color });
      });

      colorPicker.appendChild(colorOption);
    });

    return colorPicker;
  }

  function deleteAnnotation(annotationId, url) {
    if (confirm(chrome.i18n.getMessage("confirmDeleteAnnotation"))) {
      // If it's the active tab, send a message to the content script
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0] && tabs[0].url === url) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'deleteAnnotation',
            annotationId: annotationId
          }, function () {
            // Refresh the annotations after deletion
            refreshAnnotations();
          });
        } else {
          // If not the active tab, update storage directly
          const annotations = currentAnnotations[url] || [];
          const index = annotations.findIndex(a => a.id === annotationId);
          if (index !== -1) {
            annotations.splice(index, 1);

            // Update storage and refresh the display
            chrome.storage.local.set({ [url]: annotations }, function () {
              currentAnnotations[url] = annotations;
              displayAnnotationsForUrl();
            });
          }
        }
      });
    }
  }

  function updateAnnotation(annotationId, url, updates) {
    // If it's the active tab, send a message to the content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0] && tabs[0].url === url) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateAnnotation',
          annotationId: annotationId,
          updates: updates
        }, function () {
          // Refresh the annotations after update
          refreshAnnotations();
        });
      } else {
        // If not the active tab, update storage directly
        const annotations = currentAnnotations[url] || [];
        const index = annotations.findIndex(a => a.id === annotationId);
        if (index !== -1) {
          annotations[index] = { ...annotations[index], ...updates };

          // Update storage and refresh the display
          chrome.storage.local.set({ [url]: annotations }, function () {
            currentAnnotations[url] = annotations;
            displayAnnotationsForUrl();
          });
        }
      }
    });
  }

  function refreshAnnotations() {
    loadAllAnnotations();
  }

  function clearAllAnnotations() {
    if (confirm(chrome.i18n.getMessage("confirmClearAllAnnotations"))) {
      const url = urlSelect.value;

      // If it's the active tab, send a message to the content script
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0] && tabs[0].url === url) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'clearAnnotations'
          }, function () {
            // Refresh the annotations after clearing
            refreshAnnotations();
          });
        } else {
          // If not the active tab, clear from storage directly
          chrome.storage.local.remove(url, function () {
            delete currentAnnotations[url];
            currentUrls = currentUrls.filter(u => u !== url);

            // If no more URLs, update the dropdown
            populateUrlSelect();
            displayAnnotationsForUrl();
          });
        }
      });
    }
  }
});
