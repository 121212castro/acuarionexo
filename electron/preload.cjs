const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('AcuarioNexoDesktop', Object.freeze({
  platform: process.platform,
  architecture: process.arch,
  isDesktop: true
}));
