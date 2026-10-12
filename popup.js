const api = typeof browser !== 'undefined' ? browser : chrome;

const globalEnabledCheckbox = document.getElementById('globalEnabled');

api.storage.local.get('globalEnabled').then((data) => {
  globalEnabledCheckbox.checked = data.globalEnabled !== false;
});

globalEnabledCheckbox.addEventListener('change', () => {
  api.storage.local.set({ globalEnabled: globalEnabledCheckbox.checked });
});

document.getElementById('openManager').addEventListener('click', () => {
  api.tabs.create({ url: api.runtime.getURL('manager.html') });
});
