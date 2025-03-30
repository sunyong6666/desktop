const {app} = require('electron');
const SerialPort = require('serialport');
// requestSingleInstanceLock() crashes the app in signed MAS builds
// https://github.com/electron/electron/issues/15958
if (!process.mas && !app.requestSingleInstanceLock()) {
  app.exit();
}

const path = require('path');
const openExternal = require('./open-external');
const AbstractWindow = require('./windows/abstract');
const EditorWindow = require('./windows/editor');
const {checkForUpdates} = require('./update-checker');
const {tranlateOrNull} = require('./l10n');
const migrate = require('./migrate');
const { ipcMain } = require('electron')

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const Bottleneck = require('bottleneck');
const timeout = require('connect-timeout');
const {getLanyaList,setLanyaList} = require('../utils/lanya')
const {getWin,setWin} = require('../utils/win')
// const {getWss,setWss} = require('../utils/wsSever')
const WebSocket = require('ws');
const {getDistance,setDistance} = require('../utils/distance')

const currentEspIp=require('../utils/currentEspIp')
const {getCloseBn,setCloseBn} = require('../utils/closeBn')

const {setSocket,getSocket,setBricksSocket,setBricksMotor} = require('../utils/socket')

const {systemPreferences} = require('electron')

const wifi = require('node-wifi');
const Current=require('../utils/currentWifi')

const net = require("net");
const { exec } = require("child_process");
// 初始化 wifi 模块
wifi.init({ iface: null });  // null 会选择默认的 Wi-Fi 接口
require('./protocols');
require('./context-menu');
require('./menu-bar');
require('./crash-messages');
require('./demo')
// const {getCode} = require('../utils/global')
// import { getCode } from '../utils/global';
// const myFun =require('../utils/data.mjs').default
// (async () => {
//   const myModule = await import("../utils/data.mjs")
//   myModule.default()
// })();


// myFun()



// console.log(getCode());

let DEVList;
let isDownLoad;
let currentWifi=''

app.enableSandbox();
const { BrowserWindow } = require('electron');
const DesktopSettingsWindow = require('./windows/desktop-settings');
const e = require('connect-timeout');

let bluetoothPinCallback
let selectBluetoothCallback
require = require('esm')(module )

// const {getCode} = codeModule
let CODE='111';


const baseIp = "192.168.137."; // 你的电脑热点 IP 段（例如 192.168.137.X）
const port = 8082; // ESP32 运行 WebSocket 的端口
const TimeOut = 500; // 超时时间（毫秒）

let netTimer

function checkIp(ip) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(TimeOut);

        socket.on("connect", () => {
            console.log(`找到 ESP32: ${ip}`);
            socket.destroy();
            // socket.close()
            resolve(ip);
        });

        socket.on("error", () => {
            resolve(null);
        });

        socket.on("timeout", () => {
            resolve(null);
        });

        socket.connect(port, ip);
    });
}

async function scanNetwork() {
    const tasks = [];
    for (let i = 2; i < 255; i++) {
        tasks.push(checkIp(baseIp + i));
    }

    const results = await Promise.all(tasks);
    const espIp = results.find((ip) => ip !== null);

    if (espIp) {
        console.log(`ESP32 IP 地址: ${espIp}`);
        clearInterval(netTimer)
        // await new Promise(resolve => setTimeout(resolve, 1000));
        if(getSocket()){
            getSocket().send(JSON.stringify({
              type: 'whatIp',
              data: { message: espIp }
            }))
        }
    } else {
        console.log("未找到 ESP32");
    }
}

function createWindow () {
  const mainWindow = new BrowserWindow({
    width:550,
    height:500,
    title: `蓝牙连接`,
    // show:false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  mainWindow.webContents.openDevTools()

  mainWindow.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault()
    setLanyaList(deviceList)
    selectBluetoothCallback = callback
    DEVList=deviceList
    console.log(deviceList)

    mainWindow.webContents.send('device-list', deviceList)
    // const result = deviceList.find((device) => {
    //   return device.deviceName === 'xx Bricks3.34_45:be'
    // })
    // console.log(deviceList);
    
    // if (result) {
    //   callback(result.deviceId)
    // } else {
    //   // The device wasn't found so we need to either wait longer (eg until the
    //   // device is turned on) or until the user cancels the request
    // }
  })

  

  ipcMain.on('cancel-bluetooth-request', (event) => {
    // console.log("A:",getCode())
    selectBluetoothCallback('')
  })

  // Listen for a message from the renderer to get the response for the Bluetooth pairing.
  ipcMain.on('bluetooth-pairing-response', (event, response) => {
    bluetoothPinCallback(response)
  })

  mainWindow.webContents.session.setBluetoothPairingHandler((details, callback) => {
    bluetoothPinCallback = callback
    // Send a message to the renderer to prompt the user to confirm the pairing.
    mainWindow.webContents.send('bluetooth-pairing-request', details)
  })

  mainWindow.loadFile('index.html')
}

