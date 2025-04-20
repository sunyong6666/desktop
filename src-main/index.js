const {app,session} = require('electron');
const {SerialPort} = require('serialport')
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
const {setPort,getPort} = require('../utils/port')

const currentEspIp=require('../utils/currentEspIp')
const {getCloseBn,setCloseBn} = require('../utils/closeBn')

const {setSocket,getSocket,setBricksSocket,setBricksMotor} = require('../utils/socket')

const {systemPreferences} = require('electron')

// const wifi = require('node-wifi');
const Current=require('../utils/currentWifi')

const net = require("net");
const { exec } = require("child_process");
// 初始化 wifi 模块
// wifi.init({ iface: null });  // null 会选择默认的 Wi-Fi 接口
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

// const targetIP = "192.168.1.100";
const targetPort = 80; // 目标设备的端口

function checkOnline() {
    const socket = new net.Socket();
    socket.setTimeout(2000); // 设置 2 秒超时

    socket.connect(targetPort, currentEspIp.getIp(), () => {
        console.log(`${currentEspIp.getIp()}:${targetPort} online`);
        socket.destroy();
    });

    socket.on("error", () => {
        console.log(`${currentEspIp.getIp()}:${targetPort} offline`);
        socket.destroy();
    });

    socket.on("timeout", () => {
        console.log(`${currentEspIp.getIp()}:${targetPort} timeout`);
        socket.destroy();
    });
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
// app.commandLine.appendSwitch('host-resolver-rules', 'MAP device-manager.scratch.mit.edu 127.0.0.1');
app.commandLine.appendSwitch('proxy-server', 'http=127.0.0.1:8888;https=127.0.0.1:8888');

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
  // 启用必要的命令行开关
  app.commandLine.appendSwitch('enable-experimental-web-platform-features');
  // 配置USB权限
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'usb') callback(true);
    else callback(true);
  });
  startServer()
  await checkAndApplyCameraAccess()
  const WSS = new WebSocket.Server({ port: 8081 });
  WSS.on('connection', (ws) => {
    setSocket(ws)
    ws.on('message', async function incoming(message) {
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
      }else if(JSON.parse(message).type=='port'){
        let str=JSON.parse(message).data.message+'\n'
        console.log(typeof str)
        if(getPort()){
          await getPort().write(str, (err) => {
            if (err) {
              return reject('Error on write: ' + err.message);
            }
  
            console.log(`Data sent: ${str}`);
          });
        }
        
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
    // console.log(AbstractWindow.getAllWindows()[0].constructor.name)
    try{

      // console.log(AbstractWindow.getAllWindows())
      if(AbstractWindow.getAllWindows().length==0 && getWin()){
        // getWin().close()
        getWin().destroy()
      }
      if(AbstractWindow.getAllWindows()[0].constructor.name!='EditorWindow'){
        AbstractWindow.getAllWindows().forEach((win)=>{
          // console.log(win)
          win.window.close()
        })
      }
      
    }catch(e){
      console.log(e)
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
  let failureCount = 0;  // 失败计数器

  function isDeviceConnected(ip) {
      return new Promise((resolve) => {
          exec(`ping -n 1 -w 500 ${ip}`, (error, stdout) => { // Windows: -n 1, Linux/macOS: -c 1
              if (error) {
                  resolve(false); // 无法 ping 通，设备可能未连接
              } else {
                  resolve(true); // 设备在线
              }
          });
      });
  }
  setInterval(()=>{
    if(currentEspIp.getIp() !=''){
      // checkOnline()
      // isDeviceConnected(currentEspIp.getIp()).then((isConnected) => {
      //   console.log(`设备 ${currentEspIp.getIp()} 是否在线: ${isConnected}`);
        
      //   if (isConnected) {
      //     // 如果 ping 通了，重置失败计数器
      //     failureCount = 0;
      //   } else {
      //       // 如果 ping 不通，增加失败计数
      //       failureCount++;

      //       if (failureCount >= 3) {
      //           // 连续三次 ping 不通，执行操作
      //           currentEspIp.setIp('');
      //           if (getSocket()) {
      //               getSocket().send(JSON.stringify({
      //                   type: 'espIpStatus',
      //                   data: { message: true }
      //               }));
      //           }
      //           // 重置计数器
      //           failureCount = 0;
      //       }
      //   }
      // });

      
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

    
  },3000)
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






//---------------------------------------





let currentConnectedPort = null;

let activeConnections = new Map() // 使用Map管理连接

let replDataListener = null;// 串口数据监听器



//设备扫描

// ipcMain.handle('usb-request-device', async () => {

//   try {

//     const usb = require('usb');

//     const devices = usb.getDeviceList(); 



//     //过滤Microbit

//     const microbitDevices = devices.filter(device => 

//       device.deviceDescriptor.idVendor === 0x0d28 && 

//       (device.deviceDescriptor.idProduct === 0x0204 || device.deviceDescriptor.idProduct === 0x0205)

//     );



//     const simpleDevices = microbitDevices.map(device => ({

//       vendorId: device.deviceDescriptor.idVendor,

//       productId: device.deviceDescriptor.idProduct,

//       serialNumber: '',

//       deviceClass: device.deviceDescriptor.bDeviceClass

//     })); 



//     //返回结果

//     return { 

//       success: true, 

//       devices: simpleDevices,

//       selectedDevice: simpleDevices[0] // 默认选择第一个micro:bit设备

//     };

//   } catch (err) {

//     console.error('USB device error:', err);

//     return { success: false, error: err.message };

//   }

// });



ipcMain.handle('usb-request-device', async () => {

  try {

    const ports = await SerialPort.list();



    //过滤Micro:bit设备

    const microbitPorts = ports.filter(port => {

      const isMicrobit = port.vendorId === '0D28' && ['0204', '0205'].includes(port.productId);

      // 同时匹配COM端口名称

      return isMicrobit && /^COM\d+/i.test(port.path);

    });





    // 格式化返回数据

    const devices = microbitPorts.map(port => ({

      vendorId: parseInt(port.vendorId, 16), // 转换为十进制

      productId: parseInt(port.productId, 16),

      serialNumber: port.serialNumber || '',

      comPort: port.path, // 直接使用检测到的COM端口

      manufacturer: port.manufacturer || 'Micro:bit'

    }));





    return {

      success: true,

      devices,

      selectedDevice: devices[0] // 默认选择第一个设备

    };



  } catch (err) {

    console.log('设备扫描失败:', err);

    return { 

      success: false, 

      error: err.message,

      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })

    };

  }

});







//设备连接

// ipcMain.handle('usb-connect-device', async (event, deviceInfo) => {

//   try {

//     const usb = require('usb');

//     const device = usb.findByIds(deviceInfo.vendorId, deviceInfo.productId);

//     if (!device) {

//       throw new Error('设备未找到');

//     }

//     device.open();

//     currentConnectedDevice = {

//       ...deviceInfo,

//       deviceHandle: device

//   };

//     return { success: true, device: deviceInfo };

//   } catch (err) {

//     return { success: false, error: err.message };

//   }

// });



ipcMain.handle('usb-connect-device', async (event, deviceInfo) => {

  try {

    // 先清理可能存在的旧连接

    await cleanupConnection();



    if (!deviceInfo.comPort) {

      throw new Error('该设备没有可用的COM端口');

    }



    // 验证端口是否存在

    const ports = await SerialPort.list();

    const portExists = ports.some(p => p.path === deviceInfo.comPort);

    if (!portExists) {

      throw new Error(`COM端口 ${deviceInfo.comPort} 不可用`);

    }



    // 创建并打开串口连接

    const port = new SerialPort({

      path: deviceInfo.comPort,

      baudRate: 115200,

      autoOpen: false

    });



    await new Promise((resolve, reject) => {

      port.open(err => {

        if (err) reject(new Error(`无法打开串口: ${err.message}`));

        else resolve();

      });

    });



    currentConnectedPort = port;



    // 监听断开或异常

    currentConnectedPort.on('close', () => {

      console.warn('[串口已关闭]');

      cleanupConnection().catch(console.error);

      notifyRenderer('usb-device-disconnected', { comPort: deviceInfo.comPort });

      currentConnectedPort = null;

    });



    currentConnectedPort.on('error', (err) => {

      console.error('[串口错误]', err);

      cleanupConnection().catch(console.error);

      notifyRenderer('usb-device-error', err.message);

    });



    // 通知前端设备已连接

    notifyRenderer('usb-device-connected', { comPort: deviceInfo.comPort });



    return { 

      success: true,

      comPort: deviceInfo.comPort 

    };

  } catch (err) {

    currentConnectedPort = null;

    return { 

      success: false, 

      error: err.message,

      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })

    };

  }

});







//断开功能

ipcMain.handle('usb-disconnect-device', async () => {

  try {

    if (!currentConnectedPort) {

      throw new Error('没有已连接的串口设备');

    }



    //关闭数据监听器

    await cleanupConnection();



    // 安全关闭串口连接

    await new Promise((resolve) => {

      currentConnectedPort.close(err => {

        if (err) {

          console.error('关闭串口时出错:', err);

          // 强制释放资源

          currentConnectedPort = null;

          throw err;

        }

        resolve();

      });

    });



    // 释放资源

    currentConnectedPort = null;



    return { success: true, message: '设备已断开连接' };

  } catch (err) {

    return { success: false, error: err.message };

  }

});





// 清理所有资源的通用方法

async function cleanupConnection() {

  if (replDataListener) {

    stopReplListener();

  }

  

  // if (currentConnectedPort) {

  //   await safeClosePort(currentConnectedPort);

  //   currentConnectedPort = null;

  // }

}





//进入REPL模式-自动启动监听

ipcMain.handle('usb-enter-repl', async () => {

  try {

    if (!currentConnectedPort) {

      throw new Error('没有已连接的串口设备');

    }



    // 中断当前程序

    await sendSerialCommand('\x03', 200); 

    await sendSerialCommand('from microbit import *\n\r', 200);

    



    // 定义指令序列

    const commandSequence = [

      { command: 'from ICreate import *\n\r', delay: 200 }

     ];



    // 执行指令序列

    for (const { command, delay } of commandSequence) {

      await new Promise((resolve) => {

        currentConnectedPort.write(command, () => {

          setTimeout(resolve, delay);

        });

      });

    }



    await sendSerialCommand('display.show(Image.HEART)\n\r', 100);



    //设置监听器

    startReplListener();

    return { 

      success: true,

      message: 'REPL模式已激活',

      comPort: currentConnectedPort.path

    };



  } catch (err) {

    return { success: false, error: err.message };

  }

});







//退出REPL模式

ipcMain.handle('usb-exit-repl', async () => {

  try {

    if (!currentConnectedPort) {

      throw new Error('没有已连接的串口设备');

    }



    // 定义指令序列

    const commandSequence = [

      { command: '\x03', delay: 100 }, 

      { command: '\x04', delay: 100 }

    ];



    // 执行指令序列

    for (const { command, delay } of commandSequence) {

      await new Promise((resolve) => {

        currentConnectedPort.write(command, () => {

          setTimeout(resolve, delay);

        });

      });

    }



    //关闭数据监听器

    await stopReplListener();

    return { success: true, message: '烧录模式已激活'};

  } catch (err) {

    return { success: false, error: err.message };

  }

});





// 发送串口命令并等待完成

function sendSerialCommand(command, delayMs = 50) {

  return new Promise((resolve) => {

    currentConnectedPort.write(command, () => {

      setTimeout(resolve, delayMs);

    });

  });

}





let serialBuffer = '';//此次发送回显信息

let currentResolve = null;//通知完成

//repl发送代码

ipcMain.handle('usb-send-command', async (event, command) => {

  try {

    if (!currentConnectedPort) {

      return { success: false, error: "未连接设备" };

    }

    serialBuffer = ''; // 清空上次结果

    currentConnectedPort.write(command + '\r');//发送



    const response = await new Promise((resolve, reject) => {

      currentResolve = (data) => {

        currentResolve = null;

        resolve(data);

      };

    

      // 超时保护5秒

      // setTimeout(() => {

      //   if (currentResolve) {

      //     currentResolve = null;

      //     reject(new Error('串口等待超时'));

      //   }

      // }, 2000);

    });



    // 控制发送速率

    await new Promise(resolve => setTimeout(resolve, 50));



    return { success: true, response: response.trim() };

  } catch (err) {

    return { success: false, error: err.message };

  }

});



// 启动数据监听器

function startReplListener() {

  if (replDataListener) return;



  replDataListener = (data) => {

    serialBuffer += data.toString('utf-8');

    if (serialBuffer.includes('>>>') && currentResolve) {

      const resolvedData = serialBuffer;

      serialBuffer = '';

      currentResolve(resolvedData); // 通知外部命令完成

      currentResolve = null;

    }

  };



  currentConnectedPort.on('data', replDataListener);

  console.log('Serial Listener Open');

}



// 关闭数据监听器

function stopReplListener() {

  if (!replDataListener) return;



  currentConnectedPort.off('data', replDataListener);

  replDataListener = null;

  console.log('串口监听已停止');

}









// 通知前端

function notifyRenderer(channel, payload) {

  const win = BrowserWindow.getAllWindows()[0];

  if (win && win.webContents) {

    win.webContents.send(channel, payload);

  }

}





//烧录相关功能

ipcMain.handle('usb-flash-hex', async (event, { hexData, boardId }) => {

  try {

    return { success: true };

  } catch (err) {

    return { success: false, error: err.message };

  }

});







// 存储空间信息

ipcMain.handle('usb-get-storage-info', async () => {

  try {

    return { 

      success: true,

      totalSize: 256 * 1024, // 示例值

      usedSize: 128 * 1024,  // 示例值

      freeSize: 128 * 1024   // 示例值

    };

  } catch (err) {

    return { success: false, error: err.message };

  }



});







// const { DAPLink } = require('dapjs');

const intelHex = require('intel-hex');

const { usb } = require('usb');



const util = require('util');

const execPromise = util.promisify(exec); // 必须在函数调用前定义





//获取固件

function getFirmwarePath() {

  // 开发环境

  if (!app.isPackaged) {

    return path.join(__dirname, '../microbit_firmware/MICROBIT.hex')

  }

  // 生产环境

  return path.join(process.cwd(), 'microbit_firmware/MICROBIT.hex')

}



const FIRMWARE_PATH = getFirmwarePath();





ipcMain.handle('usb-flash-firmware', async () => {

  try {

    if (!fs.existsSync(FIRMWARE_PATH)) {

      throw new Error(`固件文件不存在`);

    }



    // 检测Micro:bit驱动器

    console.log(2)

    const drivePath = await detectMbitDrive();

    if (!drivePath) {

      throw new Error('请重新拔插');

    }



    //执行烧录

    console.log(3)

    const destPath = path.join(drivePath, 'firmware.hex');

    //await fs.promises.copyFile(FIRMWARE_PATH, destPath);

    const readStream = fs.createReadStream(FIRMWARE_PATH);

    const writeStream = fs.createWriteStream(destPath);

    let bytesCopied = 0;

    const totalBytes = (await fs.promises.stat(FIRMWARE_PATH)).size;



    readStream.on('data', (chunk) => {

      bytesCopied += chunk.length;

      const percent = Math.floor((bytesCopied / totalBytes) * 100);

      console.log(percent)

      //mainWindow.webContents.send('flash-progress', percent);

    });



    await new Promise((resolve, reject) => {

      readStream.pipe(writeStream)

        .on('finish', resolve)

        .on('error', reject);

    });



    return { success: true, drivePath };



  } catch (err) {

    return {

      success: false,

      error: cleanError(err.message), // 错误信息清理

      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })

    };

  }

});







