# OPEN desktop

A personal desktop, with an optional local companion. The hosted page is a client-side desktop for notes, text files and views. The companion adds real, narrow text-file access and local AI **when you run it on your own computer**. The GitHub Pages site cannot control a remote operating system by itself.

## On the Windows Z13

1. Download and unzip this project on the Z13. Install Node.js LTS if `node` is not already available.
2. Double-click `companion/start-windows.cmd` or run `node companion/server.js` from this folder. Keep the terminal open. It prints a fresh session key.
3. Open `http://127.0.0.1:18183` on the Z13 (reliable local option), or the hosted OPEN page in Edge on that same computer. Open **AI + computer**, paste the session key and Connect. If Edge asks whether this website may reach devices on the local network, allow it for this site. The key is stored in sessionStorage for this tab only.
4. Have a llama.cpp OpenAI-compatible `llama-server` running locally on port 18182. The companion discovers `/v1/models` and shows whether it can talk to a model. Its chat has **no tools**; it cannot autonomously click, run code or edit files.

The companion listens only on `127.0.0.1:18183`, never on the network interface. It lets you list/read plain text files in `~/OPEN Workspace`, preview and confirm a save of up to 128 KiB, but cannot browse other folders, delete files, launch apps, run shell commands, or control a browser. It accepts only a fresh random key printed on startup; never put the key in source control. The hosted page needs local-network permission in some browsers; if that is unavailable, use `http://127.0.0.1:18183` directly. The same-machine restriction is intentional. This is **not** Debian, a complete operating system, cross-device sync, or a fully autonomous computer-use agent.

Commands in the hosted desktop include `open notes`, `create note Weekend ideas`, `find ideas`, `save file draft.txt: Hello`, `calculate 12 * 7`, `search web for typography`, and `open companion`. These bounded commands operate on browser-local data. For a free user-owned model, use a compatible local llama.cpp server; no paid API key or cloud model is in this repo.

Run `node test/smoke.cjs` to check the local companion's authentication, origin handling, write confirmation and filename confinement.

Inspired by Chris Tate's [personal OS demo](https://x.com/ctatedev/status/2103517099511451940). Its coast footage is not shipped. The wallpaper is a separate public-domain NOAA photograph by Michael Theberge from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Sea_Stacks_on_Oregon_Coast.jpg).