async function checkAndApplyCameraAccess(){
  
  const cameraPrivilege = systemPreferences.getMediaAccessStatus('camera')
  console.log(cameraPrivilege)
  if(cameraPrivilege!=='granted'){
    try{
      await systemPreferences.askForMediaAccess('camera')

      console.log('#################')
    }catch(error){
      console.log('camera filed'+error)
    }
  }
}

let stopServer
let extension;
let distance=[]
let isConnectBle='1'


function startServer(){
  // 创建 Express 应用程序
  const server = express();
  const limiter = new Bottleneck({
    maxConcurrent: 1, // 设置最大并发数为1，即一次只处理一个请求
    minTime: 500 // 可选：设置最小时间间隔，单位为毫秒
  });

  // 配置端口
  const port = 3000;

  // 指定文件路径
  const filePath = 'node_modules/scratch-vm/src/extensions/scratch3_hello_world/index.js';

  // 使用 body-parser 中间件解析请求体
  server.use(bodyParser.text());

  // 允许跨域请求
  server.use(cors());

  // 设置请求超时
  server.use(timeout('3s')); // 设置30秒超时
  server.use((req, res, next) => {
    if (!req.timedout) next();
  });
  // 定义接收数据的路由
  server.post('/save-data', limiter.wrap((req, res) => {
    const data = req.body;
    console.log(data)

     // 清空文件内容
    fs.truncate(filePath, 0, (err) => {
      if (err) {
        console.error('清空文件出错:', err);
        res.status(500).send('内部服务器错误');
        return;
      }

      // 写入新数据
      fs.appendFile(filePath, data + '\n', (err) => {
        if (err) {
          console.error('写入文件出错:', err);
          res.status(500).send('内部服务器错误');
        } else {
          res.status(200).send('数据已保存');
        }
      });
    });
    
  }));
  server.post('/get-code', limiter.wrap((req, res) => {
    const data = req.body;
    console.log(data)
    CODE=data
    
  }))
  server.get('/get',limiter.wrap((req,res)=>{
    console.log(CODE)
    res.status(200).send(CODE || '');
  }))

  //设置已选扩展
  server.post('/set-extension', limiter.wrap((req, res) => {
    extension=req.body
    console.log("extension"+extension)
  }));
  //获得已选扩展
  server.get('/get-extension', limiter.wrap((req, res) => {
    res.status(200).send(extension || 'No extension available'); // 如果extension未定义，则返回'No code available'
  }));

  server.get('/get-devicelist', limiter.wrap((req, res) => {
    res.status(200).send(DEVList || ''); 
  }));

  //是否下载代码
  server.post('/download', limiter.wrap((req, res) => {
    isDownLoad=req.body
    console.log("isdowbload"+isDownLoad)
  }));

  server.get('/get-download', limiter.wrap((req, res) => {
    res.status(200).send(isDownLoad || ''); 
  }));

  //互动
  server.post('/set-action', limiter.wrap((req, res) => {
    distance=req.body
    console.log("distance"+distance)
  }));

  server.get('/get-action', limiter.wrap((req, res) => {
    res.status(200).send(distance || ''); 
  }));

  //是否成功连接上蓝牙
  server.post('/set-ble', limiter.wrap((req, res) => {
    isConnectBle=req.body
    console.log("isConnectBle"+isConnectBle)
  }));

  server.get('/get-ble', limiter.wrap((req, res) => {
    res.status(200).send(isConnectBle || ''); 
  }));

  //当前wifi
  // server.post('/set-wifi', limiter.wrap((req, res) => {
  //   currentWifi=req.body
  // }));

  // server.get('/get-wifi', limiter.wrap((req, res) => {
  //   res.status(200).send(currentWifi || ''); 
  // }));

  //主控器是否添加
  server.get('/get-close', limiter.wrap((req, res) => {
    res.status(200).send(getCloseBn() || ''); 
  }));

  //wifi下载
  server.post('/wifi-down', limiter.wrap((req, res) => {
    // if(req.body=='0'){
    //   fetch(`http://192.168.4.1:8082/upload_script`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json;'
    //     },
    //     body: JSON.stringify({ // 将参数转换为 JSON 字符串
    //         script: CODE
    //     }),
    //   })
    //   .then(response => response.text())
    //   .then(data => {
    //     console.log('服务器响应:', data);
    //   })
    //   .catch(error => {
    //     console.error('错误:', error);
    //   });
    // }
    console.log(req.body)
    fetch(`http://192.168.4.1:8080/upload_script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;'
      },
      body: JSON.stringify({ // 将参数转换为 JSON 字符串
          script: req.body
      }),
    })
    .then(response => response.text())
    .then(data => {
      console.log('服务器响应:', data);
      let dataJson=JSON.parse(data)
      if(dataJson.status=='success'){
        res.send('111')
      }
      
    })
    .catch(error => {
      console.error('错误:', error);
    });
  }));

  //二维码数据
  server.post('/qr-down', limiter.wrap((req, res) => {
    console.log(req.body)
    fetch(`http://192.168.4.1:8080/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;'
      },
      body: JSON.stringify({ // 将参数转换为 JSON 字符串
        data: req.body
    }),
    })
    .then(response => response.text())
    .then(data => {
      console.log('服务器响应:', data);
    })
    .catch(error => {
      console.error('错误:', error);
      console.log('11111111111111111111')
    });
  }));

  //人脸检测
  server.post('/face-down', limiter.wrap((req, res) => {
    fetch(`http://192.168.4.1:8080/face_detection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: req.body
    })
    .then(response => response.text())
    .then(data => {
      console.log('服务器响应:', data);
    })
    .catch(error => {
      console.error('错误:', error);
    });
  }));

  //手势识别
  server.post('/hand-down', limiter.wrap((req, res) => {
    fetch(`http://192.168.4.1:8080/gesture_recognition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: req.body
    })
    .then(response => response.text())
    .then(data => {
      console.log('服务器响应:', data);
    })
    .catch(error => {
      console.error('错误:', error);
    });
  }));

  //物体识别
  server.post('/object-down', limiter.wrap((req, res) => {
    fetch(`http://192.168.4.1:8080/20_object`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;'
      },
      body: JSON.stringify({ // 将参数转换为 JSON 字符串
        data: req.body
    }),
    })
    .then(response => response.text())
    .then(data => {
      console.log('服务器响应:', data);
    })
    .catch(error => {
      console.error('错误:', error);
    });
  }));



  //wifi下载代理
 

  // 启动服务器
  server.listen(port, () => {
    console.log(`服务器已启动，正在监听端口 ${port}`);
    // 停止服务器的函数
    stopServer = () => {
      console.log('停止服务器...');
      process.exit(0); // 优雅地关闭服务器
    };
  });
}




