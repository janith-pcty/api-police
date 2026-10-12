(function () {
  const api = typeof browser !== 'undefined' ? browser : chrome;

  function pushState() {
    api.storage.local.get(['rules', 'globalEnabled']).then((data) => {
      window.postMessage(
        {
          source: 'api-response-modder',
          type: 'rules-update',
          rules: data.rules || [],
          globalEnabled: data.globalEnabled !== false,
        },
        '*'
      );
    });
  }

  pushState();

  api.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.rules || changes.globalEnabled)) {
      pushState();
    }
  });
})();
