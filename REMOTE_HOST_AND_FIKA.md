# Remote Host and Fika Support (WIP)

The FIKA Mod is **not** completely supported at this stage. However, with help from `RavenX8, olli991, stk2008, kenricv, and others`, changes were implemented to make it more user-friendly.

## Requirements

- SPT Installation
- [Optional] FIKA Installation
- Understanding of networking, routing, firewalls, and port forwarding.

## Remote Host Configuration

If you're hosting SPT/FIKA on a remote host, consider the following changes.

### Server Mod Settings

- Open the mod folder `\user\mods\raid_review__x.x.x`.
- Open the `config.json` file in VSCode (or your preferred editor).
- In this file, you will have options to change the HTTP and Web Socket server ports.
  - If you change these values, **make sure** you also adjust your Client Mod settings via the F12 menu.

### Client Mod Settings

- Open `F12` Settings and go to the `Raid Review` options.
- Change the Server IP from `127.0.0.1` to the IP address of your remote host.
- If you modified the `config.json` for the server mod to use different ports, please modify the `Server WS Port` and `Server HTTP Port` to reflect those changes.
- If you are securing the `Raid Review` web server with an SSL Certificate through a proxy, you can enable TLS so the website launches with `https://` instead of `http://`.

### Inbound Port Rules

- Ensure that ports for your host device and any networking devices are open. The default ports are `TCP` with a range of `7828-7829`, unless you have changed them.

## Debugging

- Confirm if the `game client` is connecting by tailing the `Player.log` file in your `%appdata%` directory, usually found here: `C:\Users\<user>\AppData\LocalLow\Battlestate Games\EscapeFromTarkov\Player.log`. You can tail the file by using either of these commands:
  - Bash: `tail -f Player.log`
  - PowerShell: `Get-Content -Path "Player.log" -Wait`
  - Look for a message that looks like this: `[RAID-REVIEW] WebSocket connected.`
- You can also confirm if the `game client` is connecting by watching the SPT Server Logs and looking for a message that looks like this: `[RAID-REVIEW] Web Socket Client Connected`

## Basic Auth

- Open the `\user\mods\raid_review__x.x.x\config.json` file in VSCode (or your preferred editor).
- You can enable `Basic Auth`, as well as register "accounts" to log into the web client.
  - The username/password is what YOU have set against your SPT profile, if you have not set a password, it will be blank.
  