// Allows certain versions of Scratch Link to work without an internet connection
// https://github.com/LLK/scratch-desktop/blob/4b462212a8e406b15bcf549f8523645602b46064/src/main/index.js#L45
app.commandLine.appendSwitch('host-resolver-rules', 'MAP device-manager.scratch.mit.edu 127.0.0.1');

app.on('session-created', async (session) => {
  // Permission requests are delegated to AbstractWindow
  // const win = new BrowserWindow({
  //   webPreferences: {
  //     nodeIntegration: true,
  //     contextIsolation: false
  //   }
  // });

  session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (!details.isMainFrame) {
      return false;
    }
    const window = AbstractWindow.getWindowByWebContents(webContents);
    if (!window) {
      return false;
    }
    const allowed = window.handlePermissionCheck(permission, details);
    return allowed;
  });

  session.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if (!details.isMainFrame) {
      callback(false);
      return;
    }
    const window = AbstractWindow.getWindowByWebContents(webContents);
    if (!window) {
      callback(false);
      return;
    }
    window.handlePermissionRequest(permission, details).then((allowed) => {
      callback(allowed);
    });
  });

  session.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url.toLowerCase();
    // Always allow devtools
    if (url.startsWith('devtools:')) {
      return callback({});
    }

    const webContents = details.webContents;
    const window = AbstractWindow.getWindowByWebContents(webContents);
    if (!webContents || !window) {
      // Background requests for things like loading service workers in iframes
      // are not associated with a specific webcontents, so we'll just have to
      // allow these to avoid breakage.
      return callback({});
    }

    window.onBeforeRequest(details, callback);
  });

  session.webRequest.onHeadersReceived((details, callback) => {
    const window = AbstractWindow.getWindowByWebContents(details.webContents);
    if (!window) {
      return callback({});
    }
    window.onHeadersReceived(details, callback);
  });

  session.on('will-download', (event, item, webContents) => {
    const options = {
      // The default filename is a better title than "blob:..."
      title: item.getFilename()
    };

    // Ensure that the type selector shows proper names on Windows instead of things like "SPRITE3 File"
    const extension = path.extname(item.getFilename()).replace(/^\./, '').toLowerCase();
    const translated = tranlateOrNull(`files.${extension}`);
    if (translated !== null) {
      options.filters = [
        {
          name: translated,
          extensions: [extension]
        }
      ];
    }

    item.setSaveDialogOptions(options);
  });
});

