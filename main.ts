import {app, dialog, BrowserWindow, screen, ipcMain} from 'electron';
// import { autoUpdater } from "electron-updater"
const {autoUpdater} = require('electron-updater');
import * as path from 'path';
import * as url from 'url';

//
function appUpdater() {
    let version = app.getVersion();
    mainWin.webContents.send('ipcMain-log', 'version===' + version);

    autoUpdater.on('error', err => mainWin.webContents.send('ipcMain-log', err));
    autoUpdater.on('checking-for-update', () => mainWin.webContents.send('ipcMain-log', 'checking-for-update'));
    autoUpdater.on('update-available', () => mainWin.webContents.send('ipcMain-log', 'update-available > start downloading'));
    autoUpdater.on('update-not-available', () => mainWin.webContents.send('ipcMain-log', 'update-not-available'));

    // Ask the user if update is available
    autoUpdater.on('update-downloaded', (updateInfo) => {
        let message = app.getName() + ' ' + updateInfo.version + ' 버전 사용이 가능합니다.';
        if (updateInfo.releaseNotes) {
            let releaseNotesRemoveTag = updateInfo.releaseNotes.replace(/(<([^>]+)>)/ig, '');
            let splitNotes = releaseNotesRemoveTag.split(/[^\r]\n/);
            message += '\n\n업데이트 내용:\n';
            splitNotes.forEach(notes => {
                message += notes + '\n';
            });
        }
        mainWin.webContents.send('ipcMain-log', 'update message===' + message);

        // Ask user to update the app
        dialog.showMessageBox({
            type: 'question',
            buttons: ['설치 후 재실행', '나중에'],
            defaultId: 0,
            // message: 'A new version of ' + app.getName() + ' has been downloaded',
            message: '새로운 버전으로 업데이트 가능합니다.',
            detail: message
        }, response => {
            if (response === 0) {
                setTimeout(() => autoUpdater.quitAndInstall(), 1);
            }
        });
    });
    autoUpdater.on('download-progress', (progressInfo) => mainWin.webContents.send('ipcMain-log', progressInfo.percent+'% ...'));

    // init for updates
    autoUpdater.checkForUpdates();
}

let mainWin, serve, workerWin;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

function createWindow() {
    const electronScreen = screen;
    const size = electronScreen.getPrimaryDisplay().workAreaSize;

    // Create the browser window.
    mainWin = new BrowserWindow({
        x: 10,
        y: 10,
        width: size.width - 20,
        height: size.height - 20,
        resizable: false,
        //center: true,
        frame: false
    });

    // default menu hidden
    mainWin.setMenu(null);

    if (serve) {
        require('electron-reload')(__dirname, {
            electron: require(`${__dirname}/node_modules/electron`)
        });
        mainWin.loadURL('http://localhost:4200');
    } else {
        mainWin.loadURL(url.format({
            pathname: path.join(__dirname, 'dist/index.html'),

            protocol: 'file:',
            slashes: true
        }));
    }
    if (isDevMode()) {
        mainWin.webContents.openDevTools();
    }

    mainWin.on('closed', () => {
        if(workerWin)
            workerWin.close();
        mainWin = null;
    });

    //create workerWindow
    workerWin = new BrowserWindow();
    workerWin.loadURL(url.format({
        pathname: path.join(__dirname, 'src/assets/worker.html'),

        protocol: 'file:',
        slashes: true
    }));
    workerWin.hide();
    // workerWin.webContents.openDevTools();
    workerWin.on('closed', () => {
        workerWin = null;
    });

    ipcMain.on('request-mainprocess-action', (event, arg) => {
        switch (arg.type) {
            case 'printByMain':
                startPrint(mainWin, arg.etc.isSilent);
                event.sender.send('ipcMain-log', 'self print ok');
                break;
            case 'printByWorker':
                workerWin.webContents.send('printWorker', arg.head, arg.el, arg.etc);
                event.sender.send('ipcMain-log', 'worker print ok');
                break;
            default:
                break;
        }
    });

    ipcMain.on('readyToPrint', (event, etc) => {
      startPrint(workerWin, etc.isSilent);
    });
}

function startPrint(win: BrowserWindow, isSilent: boolean){
  win.webContents.print({
    silent: isSilent, printBackground: false, deviceName: ''
  });
}

try {
    app.on('ready', () => {
        createWindow();

        let startAppUpdater = setInterval(()=>{
            if(mainWin.isVisible())
                setTimeout ( ()=> {
                    appUpdater();
                }, 2000);
            clearInterval(startAppUpdater);
        },1000);
    });

    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWin === null) {
            createWindow();
        }
    });

} catch (e) {
    // Catch Error
    // throw e;
}

function isDevMode() {
    return process.mainModule.filename.indexOf('app.asar') === -1;
}
