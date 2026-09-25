# OPEN desktop

A personal desktop with an optional local companion. The hosted site holds browser-local notes and text files. The companion runs on your own Windows Z13 and adds local AI, text files in OPEN Workspace, and single-step computer controls. GitHub Pages alone cannot control your computer.

## Run on the Z13

1. From this project folder, double-click `companion/start-windows.cmd` or run `node companion/server.js`. Node is required. Keep the terminal open; it prints a fresh session key.
2. Open `http://127.0.0.1:18183` on the Z13 (most reliable), open **AI + computer**, paste the key and connect. The hosted page can also reach the companion from that same machine if your browser allows local-network access. The key stays in the tab's sessionStorage and never belongs in the repository.
3. The companion uses an already-running, OpenAI-compatible llama.cpp server on `127.0.0.1:18182`. It never starts or restarts the model.
4. **Computer controls:** Refresh screen to see the current desktop. Choose one action: launch Notepad, Calculator, Files or Edge; open an HTTP(S) URL in Edge; click visible coordinates; type literal text into the foreground app; or press one supported key. Preview each action and read the foreground window and exact action before confirming within 60 seconds. The local model can suggest one action from a text goal, but cannot execute it. You still preview and confirm it. Refresh screen after every step.

A click or key can send a message, delete data, or buy something inside another app. OPEN cannot determine the meaning of a screen control. **Do not confirm such an action without understanding it.** This build deliberately has no unattended agent loop, shell execution endpoint, general process launcher, file deletion, or access to arbitrary folders. It refuses to send input to recognized terminal/admin windows and does not expose keyboard shortcuts for opening system command interfaces. It is not a sandbox or a guarantee against every dangerous app UI. Avoid typing secrets; screenshots and window titles are exposed to the local page after connecting, and the session key grants local control. Keep the key private, close the companion to stop it, and do not expose port 18183 on your network.

Text files in `~/OPEN Workspace` may be listed/read; saving a supported text file up to 128 KiB needs a separate preview and confirmation. Each approval is single-use and expires after 60 seconds. No delete button.

Run `node test/smoke.cjs` to test authentication, origin filtering, file safety and approval handling. Windows controls require an interactive Windows desktop and must be tested there. The local model suggestion consumes only your typed goal and the current foreground window title, not screen pixels. The screenshot is shown to you, not sent to the model. OPEN is not a complete operating system or fully autonomous computer-use agent.

Inspired by Chris Tate's [personal OS demo](https://x.com/ctatedev/status/2103517099511451940). Its coast footage is not shipped. Wallpaper: separate public-domain NOAA photograph by Michael Theberge from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Sea_Stacks_on_Oregon_Coast.jpg).
