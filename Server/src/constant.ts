import config from '../config.json';

export const CONSTANTS = {
  // Mod Signature, or file name
  MOD_SIGNATURES : {
    SAIN: {
      CLIENT: "SAIN.dll",
      SERVER: "zSolarint-SAIN-ServerMod"
    }
  }
}

export interface CONSTANTS {
    // Mod Signature, or file name
    MOD_SIGNATURES : Map<string, MOD_SIGNATURES>;
}

export interface MOD_SIGNATURES {
    CLIENT: string,
    SERVER: string
}

export const WebSocketConfig = {
    port: config.web_socket_port || 7828,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3,
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024,
      },
      clientNoContextTakeover: true,
      serverNoContextTakeover: true,
      serverMaxWindowBits: 10,
      concurrencyLimit: 10,
      threshold: 1024,
    },
}