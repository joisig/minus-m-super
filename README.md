# Superhuman M Blocker

This is a purely AI-generated Chrome extension, meant to be loaded unpacked. I made it to fix an annoyance I had with Superhuman: I kept pressing a keyboard shortcut by accident, and I could not find a way to turn that shortcut off in Superhuman itself.

The extension (Manifest V3) stops Superhuman (`https://mail.superhuman.com/*`) from reacting to `Cmd+Shift+M` (macOS) and `Ctrl+Shift+M` (other systems). It blocks both combos on all systems, everywhere in Superhuman, including text fields.

All other Superhuman shortcuts still work. Chrome's own `Cmd+Shift+M` profile switcher also still works.

## How it works

`block.js` is a content script that runs at `document_start`. It adds a capture-phase `keydown`/`keypress`/`keyup` listener on `window` before Superhuman's code loads. For a blocked key, it calls `stopImmediatePropagation()`, so Superhuman never sees the event.

It never calls `preventDefault()`. As a result, the browser's default handling still runs: typed letters appear, and Chrome opens its profile switcher for `Cmd+Shift+M`.

Keys match on `KeyboardEvent.code` (the physical key), so the extension works with any keyboard layout, for example Icelandic. `KeyboardEvent.key` is a fallback for letter keys.

## Install

1. Clone this repository.
2. In Chrome, open `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the repository folder.
5. Reload any open Superhuman tabs.

After you change `block.js`, click the reload icon on the extension's card in `chrome://extensions`, then reload the Superhuman tab.

## Block more keys

Edit the `BLOCKED` table at the top of `block.js`. Each row is one key combo. For example, this row also blocks plain `M`, except while you type in a text field:

```js
// { code, shift, meta, ctrl, alt, inEditable }
{ code: 'KeyM', shift: false, meta: false, ctrl: false, alt: false, inEditable: false },
```

- `code`: the [`KeyboardEvent.code`](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values) value, for example `KeyM`, `Digit1` or `Slash`.
- `shift`, `meta`, `ctrl`, `alt`: the exact modifier state. `meta` is `Cmd` on macOS. A row matches only when all four are equal to the event's modifiers.
- `inEditable`: `true` blocks the key also while you type in a text field. Use `false` for keys that type a character.

To see which events the extension blocks, set `DEBUG = true` in `block.js` and look at the DevTools console on the Superhuman tab.

## Manual tests

1. Press `Cmd+Shift+M` in list view, in a thread, and in an open compose window. No Superhuman popup, and Chrome's profile switcher opens each time.
2. In compose or reply, type "Mamma mia". The text appears normally.
3. In the search box and the `Cmd+K` command palette, type "m". It works normally.
4. `M`, `Shift+M`, `E`, `J`/`K`, `Enter`, `Cmd+K`, `C` and `R` all still work as before.
5. The DevTools console shows no errors from the extension.

## If Superhuman still gets the key

If test 1 fails, Superhuman sees the event before this extension. Next steps:

1. Add `"world": "MAIN"` to the `content_scripts` entry in `manifest.json` (Chrome 111 or later), so the script runs in the page's own JavaScript context.
2. If the profile switcher still does not open, something on the page calls `preventDefault()` on that `keydown`. To find it, temporarily wrap `KeyboardEvent.prototype.preventDefault` in the MAIN world and log `new Error().stack`.

## License

MIT. See [LICENSE](LICENSE).
