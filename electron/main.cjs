const { app, BrowserWindow, shell, net } = require('electron');
const path = require('node:path');

const APP_ID = 'com.acuarionexo.desktop';
const PUBLISHED_URL = 'https://acuarionexo.com/';
const PUBLISHED_ORIGIN = new URL(PUBLISHED_URL).origin;
const RETRY_INTERVAL_MS = 30000;

app.setAppUserModelId(APP_ID);

function isInternalUrl(url) {
  try {
    return new URL(url).origin === PUBLISHED_ORIGIN;
  } catch (_) {
    return false;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    title: 'AcuarioNexo',
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: '#02111f',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  const localIndex = path.join(__dirname, '..', 'www', 'index.html');
  let usingLocalFallback = false;
  let remoteLoadInProgress = false;
  let retryTimer = null;

  function stopRetryTimer() {
    if (retryTimer) clearInterval(retryTimer);
    retryTimer = null;
  }

  async function loadLocalFallback() {
    if (win.isDestroyed() || usingLocalFallback) return;
    usingLocalFallback = true;
    remoteLoadInProgress = false;
    await win.loadFile(localIndex);
    if (!retryTimer) {
      retryTimer = setInterval(function () {
        if (!win.isDestroyed() && usingLocalFallback && net.isOnline()) loadPublished();
      }, RETRY_INTERVAL_MS);
    }
  }

  async function loadPublished() {
    if (win.isDestroyed() || remoteLoadInProgress) return;
    remoteLoadInProgress = true;
    try {
      await win.loadURL(PUBLISHED_URL + '?desktop=1&t=' + Date.now(), {
        extraHeaders: 'Cache-Control: no-cache\nPragma: no-cache\n'
      });
      usingLocalFallback = false;
      stopRetryTimer();
    } catch (_) {
      await loadLocalFallback();
    } finally {
      remoteLoadInProgress = false;
    }
  }

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternalUrl(url)) return { action: 'allow' };
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file:') || isInternalUrl(url)) return;
    event.preventDefault();
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
  });

  win.webContents.on('did-fail-load', (_event, errorCode, _description, validatedURL, isMainFrame) => {
    if (!isMainFrame || errorCode === -3 || !isInternalUrl(validatedURL)) return;
    loadLocalFallback();
  });

  win.on('closed', stopRetryTimer);
  loadPublished();
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