app.on('web-contents-created', (event, webContents) => {
  // Overwritten by AbstractWindow. We just set this here as a safety measure.
  webContents.setWindowOpenHandler((details) => ({
    action: 'deny'
  }));
});

app.on('window-all-closed', () => {
  if (!isMigrating) {
    stopServer()
    console.log('执行了')
    if(getWin()){
      getWin().close()
    }
    app.quit();
  }
});

// macOS
app.on('activate', () => {
  if (app.isReady() && !isMigrating && AbstractWindow.getWindowsByClass(EditorWindow).length === 0) {
    EditorWindow.newWindow();
  }
});

// macOS
const filesQueuedToOpen = [];
app.on('open-file', (event, path) => {
  event.preventDefault();
  // This event can be called before ready.
  if (app.isReady() && !isMigrating) {
    // The path we get should already be absolute
    EditorWindow.openFiles([path], '');
  } else {
    filesQueuedToOpen.push(path);
  }
});

/**
 * @param {string[]} argv
 * @returns {{files: string[]; fullscreen: boolean;}}
 */
const parseCommandLine = (argv) => {
  // argv could be any of:
  // turbowarp.exe project.sb3
  // electron.exe --inspect=sdf main.js project.sb3
  // electron.exe main.js project.sb3

  const files = argv
    // Remove --inspect= and other flags
    .filter((i) => !i.startsWith('--'))
    // Ignore macOS process serial number argument eg. "-psn_0_98328"
    // https://github.com/TurboWarp/desktop/issues/939
    .filter((i) => !i.startsWith('-psn_'))
    // Remove turbowarp.exe, electron.exe, etc. and the path to the app if it exists
    // defaultApp is true when the path to the app is in argv
    .slice(process.defaultApp ? 2 : 1);

  const fullscreen = argv.includes('--fullscreen');

  return {
    files,
    fullscreen
  };
};

let isMigrating = true;
let migratePromise = null;

app.on('second-instance', (event, argv, workingDirectory) => {
  migratePromise.then(() => {
    const commandLineOptions = parseCommandLine(argv);
    EditorWindow.openFiles(commandLineOptions.files, commandLineOptions.fullscreen, workingDirectory);
  });
});

