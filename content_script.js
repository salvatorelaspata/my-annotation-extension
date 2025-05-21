let currentMode = 'highlight'; // Default mode
let isDrawing = false;
let startX, startY;
let currentRect = null;
let annotationContainer = null; // Div per contenere le annotazioni
let highlightColor = 'yellow'; // Colore default per l'evidenziatura
let shapeColor = 'red'; // Colore default per la forma
let shapeType = 'rectangle'; // Tipo di forma default
let pageAnnotations = []; // Array per memorizzare le annotazioni della pagina corrente

// Funzione per creare il contenitore delle annotazioni se non esiste
function ensureAnnotationContainer() {
  if (!annotationContainer) {
    annotationContainer = document.createElement('div');
    annotationContainer.id = 'chrome-annotation-container';
    annotationContainer.style.position = 'absolute';
    annotationContainer.style.top = '0';
    annotationContainer.style.left = '0';
    annotationContainer.style.width = '100%';
    annotationContainer.style.height = '100%';
    annotationContainer.style.pointerEvents = 'none'; // Non blocca gli eventi del mouse sottostanti
    annotationContainer.style.zIndex = '9999'; // Assicurati che sia sopra la pagina
    document.body.appendChild(annotationContainer);
  }
}

// Funzione per salvare le annotazioni per l'URL corrente
function saveAnnotations() {
  // Ensure all annotations have unique IDs
  pageAnnotations.forEach(annotation => {
    if (!annotation.id) {
      annotation.id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
  });

  const currentUrl = window.location.href;
  chrome.storage.local.set({ [currentUrl]: pageAnnotations }, function () {
    console.log('Annotations saved for', currentUrl);
  });
}

// Funzione per caricare le annotazioni per l'URL corrente
function loadAnnotations() {
  const currentUrl = window.location.href;
  chrome.storage.local.get([currentUrl], function (result) {
    if (result[currentUrl]) {
      pageAnnotations = result[currentUrl];
      renderSavedAnnotations();
    }
  });
}

// Funzione per renderizzare le annotazioni salvate
function renderSavedAnnotations() {
  ensureAnnotationContainer();

  pageAnnotations.forEach(annotation => {
    if (annotation.type === 'highlight') {
      // Ricrea le evidenziazioni
      const range = document.createRange();
      const startNode = findTextNodeAtPosition(annotation.startXPath, annotation.startOffset);
      const endNode = findTextNodeAtPosition(annotation.endXPath, annotation.endOffset);

      if (startNode && endNode) {
        range.setStart(startNode.node, startNode.offset);
        range.setEnd(endNode.node, endNode.offset);

        const span = document.createElement('span');
        span.style.backgroundColor = annotation.color;
        span.style.pointerEvents = 'none';
        span.setAttribute('data-annotation-type', 'highlight');

        try {
          range.surroundContents(span);
        } catch (e) {
          console.warn("Could not restore highlight annotation:", e);
        }
      }
    } else if (annotation.type === 'shape') {
      // Ricrea le forme
      const shape = document.createElement('div');
      shape.style.position = 'absolute';
      shape.style.left = annotation.left;
      shape.style.top = annotation.top;
      shape.style.width = annotation.width;
      shape.style.height = annotation.height;
      shape.style.pointerEvents = 'none';
      shape.setAttribute('data-annotation-type', annotation.shapeType);

      if (annotation.shapeType === 'rectangle') {
        shape.style.border = `2px solid ${annotation.color}`;
        shape.style.backgroundColor = `${annotation.color}33`;
      } else if (annotation.shapeType === 'circle') {
        shape.style.border = `2px solid ${annotation.color}`;
        shape.style.backgroundColor = `${annotation.color}33`;
        shape.style.borderRadius = '50%';
      } else if (annotation.shapeType === 'line') {
        shape.style.backgroundColor = annotation.color;
        shape.style.transform = annotation.transform;
        shape.style.transformOrigin = 'top left';
      }

      annotationContainer.appendChild(shape);
    }
  });
}

// Helper per trovare un nodo di testo usando XPath
function findTextNodeAtPosition(xpath, offset) {
  try {
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const node = result.singleNodeValue;
    if (node && node.nodeType === Node.TEXT_NODE) {
      return { node, offset };
    }
  } catch (e) {
    console.error("XPath evaluation failed:", e);
  }
  return null;
}

// Helper per ottenere XPath di un nodo
function getXPathForNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentNode;
    if (!parent) return '';

    let index = 0;
    for (let i = 0; i < parent.childNodes.length; i++) {
      const child = parent.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE) {
        index++;
      }
      if (child === node) {
        return getXPathForNode(parent) + '/text()[' + index + ']';
      }
    }
  }

  if (node === document.body) return '/html/body';

  let nodeIndex = 1;
  for (let sibling = node.previousSibling; sibling; sibling = sibling.previousSibling) {
    if (sibling.nodeName === node.nodeName) {
      nodeIndex++;
    }
  }

  return getXPathForNode(node.parentNode) + '/' + node.nodeName.toLowerCase() + '[' + nodeIndex + ']';
}