// 扫描设备

async function detectMbitDrive() {

  try {

    // 方法1：使用WMIC（兼容所有Windows版本）

    const { stdout } = await execPromise('wmic logicaldisk where "VolumeName=\'MICROBIT\'" get DeviceID');

    const driveLetter = stdout.split('\n')[1]?.trim();

    

    if (driveLetter) {

      return `${driveLetter}\\`; // 返回如 "E:\\"

    }



    // 方法2：使用PowerShell（Win10+更可靠）

    const { stdout: psOut } = await execPromise(

      'powershell "Get-Volume -FileSystemLabel \'MICROBIT\' | Select -ExpandProperty DriveLetter"'

    );

    const psDrive = psOut.trim();

    

    if (psDrive) {

      return `${psDrive}:\\`;

    }



    // 方法3：遍历所有盘符

    const { stdout: allDrives } = await execPromise('wmic logicaldisk get DeviceID,VolumeName');

    const driveLine = allDrives.split('\n')

      .find(line => line.includes('MICROBIT'));

    

    if (driveLine) {

      return `${driveLine.substring(0, 2)}\\`;

    }



    return null;

  } catch (err) {

    console.error('驱动器检测失败:', err);

    return null;

  }

}





function cleanError(msg) {

  return msg.replace(FIRMWARE_PATH, '[FIRMWARE]');

}