// ipcMain.on('channel-name', (event, data) => {
//   console.log(data)
// })
app.whenReady().then(async() => {
  startServer()
  await checkAndApplyCameraAccess()
  const WSS = new WebSocket.Server({ port: 8081 });
  WSS.on('connection', (ws) => {
    setSocket(ws)
    ws.on('message', function incoming(message) {
      // console.log('Received from client:', message.toString());
      // console.log(JSON.parse(message).type)
      // console.log(JSON.parse(message).data.message)
      if(JSON.parse(message).type=='code'){
        fetch(`http://192.168.4.1:8080/upload_script`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;'
          },
          body: JSON.stringify({ // 将参数转换为 JSON 字符串
              script: JSON.parse(message).data.message
          }),
        })
        .then(response => response.text())
        .then(data => {
          console.log('服务器响应:', data);
          let dataJson=JSON.parse(data)
          if(dataJson.status=='success'){
            // res.send('111')
            // console.log('SUCCESS')
            ws.send(JSON.stringify({
              type:'wifiDown',
              data:{message:'success'}
            }))
          }else{
            ws.send(JSON.stringify({
              type:'wifiDown',
              data:{message:'error'}
            }))
          }
          
        })
        .catch(error => {
          console.error('错误:', error);
          ws.send(JSON.stringify({
            type:'wifiDown',
            data:{message:'error'}
          }))
        });
      }else if(JSON.parse(message).type=='offline'){
        // console.log('##############################################')
        Current.setWifi('')
      }
      
  });
  })
  const wss = new WebSocket.Server({ port: 8082 });
  // setWss(wss)
  let previousDistance = null;  // 保存上一次的距离数据
  wss.on('connection', (ws) => {
    setBricksSocket(ws)
    ws.on('message', function incoming(message) {
      console.log(message)
    })
      // setInterval(()=>{
      //   ws.send(`${getDistance()}`);
      // },1000)
       // 定期检查 getDistance() 的值是否发生变化
      // setInterval(() => {
      //   const currentDistance = getDistance();  // 获取当前的距离

      //   // 如果当前的距离与之前的不同，则发送新数据
      //   if (JSON.stringify(currentDistance) !== JSON.stringify(previousDistance)) {
      //     console.log('sending')
      //     // ws.send(`${currentDistance}`);
      //     ws.send(JSON.stringify(currentDistance))
      //     previousDistance = currentDistance;  // 更新保存的距离数据
      //   }
      // }, 100);  // 每 100 毫秒检查一次
      
  });
  // createWindow()



  const w = new WebSocket.Server({ port: 8084 });

  w.on('connection', (ws) => {
    setBricksMotor(ws)
    // ws.on('message', function incoming(message) {
    //   console.log(message)
    // })
  })
  setInterval(()=>{
    // console.log(AbstractWindow.getAllWindows().length)
    if(AbstractWindow.getAllWindows().length==0 && getWin()){
      // getWin().close()
      getWin().destroy()
    }
  },2000)

  app.on('activate', function () {
    // if (BrowserWindow.getAllWindows().length === 0){
      
    // } 
    
  })
  // ipcMain.on('toMain', (event, message) => {
  //   console.log(event)
  //   console.log(message)
  // })
  
  setInterval(()=>{
    if(currentEspIp.getIp() !=''){
      exec("arp -a", (error, stdout, stderr) => {
        if (error) {
            console.error(`ERROR: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        
        // console.log("device list：");
        const regex = /(\d+\.\d+\.\d+\.\d+)/g;
        const ips = stdout.match(regex);
        // console.log(ips);
        try{
          if(!ips.includes(currentEspIp.getIp())){
            currentEspIp.setIp('')
            if(getSocket()){
              getSocket().send(JSON.stringify({
                type: 'espIpStatus',
                data: { message: true }
              }))
            }
          }
        }catch(e){
          console.log(e)
        }
        
      });
    }
    
  },4000)
  AbstractWindow.settingsChanged();

  migratePromise = migrate().then((shouldContinue) => {
    if (!shouldContinue) {
      // If we use exit() instead of quit() then openExternal() calls made before the app quits
      // won't work on Windows.
      app.quit();
      return;
    }

    isMigrating = false;

    const commandLineOptions = parseCommandLine(process.argv);
    EditorWindow.openFiles([
      ...filesQueuedToOpen,
      ...commandLineOptions.files
    ], commandLineOptions.fullscreen, process.cwd());

    if (AbstractWindow.getAllWindows().length === 0) {
      console.log('aaaaaaaaaa')
      // No windows were successfully opened. Let's just quit.
      if(getWin()){
        getWin().close()
      }
      app.quit();
    }

    // checkForUpdates()
    //   .catch((error) => {
    //     // We don't want to show a full error message when updates couldn't be fetched.
    //     // The website might be down, the internet might be broken, might be a school
    //     // network that blocks turbowarp.org, etc.
    //     console.error('Error checking for updates:', error);
    //   });
  });
});
