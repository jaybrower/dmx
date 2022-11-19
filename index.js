const { app, BrowserWindow } = require('electron');
const path = require('path');

const createWindow = () => {
    const win = new BrowserWindow({
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        width: 800,
    });

    win.loadFile('./index.html');
}

app.whenReady().then(() => {
    createWindow();
});