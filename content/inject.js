(function () {
  let rules = [];
  let globalEnabled = true;

  console.log('%c[API Response Modder] interceptor loaded on this page', 'color: #1a56db; font-weight: bold;');

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (data && data.source === 'api-response-modder' && data.type === 'rules-update') {
      rules = data.rules;
      globalEnabled = data.globalEnabled;
      console.log('%c[API Response Modder] rules updated', 'color: #1a56db; font-weight: bold;', { rules, globalEnabled });
    }
  });

  function matchesPattern(url, pattern, matchType) {
    if (matchType === 'wildcard') {
      const escaped = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      return new RegExp('^' + escaped + '$').test(url);
    }
    return url.includes(pattern);
  }

  function findRule(url, method) {
    if (!globalEnabled) return null;
    for (const rule of rules) {
      if (!rule.enabled) continue;
      if (rule.method !== 'ANY' && rule.method !== method) continue;
      if (matchesPattern(url, rule.urlPattern, rule.matchType)) return rule;
    }
    return null;
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : input.url;
    const method = ((init && init.method) || (typeof input !== 'string' && input.method) || 'GET').toUpperCase();
    const rule = findRule(url, method);

    if (rule) {
      console.log(
        `%c[API Response Modder] matched ${method} ${url}`,
        'color: #1a56db; font-weight: bold;',
        { rule, request: { url, method, init } }
      );
      return Promise.resolve(
        new Response(rule.body, {
          status: rule.status,
          headers: { 'Content-Type': rule.contentType },
        })
      );
    }

    return originalFetch(input, init);
  };

  const OriginalXHR = window.XMLHttpRequest;

  function PatchedXHR() {
    const xhr = new OriginalXHR();
    let matchedRule = null;

    const originalOpen = xhr.open.bind(xhr);
    xhr.open = function (method, url, ...rest) {
      xhr.__arm_method = method.toUpperCase();
      xhr.__arm_url = url;
      matchedRule = findRule(url, xhr.__arm_method);
      return originalOpen(method, url, ...rest);
    };

    const originalSend = xhr.send.bind(xhr);
    xhr.send = function (body) {
      if (!matchedRule) {
        return originalSend(body);
      }

      const rule = matchedRule;
      console.log(
        `%c[API Response Modder] matched XHR ${xhr.__arm_method || ''} ${xhr.__arm_url || ''}`,
        'color: #1a56db; font-weight: bold;',
        { rule, requestBody: body }
      );
      Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
      Object.defineProperty(xhr, 'status', { value: rule.status, configurable: true });
      Object.defineProperty(xhr, 'statusText', { value: 'OK', configurable: true });
      Object.defineProperty(xhr, 'responseText', { value: rule.body, configurable: true });
      Object.defineProperty(xhr, 'response', { value: rule.body, configurable: true });
      Object.defineProperty(xhr, 'getAllResponseHeaders', {
        value: () => `content-type: ${rule.contentType}\r\n`,
        configurable: true,
      });
      Object.defineProperty(xhr, 'getResponseHeader', {
        value: (name) => (name.toLowerCase() === 'content-type' ? rule.contentType : null),
        configurable: true,
      });

      setTimeout(() => {
        xhr.dispatchEvent(new Event('readystatechange'));
        xhr.dispatchEvent(new Event('load'));
        xhr.dispatchEvent(new Event('loadend'));
      }, 0);
    };

    return xhr;
  }

  PatchedXHR.prototype = OriginalXHR.prototype;
  window.XMLHttpRequest = PatchedXHR;
})();
