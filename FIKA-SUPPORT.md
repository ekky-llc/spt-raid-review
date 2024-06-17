# Remote Host / FIKA Support (TBC)

The FIKA Mod is **not** completely supported at this stage, however, with help from `RavenX8, olli991, kenricv and others` changes were implemented to make it friendlier.

## Requirements

- SPT Installation
- [Optional] Fika Installation
- Understanding of networking, routing, firewalls, port forwarding.
## Remote Host Configuration

If you're hosting SPT/Fika on another remote host, you will need to consider the following changes.

#### Server Mod Settings

- Open the mod folder `\user\mods\raid_review__x.x.x`
- Open the `config.json` file in VSCode (or your preferred editor).
- In here you will have options to change the HTTP and Web Socket server ports.
  - If you change these values **make sure** you also adjust your Client Mod settings via the F12 menu.

#### Client Mod Settings

- Open `F12` Settings, and go to the `Raid Review` options
- Change the Server IP from `127.0.0.1` to the IP Address of your remote host.
- If you modified the `config.json` for the server mod to use different ports, please modify `Server WS Port` and `Server HTTP Port` to reflect that change.
- If you are securing the `Raid Review` web server with an SSL Certificate, you can enable TLS so the website launches with `https://` instead of `http://`

#### Inbound Port Rules

- Please make sure that ports for your host device, any networking devices have their ports open. The default ports are `TCP` with a range of `7828-7829`, unless you have changed them.


## Debugging

- You can confirm if your the `game client` is connecting by tailing the `Player.log` file in your `%appdata%` directory, usually found here: `C:\Users\<user>\AppData\LocalLow\Battlestate Games\EscapeFromTarkov\Player.log`, if you open a terminal here you can tail the file by using either of these commands:
  - Bash: `tail -f Player.log` or Powershell: `Get-Content -Path "Player.log" -Wait`
  - You're looking for a message that looks like this: `[RAID-REVIEW] WebSocket connected.`
- You can also confirm if the `game client` is connecting by watching the SPT Server Logs and looking for a message that looks like this: `[RAID-REVIEW] Web Socket Client Connected`

## Basic Auth

- if you open the `\user\mods\raid_review__x.x.x\config.json` file in VSCode (or your preferred editor).
- You can also enable `Basic Auth`, as well as register "accounts" to log into the web client. 
  - The reason I have added this is because as of `v0.0.4` raid data can be deleted, and if you don't trust your friends with just hitting buttons for the sake of it, you can have light access control features.