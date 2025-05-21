let currentMode = 'highlight'; // Default mode
let isDrawing = false;
let startX, startY;
let currentRect = null;
let annotationContainer = null; // Div per contenere le annotazioni
let highlightColor = 'yellow'; // Colore default per l'evidenziatura
let shapeColor = 'red'; // Colore default per la forma
let shapeType = 'rectangle'; // Tipo di forma default

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

// Carica la modalità e le preferenze salvate all'avvio dello script di contenuto
chrome.storage.local.get(['annotationMode', 'highlightColor', 'shapeColor', 'shapeType'], function (result) {
  currentMode = result.annotationMode || 'highlight';
  highlightColor = result.highlightColor || 'yellow';
  shapeColor = result.shapeColor || 'red';
  shapeType = result.shapeType || 'rectangle';
});

// Listener per i messaggi dal popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "setMode") {
    currentMode = request.mode;
  } else if (request.action === "setHighlightColor") {
    highlightColor = request.color;
  } else if (request.action === "setShapeColor") {
    shapeColor = request.color;
  } else if (request.action === "setShapeType") {
    shapeType = request.shapeType;
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
      try {
        range.surroundContents(span);
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

document.addEventListener('mouseup', function () {
  if (currentMode === 'draw' && isDrawing) {
    isDrawing = false;
    currentRect = null; // Resetta il rettangolo corrente
  }
});

// Impedisci che la selezione del testo avvenga durante il disegno
document.addEventListener('selectstart', function (e) {
  if (currentMode === 'draw') {
    e.preventDefault();
  }
});