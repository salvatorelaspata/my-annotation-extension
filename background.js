// Ascolta l'evento di cambio tab e ripristina la modalità a "browse"
chrome.tabs.onActivated.addListener(function (activeInfo) {
  // Imposta la modalità annotazione a "browse" nello storage
  chrome.storage.local.set({ annotationMode: 'browse' }, function () {
    // Dopo aver impostato lo storage, notifica il content script nella tab attiva
    chrome.tabs.sendMessage(activeInfo.tabId, { action: "setMode", mode: "browse" }, function (response) {
      // Gestisce eventuali errori silenziosamente (se il content script non è ancora caricato)
      if (chrome.runtime.lastError) {
        console.log("Tab non ancora pronta per ricevere messaggi");
      }
    });
  });
});

// Ascolta anche l'evento di navigazione nella stessa tab (cambio pagina)
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // Verifica che la pagina sia completamente caricata
  if (changeInfo.status === 'complete') {
    // Imposta la modalità annotazione a "browse" nello storage
    chrome.storage.local.set({ annotationMode: 'browse' }, function () {
      // Notifica il content script
      chrome.tabs.sendMessage(tabId, { action: "setMode", mode: "browse" }, function (response) {
        // Gestisce eventuali errori silenziosamente
        if (chrome.runtime.lastError) {
          console.log("Tab non ancora pronta per ricevere messaggi");
        }
      });
    });
  }
});
