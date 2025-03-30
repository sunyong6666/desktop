const {app, shell} = require('electron');
const AbstractWindow = require('./abstract');
const {translate, getStrings, getLocale} = require('../l10n');
const {APP_NAME} = require('../brand');
const settings = require('../settings');
const {isUpdateCheckerAllowed} = require('../update-checker');
const RichPresence = require('../rich-presence');

const {ipcMain}=require('electron/main')

const { SerialPort } = require('serialport');
const path = require('path');

const { BrowserWindow } = require('electron');

const {getCloseBn,setCloseBn} = require('../../utils/closeBn')
const {getSocket} = require('../../utils/socket')


class MasterWindow extends AbstractWindow {
  constructor () {
    super();

    this.window.setTitle(`主控器 - ${APP_NAME}`);
    this.window.setMinimizable(false);
    this.window.setMaximizable(false);
    // console.log(this.window.navigator);
    // this.window.webContents.openDevTools()
    

    const ipc = this.window.webContents.ipc;

    ipc.on('get-close', (event) => {
      console.log('--------------')
      console.log(getCloseBn())
      event.returnValue = {
        close:getCloseBn()
      }
    });
    
    ipc.handle('send-close', async (event, num) =>{

      console.log(num)
      setCloseBn(num)
      if(getSocket()){
          getSocket().send(JSON.stringify({
            type: 'masterClose',
            data: { message: num }
          }))
      }

    })

    ipc.handle('send-master', async (event, num) =>{
      // 发送数据到服务器的函数
      fetch('http://localhost:3000/set-extension', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: num
      })
      .then(response => response.text())
      .then(data => {
        console.log('服务器响应:', data);
      })
      .catch(error => {
        console.error('错误:', error);
      });
      // console.log('------------')
      // console.log(num)
      // console.log('------------')

      if(getSocket()){
          getSocket().send(JSON.stringify({
            type: 'setExtension',
            data: { message: num }
          }))
      }

        this.window.close();
    })
    
    this.loadURL('master://./master.html');
  }


  getDimensions () {
    return {
      width: 550,
      height: 500
    };
  }

  getPreload () {
    return 'master-data';
  }

  isPopup () {
    return true;
  }

  static show () {
    const window = AbstractWindow.singleton(MasterWindow);
    window.show();
  }
}

module.exports = MasterWindow;
