const {app, shell} = require('electron');
const AbstractWindow = require('./abstract');
const {translate, getStrings, getLocale} = require('../l10n');
const {APP_NAME} = require('../brand');
const settings = require('../settings');
const {isUpdateCheckerAllowed} = require('../update-checker');
const RichPresence = require('../rich-presence');

const { SerialPort } = require('serialport');
// const parser = require('@serialport/parser-readline');
const {setPort,getPort} = require('../../utils/port')



class SerialConnectWindow extends AbstractWindow {
  constructor () {
    super();

    this.window.setTitle(`串口连接 - ${APP_NAME}`);
    this.window.setMinimizable(false);
    this.window.setMaximizable(false);

    const ipc = this.window.webContents.ipc;
    ipc.on('get-strings', (event) => {
      event.returnValue = {
        locale: getLocale(),
        strings: getStrings()
      }
    });


    let PORT
    ipc.handle('send-connect-port', async (event, port) =>{
      console.log(port)

      // 创建一个 SerialPort 对象
      PORT = new SerialPort({
          path: port, // 串口名称
          baudRate: 57600, // 波特率
          dataBits: 8, // 数据位
          stopBits: 1, // 停止位
          parity: 'none' // 校验位
      },(err) =>{
        console.log(PORT)
      })


      // 监听打开事件
      PORT.on('open', () => {
        console.log('Port opened successfully');
        console.log(PORT)
        setPort(PORT)
        console.log('GETPORT: ')
        console.log(getPort())
        ipc.on('is-connected', (event) => {
          event.returnValue = {
            flag: true
          }
        });
        // try {
        //   let startMsg=[0xAF,0x04,0x96,0x00,0x01,0x4a]
        //   const data1 = new Uint8Array(startMsg);
        //   PORT.write(data1);
        // }
        // catch (err) {
        //   console.log('发送数据失败: ' + err.message+'\n');
        // }
        // // 创建解析器
        // const parserInstance = PORT.pipe(new parser({ delimiter: '\r\n' }));
        // // 监听数据
        // parserInstance.on('data', (data) => {
        //   console.log(`Received: ${data}`);
        // });
      
      });
  

      PORT.on('close',()=>{
        console.log('Port closed')
      })
      // 监听错误事件
      PORT.on('error', (err) => {
      console.error('Serial port error:', err);
      });

      // PORT.on('data', (data) => {
      //   console.log('Received data:', data.toString()); // 将 Buffer 转换为字符串
      // });
      // PORT.on('readable',()=>{
      //   console.log(PORT.read());
        
      // })

    })
    

    const session = require('electron').session;
    session.defaultSession.setPermissionCheckHandler((permission, details) => {
      if (permission === 'serial') {
        return true; // 允许访问串口设备
      }
      return false;
    });

    

    let port;
    let writer;
    let reader;
    let PORTS=[]
    async function init(){
      await SerialPort.list().then(ports => {
        ports.forEach(port=>{
          console.log(port.path)
          PORTS.push(port.path)
          // console.log(PORTS)
        })
      })
      console.log(PORTS)
      ipc.on('get-ports', (event) => {
        event.returnValue = {
          PORTS
        }
      });
    

    }
    init()



    
    this.loadURL('serial-connect://./serial-connect.html');
  }

  getDimensions () {
    return {
      width: 550,
      height: 500
    };
  }

  getPreload () {
    return 'serial-data';
  }

  isPopup () {
    return true;
  }

  static show () {
    const window = AbstractWindow.singleton(SerialConnectWindow);
    window.show();
  }
}

module.exports = SerialConnectWindow;
