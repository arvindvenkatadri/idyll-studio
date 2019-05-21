const { dialog, ipcMain, app } = require('electron');
const Menu = require('./menu');
const fs = require('fs');
const Idyll = require('idyll');
const compile = require('idyll-compiler');

class Main {
  constructor(electronObjects) {
    this.mainWindow = electronObjects.win;
    const menu = new Menu(electronObjects);

    this.filePath = '';

    this.electronWorkingDir = require('path').dirname(require.main.filename);

    ipcMain.on('client:openProject', this.handleFileOpen.bind(this))

    // Menu commands
    menu.on('file:open', this.handleFileOpen.bind(this));
    menu.on('file:save', this.handleFileSave.bind(this));
  }

  handleFileOpen() {
    // Returns absolute path of file
    const files = dialog.showOpenDialog(this.mainWindow, {
      properties: ['openFile'],
      filters: [
        {
          // Give a specific filter on what
          // type of files we are looking for
          name: 'Idyll',
          extensions: ['idyll', 'idl']
        }
      ]
    });

    // If no files, don't open
    if (!files) {
      return;
    }

    // Gets full file path
    const file = files[0];

    this.filePath = file;

    var slash = '\\';
    if (process.platform === 'darwin') {
      slash = '/';
    }
    var workingDir = this.filePath.substring(
      0,
      this.filePath.lastIndexOf(slash)
    );

    // Instantiate an Idyll instance
    var idyll = Idyll({
      inputFile: this.filePath,
      output: workingDir + '/build/',
      componentFolder: workingDir + '/components/',
      dataFolder: workingDir + '/data',
      layout: 'centered',
      theme: 'github'
    });

    // filter to catch all requests to static folder
    const staticContentFilter = { urls: ['static/*'] };
    this.mainWindow.webContents.session.webRequest.onBeforeRequest(
      staticContentFilter,
      (details, callback) => {
        const { url } = details;
        if (url.indexOf(`${this.electronWorkingDir}/static/`) > -1) {
          const localURL = url.replace(this.electronWorkingDir, workingDir);
          callback({
            cancel: false,
            redirectURL: encodeURI(localURL)
          });
        } else {
          callback({
            cancel: false
          });
        }
      }
    );

    // Sends contents to render process
    const fileContent = fs.readFileSync(file).toString();

    // Compile contents
    compile(fileContent, {})
      .then(ast => {
        this.mainWindow.webContents.send('idyll:compile', {
          ast: ast,
          path: this.filePath,
          components: idyll.getComponents(),
          datasets: idyll.getDatasets()
        });
      })
      .catch(error => {
        console.log(error);
      });
  }

  // Saves current markup to open idyll project
  handleFileSave() {
    // // Let's render process know ready to receive markup to save
    // this.mainWindow.webContents.send('idyll:save', 'Saved!');
    // // Saves markup to file
    // if (this.filePath !== undefined) {
    //   ipcMain.on('save', (event, content) => {
    //     fs.writeFile(this.filePath, content, err => {
    //       if (err) throw err;
    //     });
    //   });
    // }
  }
}

module.exports = Main;
