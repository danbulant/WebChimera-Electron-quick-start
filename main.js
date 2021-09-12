const path = require('path');

if (process.platform == 'win32') {
    process.env['VLC_PLUGIN_PATH'] = path.join(__dirname, 'node_modules/wcjs-prebuilt/bin/plugins');
}

const { app, BrowserWindow, ipcMain } = require('electron');
const serve = require('electron-serve');
const loadURL = serve({ directory: 'public' });

let mainWindow;

function isDev() {
    return !app.isPackaged;
}

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false
    });
    
    if (isDev()) {
        mainWindow.loadURL('http://localhost:5000/');
        mainWindow.webContents.openDevTools();
    } else {
        loadURL(mainWindow);
    }

    mainWindow.on('closed', function() {
        mainWindow = null;
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        console.log("Showing window");
    });
}

app.on('ready', createWindow);
    
ipcMain.on('get-args', (event, arg) => {
    const args = process.argv.slice();
    console.log("ARGS", args);
    if(args[1] == ".") args.shift();
    args.shift();
    event.returnValue = JSON.stringify(args);
});
ipcMain.on("log", (event, ...data) => {
    console.log(...data);
})

app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
