// Stops Superhuman from seeing selected keyboard shortcuts.
//
// Runs at document_start, so this capture-phase listener on `window` is
// registered before any of Superhuman's code. It is therefore the first
// listener to see each key event, and stopImmediatePropagation() keeps the
// event from reaching every listener after it.
//
// It never calls preventDefault(). The browser's own handling still runs:
// typed characters still appear, and Chrome's Cmd+Shift+M profile switcher
// still opens.

// Key combos to block. Modifiers must match exactly, so plain M does not
// match Shift+M, Alt+M and the like.
//
//   code:       KeyboardEvent.code (physical key, layout-independent).
//               For letter keys, e.key is also accepted as a fallback.
//   shift, meta, ctrl, alt: required modifier state.
//   inEditable: true  = block even while typing in a text field.
//               false = let the key through while typing in a text field.
const BLOCKED = [
  { code: 'KeyM', shift: false, meta: false, ctrl: false, alt: false, inEditable: false },
  { code: 'KeyM', shift: true,  meta: true,  ctrl: false, alt: false, inEditable: true  },
  { code: 'KeyM', shift: true,  meta: false, ctrl: true,  alt: false, inEditable: true  },
];

// Set to true to log each blocked event to the console.
const DEBUG = false;

const EDITABLE_SELECTOR =
  'input, textarea, select, [role="textbox"], [role="combobox"]';

function matchesKey(e, code) {
  if (e.code === code) return true;
  if (!code.startsWith('Key') || typeof e.key !== 'string') return false;
  return e.key.toLowerCase() === code.slice(3).toLowerCase();
}

function isEditable(node) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
  return node.isContentEditable || node.closest(EDITABLE_SELECTOR) !== null;
}

// document.activeElement stops at a shadow host; follow it into shadow roots.
function deepActiveElement() {
  let el = document.activeElement;
  while (el && el.shadowRoot && el.shadowRoot.activeElement) {
    el = el.shadowRoot.activeElement;
  }
  return el;
}

function isTyping(e) {
  return isEditable(e.composedPath()[0]) || isEditable(deepActiveElement());
}

function shouldBlock(e) {
  if (e.isComposing) return false;
  const rule = BLOCKED.find((r) =>
    matchesKey(e, r.code) &&
    e.shiftKey === r.shift &&
    e.metaKey === r.meta &&
    e.ctrlKey === r.ctrl &&
    e.altKey === r.alt);
  if (!rule) return false;
  return rule.inEditable || !isTyping(e);
}

function onKey(e) {
  if (!shouldBlock(e)) return;
  e.stopImmediatePropagation();
  if (DEBUG) console.debug('[Superhuman M Blocker] blocked', e.type, e.code, e.key);
}

for (const type of ['keydown', 'keypress', 'keyup']) {
  window.addEventListener(type, onKey, { capture: true });
}
