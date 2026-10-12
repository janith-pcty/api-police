const api = typeof browser !== 'undefined' ? browser : chrome;

const form = {
  ruleId: document.getElementById('ruleId'),
  urlPattern: document.getElementById('urlPattern'),
  matchType: document.getElementById('matchType'),
  method: document.getElementById('method'),
  status: document.getElementById('status'),
  contentType: document.getElementById('contentType'),
  body: document.getElementById('body'),
  enabled: document.getElementById('enabled'),
};

const formTitle = document.getElementById('formTitle');
const formError = document.getElementById('formError');
const rulesBody = document.getElementById('rulesBody');
const emptyState = document.getElementById('emptyState');

function loadRules() {
  return api.storage.local.get('rules').then((data) => data.rules || []);
}

function saveRules(rules) {
  return api.storage.local.set({ rules });
}

function resetForm() {
  form.ruleId.value = '';
  form.urlPattern.value = '';
  form.matchType.value = 'contains';
  form.method.value = 'ANY';
  form.status.value = '200';
  form.contentType.value = 'application/json';
  form.body.value = '';
  form.enabled.checked = true;
  formTitle.textContent = 'New Rule';
  formError.textContent = '';
}

function renderRules(rules) {
  rulesBody.innerHTML = '';
  emptyState.style.display = rules.length === 0 ? 'block' : 'none';

  rules.forEach((rule) => {
    const tr = document.createElement('tr');

    const enabledTd = document.createElement('td');
    const enabledCheckbox = document.createElement('input');
    enabledCheckbox.type = 'checkbox';
    enabledCheckbox.checked = rule.enabled;
    enabledCheckbox.addEventListener('change', async () => {
      const all = await loadRules();
      const target = all.find((r) => r.id === rule.id);
      target.enabled = enabledCheckbox.checked;
      await saveRules(all);
    });
    enabledTd.appendChild(enabledCheckbox);

    const methodTd = document.createElement('td');
    methodTd.textContent = rule.method;

    const patternTd = document.createElement('td');
    patternTd.className = 'pattern';
    patternTd.textContent = rule.urlPattern;

    const statusTd = document.createElement('td');
    statusTd.textContent = rule.status;

    const actionsTd = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.className = 'link';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => loadIntoForm(rule));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'link';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async () => {
      const all = await loadRules();
      await saveRules(all.filter((r) => r.id !== rule.id));
      refresh();
    });

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(enabledTd);
    tr.appendChild(methodTd);
    tr.appendChild(patternTd);
    tr.appendChild(statusTd);
    tr.appendChild(actionsTd);
    rulesBody.appendChild(tr);
  });
}

function loadIntoForm(rule) {
  form.ruleId.value = rule.id;
  form.urlPattern.value = rule.urlPattern;
  form.matchType.value = rule.matchType;
  form.method.value = rule.method;
  form.status.value = rule.status;
  form.contentType.value = rule.contentType;
  form.body.value = rule.body;
  form.enabled.checked = rule.enabled;
  formTitle.textContent = 'Edit Rule';
  formError.textContent = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function refresh() {
  const rules = await loadRules();
  renderRules(rules);
}

document.getElementById('saveRule').addEventListener('click', async () => {
  const urlPattern = form.urlPattern.value.trim();
  if (!urlPattern) {
    formError.textContent = 'Target URL pattern is required.';
    return;
  }

  const status = Number(form.status.value);
  if (!Number.isInteger(status) || status < 100 || status > 599) {
    formError.textContent = 'Status code must be a valid HTTP status (100-599).';
    return;
  }

  const rule = {
    id: form.ruleId.value || crypto.randomUUID(),
    urlPattern,
    matchType: form.matchType.value,
    method: form.method.value,
    status,
    contentType: form.contentType.value.trim() || 'application/json',
    body: form.body.value,
    enabled: form.enabled.checked,
  };

  const all = await loadRules();
  const existingIndex = all.findIndex((r) => r.id === rule.id);
  if (existingIndex >= 0) {
    all[existingIndex] = rule;
  } else {
    all.push(rule);
  }

  await saveRules(all);
  resetForm();
  refresh();
});

document.getElementById('clearForm').addEventListener('click', resetForm);

refresh();
