# Development Guide

This guide will help you get started if you want to contribute to the project or make personal modifications.

## Requirements

- Visual Studio 2022
- Visual Studio Code
- NodeJS v18.17.0
- Escape From Tarkov
- SPT Installation

## SPT Client Mod `/Client`

The BepInEx plugin/SPT client mod setup is straightforward.

### Development Setup

1. Open the solution in Visual Studio 2022.
2. Import the required dependencies:
   - Review `RAID-REVIEW.csproj` for a list of required dependencies.
   - Dependencies can be found in the `\BepInEx\plugins\spt` or `\EscapeFromTarkov_Data\Managed` folders of your SPT Installation.
   - Right-click on the `Dependencies` node in the solution explorer, select `Add Project References`, and browse to the `/dependencies` folder to import them.
3. Update `<OutputPath>...</OutputPath>` to the full path of your SPT Installation for development/debugging.
4. Start making your changes.

### Building the Solution

1. Open a PowerShell terminal.
2. Run `dotnet build`.

If the build is successful, the output will be in the destination path configured in `<OutputPath>...</OutputPath>` in `RAID-REVIEW.csproj`.

## SPT Server Modification `/Server`

1. Open the project in VSCode.
2. Open Terminal and navigate to `/Server`.
3. Install dependencies by running `npm install`.
4. Start making your changes.

## Custom Web Server `/Server/src/Web/Server`

No setup required. Project dependencies are listed in `/Server/package.json`. Currently, this cannot be run/tested outside of the SPT Server. Hot-reload for debugging is not implemented yet.

## Custom Web Client `/Server/src/Web/Client`

### Development Setup

1. Open the project in VSCode.
2. Edit the `base_directory` file, replacing the path with the full path of your SPT Installation for development/debugging.
3. Open Terminal and navigate to `/Server/src/Web/Client`.
4. Install dependencies by running `npm install`.
5. Start the development server with hot-reload using `npm run dev`.
6. Start making your changes.

### Building the Solution

1. Open Terminal and run `npm run build-all`.

If the build is successful, the output will be in the destination path configured in the `base_directory` file.

## Workflow / Debugging

- **Client Mod** `/Client`
  - Work in Visual Studio 2022, make changes, build, and launch the game.
- **Server Mod** `/Server/src/mod.ts`
- **Web Server** `/Server/src/Web/Server/express.ts` 
  - Work in Visual Studio Code, make changes, build, and launch the server.
- **Web Client** `/Server/src/Web/Client`
  - Work in Visual Studio Code, launch the SPT Server with a RAID-REVIEW build deployed, make changes, build, and launch the server.

# Data Capture Process Overview

The client mod patches various `C# Methods` using the BepInEx Framework. The targeted methods are used by the game to perform tasks like shooting, applying damage, kills, and starting/ending raids.

Data is structured in custom `C# Classes`, serialized to JSON, and sent via WebSockets from the client to the backend in real-time. The backend writes the data to a SQLite database (`<mod_folder>/data/spt_raid_review.db`), and positional data is written to a CSV file specific to a raid (`<mod_folder>/data/positions/<raid_id>_positions`).

Once a raid is completed, a workflow starts to collate the data into a `.json` file in the same positions folder, which can later be consumed by the HTTP Server and exposed via the API.