// Carica la modalità e le preferenze salvate all'avvio dello script di contenuto
chrome.storage.local.get(['annotationMode', 'highlightColor', 'shapeColor', 'shapeType'], function (result) {
  currentMode = result.annotationMode || 'highlight';
  highlightColor = result.highlightColor || 'yellow';
  shapeColor = result.shapeColor || 'red';
  shapeType = result.shapeType || 'rectangle';

  // Carica le annotazioni salvate dopo che la pagina è completamente caricata
  if (document.readyState === 'complete') {
    loadAnnotations();
  } else {
    window.addEventListener('load', loadAnnotations);
  }
});

// Funzione per cancellare tutte le annotazioni
function clearAllAnnotations() {
  // Rimuove tutte le annotazioni di forma dal contenitore
  if (annotationContainer) {
    while (annotationContainer.firstChild) {
      annotationContainer.removeChild(annotationContainer.firstChild);
    }
  }

  // Rimuove tutte le evidenziature di testo
  const highlights = document.querySelectorAll('span[data-annotation-type="highlight"]');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    // Sposta i nodi figlio (testo originale) fuori dal tag span
    while (highlight.firstChild) {
      parent.insertBefore(highlight.firstChild, highlight);
    }
    parent.removeChild(highlight);
  });

  // Svuota l'array delle annotazioni
  pageAnnotations = [];

  // Aggiorna lo storage
  saveAnnotations();
}

// Function to delete a specific annotation by ID
function deleteAnnotation(annotationId) {
  const index = pageAnnotations.findIndex(annotation => annotation.id === annotationId);
  if (index !== -1) {
    // Remove the annotation from the array
    pageAnnotations.splice(index, 1);
    // Save the updated annotations
    saveAnnotations();
    // Re-render the annotations
    clearAllAnnotations();
    renderSavedAnnotations();
  }
}

// Function to update a specific annotation
function updateAnnotation(annotationId, updates) {
  const index = pageAnnotations.findIndex(annotation => annotation.id === annotationId);
  if (index !== -1) {
    // Apply updates to the annotation
    pageAnnotations[index] = { ...pageAnnotations[index], ...updates };
    // Save the updated annotations
    saveAnnotations();
    // Re-render the annotations
    clearAllAnnotations();
    renderSavedAnnotations();
  }
}

// Listener for i messaggi dal popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "setMode") {
    currentMode = request.mode;
  } else if (request.action === "setHighlightColor") {
    highlightColor = request.color;
  } else if (request.action === "setShapeColor") {
    shapeColor = request.color;
  } else if (request.action === "setShapeType") {
    shapeType = request.shapeType;
  } else if (request.action === "clearAnnotations") {
    clearAllAnnotations();
  } else if (request.action === "getAnnotations") {
    sendResponse({ annotations: pageAnnotations });
  } else if (request.action === "deleteAnnotation") {
    deleteAnnotation(request.annotationId);
    sendResponse({ success: true });
  } else if (request.action === "updateAnnotation") {
    updateAnnotation(request.annotationId, request.updates);
    sendResponse({ success: true });
  }
});

// --- Logica per l'Evidenziazione ---
document.addEventListener('mouseup', function () {
  if (currentMode === 'highlight') {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.backgroundColor = highlightColor;
      span.style.pointerEvents = 'none'; // Non interferire con la selezione futura
      span.setAttribute('data-annotation-type', 'highlight');

      // Salva informazioni sull'highlight prima di modificare il DOM
      const startNode = range.startContainer;
      const endNode = range.endContainer;
      const startXPath = getXPathForNode(startNode);
      const endXPath = getXPathForNode(endNode);
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;
      const text = selection.toString();

      try {
        range.surroundContents(span);

        // Salva l'annotazione con ID unico
        pageAnnotations.push({
          id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          type: 'highlight',
          color: highlightColor,
          text: text,
          startXPath: startXPath,
          endXPath: endXPath,
          startOffset: startOffset,
          endOffset: endOffset,
          timestamp: Date.now()
        });

        saveAnnotations();
      } catch (e) {
        // Questo può accadere se la selezione non è continua (es. più paragrafi)
        console.warn("Could not surround selection directly:", e);
        // Alternativa: creare un marker per ogni nodo di testo nella selezione
        if (typeof selection.getNodes === 'function') {
          const nodes = selection.getNodes();
          nodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
              const parentSpan = document.createElement('span');
              parentSpan.style.backgroundColor = highlightColor;
              parentSpan.style.pointerEvents = 'none';
              parentSpan.setAttribute('data-annotation-type', 'highlight');
              node.parentNode.insertBefore(parentSpan, node);
              parentSpan.appendChild(node);
            }
          });
        }
      }
      selection.removeAllRanges(); // Deseleziona il testo
    }
  }
});

