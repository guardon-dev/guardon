/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';

describe('options page behavior', () => {
  beforeEach(() => {
    jest.resetModules();
    // Minimal DOM elements expected by options.js
    document.body.innerHTML = `
      <table><tbody id="rulesBody"></tbody></table>
      <div id="formTitle"></div>
      <input id="ruleId" />
      <input id="ruleDesc" />
      <input id="ruleKind" />
      <input id="ruleMatch" />
      <input id="rulePattern" />
      <select id="ruleRequired"><option value="false">false</option><option value="true">true</option></select>
      <select id="ruleSeverity"><option value="warning">warning</option></select>
      <input id="ruleMessage" />
      <input id="ruleEnabled" type="checkbox" />
      <textarea id="ruleFix"></textarea>
      <textarea id="ruleRationale"></textarea>
      <input id="ruleReferences" />
      <button id="addRule"></button>
      <button id="cancelRule"></button>
      <button id="saveRule"></button>
      <button id="importRules"></button>
      <textarea id="importTextarea"></textarea>
      <input id="importFile" type="file" />
      <input id="importUrl" />
      <button id="fetchUrl"></button>
      <div id="toast"></div>
      <!-- Modal for rule editing -->
      <div id="ruleEditModal" class="modal-overlay" style="display:none;"></div>
      <!-- Modal for import panel -->
      <div id="importPanelModal" class="modal-overlay" style="display:none;"></div>
    `;

    // Mock chrome.storage.local
    global.chrome = {
      storage: {
        local: {
          _store: {},
          get: jest.fn((key, cb) => cb({ customRules: [] })),
          set: jest.fn((obj, cb) => { global._lastSaved = obj; if (cb) cb(); })
        }
      },
      runtime: { sendMessage: jest.fn() }
    };
  });

  test('saving a rule persists explain metadata and fix parsing', async () => {
    // Import options.js after DOM and chrome mocks are in place
    const module = await import('../src/options/options.js');

    // Simulate clicking add rule to show form defaults
    document.getElementById('addRule').click();

    // Fill inputs
    document.getElementById('ruleId').value = 't1';
    document.getElementById('ruleDesc').value = 'desc';
    document.getElementById('ruleKind').value = 'Pod';
    document.getElementById('ruleMatch').value = 'metadata.name';
    document.getElementById('rulePattern').value = '.*';
    document.getElementById('ruleRequired').value = 'false';
    document.getElementById('ruleSeverity').value = 'warning';
    document.getElementById('ruleMessage').value = 'msg';
    document.getElementById('ruleRationale').value = 'Because security';
    document.getElementById('ruleReferences').value = 'https://kyverno.io,https://kubernetes.io';

    // Click save
    document.getElementById('saveRule').click();

    // Expect chrome.storage.local.set to have been called and stored customRules
    expect(global.chrome.storage.local.set).toHaveBeenCalled();
    const saved = global._lastSaved && global._lastSaved.customRules && global._lastSaved.customRules[0];
    expect(saved).toBeDefined();
    expect(saved.id).toBe('t1');
    expect(saved.explain).toBeDefined();
    expect(saved.explain.rationale).toBe('Because security');
    expect(Array.isArray(saved.explain.refs)).toBe(true);
    expect(saved.explain.refs.length).toBe(2);
  });
});
