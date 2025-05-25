document.addEventListener('DOMContentLoaded', function () {

  // Localizza tutti gli elementi con l'attributo data-i18n

  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const messageName = el.getAttribute('data-i18n');
    el.textContent = chrome.i18n.getMessage(messageName);
  });

  // Aggiorna anche il titolo della pagina
  document.title = chrome.i18n.getMessage("extName");


  const highlightBtn = document.getElementById('highlightBtn');
  const drawBtn = document.getElementById('drawBtn');
  const browseBtn = document.getElementById('browseBtn');
  const clearBtn = document.getElementById('clearBtn');
  const viewAnnotationsBtn = document.getElementById('viewAnnotationsBtn');
  const highlightOptions = document.getElementById('highlightOptions');
  const drawOptions = document.getElementById('drawOptions');
  const colorOptions = document.querySelectorAll('.color-option');
  const shapeColors = document.querySelectorAll('.shape-color');
  const shapeType = document.getElementById('shapeType');

  // Recupera la modalità corrente e le preferenze dallo storage locale
  chrome.storage.local.get(['annotationMode', 'highlightColor', 'shapeColor', 'shapeType'], function (result) {
    const currentMode = result.annotationMode || 'browse';
    const currentHighlightColor = result.highlightColor || 'yellow';
    const currentShapeColor = result.shapeColor || 'red';
    const currentShapeType = result.shapeType || 'rectangle';

    // Imposta la modalità attiva
    if (currentMode === 'highlight') {
      highlightBtn.classList.add('active');
      drawBtn.classList.remove('active');
      browseBtn.classList.remove('active');
      highlightOptions.classList.remove('hidden');
      drawOptions.classList.add('hidden');
    } else if (currentMode === 'draw') {
      drawBtn.classList.add('active');
      highlightBtn.classList.remove('active');
      browseBtn.classList.remove('active');
      drawOptions.classList.remove('hidden');
      highlightOptions.classList.add('hidden');
    } else if (currentMode === 'browse') {
      browseBtn.classList.add('active');
      highlightBtn.classList.remove('active');
      drawBtn.classList.remove('active');
      highlightOptions.classList.add('hidden');
      drawOptions.classList.add('hidden');
    }

    // Imposta il colore di evidenziatura attivo
    colorOptions.forEach(option => {
      if (option.getAttribute('data-color') === currentHighlightColor) {
        option.classList.add('active');
      }
    });

    // Imposta il colore della forma attivo
    shapeColors.forEach(color => {
      if (color.getAttribute('data-color') === currentShapeColor) {
        color.classList.add('active');
      }
    });

    // Imposta il tipo di forma selezionato
    shapeType.value = currentShapeType;
  });

  highlightBtn.addEventListener('click', function () {
    chrome.storage.local.set({ annotationMode: 'highlight' }, function () {
      highlightBtn.classList.add('active');
      drawBtn.classList.remove('active');
      browseBtn.classList.remove('active');
      highlightOptions.classList.remove('hidden');
      drawOptions.classList.add('hidden');
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "setMode", mode: "highlight" });
      });
    });
  });

  drawBtn.addEventListener('click', function () {
    chrome.storage.local.set({ annotationMode: 'draw' }, function () {
      drawBtn.classList.add('active');
      highlightBtn.classList.remove('active');
      browseBtn.classList.remove('active');
      drawOptions.classList.remove('hidden');
      highlightOptions.classList.add('hidden');
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "setMode", mode: "draw" });
      });
    });
  });

  // Add event listener for the browse button
  browseBtn.addEventListener('click', function () {
    chrome.storage.local.set({ annotationMode: 'browse' }, function () {
      browseBtn.classList.add('active');
      highlightBtn.classList.remove('active');
      drawBtn.classList.remove('active');
      highlightOptions.classList.add('hidden');
      drawOptions.classList.add('hidden');
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "setMode", mode: "browse" });
      });
    });
  });

  // Gestione del click sui colori di evidenziatura
  colorOptions.forEach(option => {
    option.addEventListener('click', function () {
      const color = this.getAttribute('data-color');

      // Rimuovi la classe active da tutte le opzioni
      colorOptions.forEach(opt => opt.classList.remove('active'));

      // Aggiungi la classe active all'opzione selezionata
      this.classList.add('active');

      // Salva la preferenza
      chrome.storage.local.set({ highlightColor: color }, function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "setHighlightColor", color: color });
        });
      });
    });
  });

  // Gestione del click sui colori delle forme
  shapeColors.forEach(color => {
    color.addEventListener('click', function () {
      const colorValue = this.getAttribute('data-color');

      // Rimuovi la classe active da tutti i colori
      shapeColors.forEach(c => c.classList.remove('active'));

      // Aggiungi la classe active al colore selezionato
      this.classList.add('active');

      // Salva la preferenza
      chrome.storage.local.set({ shapeColor: colorValue }, function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "setShapeColor", color: colorValue });
        });
      });
    });
  });

  // Gestione della selezione del tipo di forma
  shapeType.addEventListener('change', function () {
    const selectedShape = this.value;
    chrome.storage.local.set({ shapeType: selectedShape }, function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "setShapeType", shapeType: selectedShape });
      });
    });
  });

  // Gestione del click sul pulsante di cancellazione
  clearBtn.addEventListener('click', function () {
    if (confirm(chrome.i18n.getMessage("confirmClearAnnotations"))) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "clearAnnotations" });
      });
    }
  });

  // Handler for the View Annotations button
  viewAnnotationsBtn.addEventListener('click', function () {
    // Open the annotations page in a new tab
    chrome.tabs.create({ url: "annotations.html" });
  });
});