// --- Logica per il Disegno delle Forme ---
document.addEventListener('mousedown', function (e) {
  if (currentMode === 'draw' && e.button === 0) { // Solo click sinistro
    ensureAnnotationContainer();
    isDrawing = true;
    startX = e.pageX;
    startY = e.pageY;

    // Calcola lo scroll offset per posizionare correttamente l'elemento sulla pagina
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Crea l'elemento in base al tipo di forma selezionato
    if (shapeType === 'rectangle') {
      currentRect = document.createElement('div');
      currentRect.style.position = 'absolute';
      currentRect.style.border = `2px solid ${shapeColor}`;
      currentRect.style.backgroundColor = `${shapeColor}33`; // 20% opacità
      currentRect.style.pointerEvents = 'none';
      currentRect.setAttribute('data-annotation-type', 'rectangle');
      currentRect.style.left = `${startX}px`;
      currentRect.style.top = `${startY}px`;
      currentRect.style.width = '0px';
      currentRect.style.height = '0px';
    } else if (shapeType === 'circle') {
      currentRect = document.createElement('div');
      currentRect.style.position = 'absolute';
      currentRect.style.border = `2px solid ${shapeColor}`;
      currentRect.style.backgroundColor = `${shapeColor}33`; // 20% opacità
      currentRect.style.borderRadius = '50%';
      currentRect.style.pointerEvents = 'none';
      currentRect.setAttribute('data-annotation-type', 'circle');
      currentRect.style.left = `${startX}px`;
      currentRect.style.top = `${startY}px`;
      currentRect.style.width = '0px';
      currentRect.style.height = '0px';
    } else if (shapeType === 'line') {
      currentRect = document.createElement('div');
      currentRect.style.position = 'absolute';
      currentRect.style.backgroundColor = shapeColor;
      currentRect.style.pointerEvents = 'none';
      currentRect.setAttribute('data-annotation-type', 'line');
      currentRect.style.left = `${startX}px`;
      currentRect.style.top = `${startY}px`;
      currentRect.style.width = '2px'; // inizia con una linea verticale sottile
      currentRect.style.height = '0px';
      currentRect.style.transformOrigin = 'top left';
    }

    currentRect.style.left = `${startX + scrollLeft}px`;
    currentRect.style.top = `${startY + scrollTop}px`;

    annotationContainer.appendChild(currentRect);
  }
});

document.addEventListener('mousemove', function (e) {
  if (currentMode === 'draw' && isDrawing) {
    const currentX = e.pageX;
    const currentY = e.pageY;

    // Calcola lo scroll offset
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (shapeType === 'rectangle') {
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      currentRect.style.left = `${left + scrollLeft}px`;
      currentRect.style.top = `${top + scrollTop}px`;
      currentRect.style.width = `${width}px`;
      currentRect.style.height = `${height}px`;
    } else if (shapeType === 'circle') {
      const diameter = Math.max(
        Math.abs(currentX - startX),
        Math.abs(currentY - startY)
      );
      const left = startX - diameter / 2;
      const top = startY - diameter / 2;

      currentRect.style.left = `${left + scrollLeft}px`;
      currentRect.style.top = `${top + scrollTop}px`;
      currentRect.style.width = `${diameter}px`;
      currentRect.style.height = `${diameter}px`;
    } else if (shapeType === 'line') {
      // Calcola la lunghezza e l'angolo della linea
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

      currentRect.style.width = `${length}px`;
      currentRect.style.height = '2px'; // Spessore linea
      currentRect.style.transform = `rotate(${angle}deg)`;
    }
  }
});

document.addEventListener('mouseup', function (e) {
  if (currentMode === 'draw' && isDrawing) {
    isDrawing = false;

    // Salva l'annotazione della forma
    if (currentRect) {
      const rect = currentRect.getBoundingClientRect();
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      pageAnnotations.push({
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        type: 'shape',
        shapeType: shapeType,
        color: shapeColor,
        left: currentRect.style.left,
        top: currentRect.style.top,
        width: currentRect.style.width,
        height: currentRect.style.height,
        transform: currentRect.style.transform,
        timestamp: Date.now()
      });

      saveAnnotations();
    }

    currentRect = null; // Resetta il rettangolo corrente
  }
});

// Impedisci che la selezione del testo avvenga durante il disegno
document.addEventListener('selectstart', function (e) {
  if (currentMode === 'draw') {
    e.preventDefault();
  }
  // In browse mode, don't prevent text selection
});