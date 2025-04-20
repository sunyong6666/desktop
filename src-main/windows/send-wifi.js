const {app, shell} = require('electron');
const AbstractWindow = require('./abstract');
const {translate, getStrings, getLocale} = require('../l10n');
const {APP_NAME} = require('../brand');
const settings = require('../settings');
const {isUpdateCheckerAllowed} = require('../update-checker');
const RichPresence = require('../rich-presence');

const { SerialPort } = require('serialport');
const IntelHex = require('intel-hex');
const fs = require('fs');
// const parser = require('@serialport/parser-readline');
const {setPort,getPort} = require('../../utils/port')
const axios = require('axios');
const {ipcMain}=require('electron/main')

const {getSocket} = require('../../utils/socket')
const WebSocket = require('ws');
const iconv = require('iconv-lite');

const currentWifi=require('../../utils/currentWifi')

const { exec } = require('child_process');

const si = require('systeminformation');

const netTimer=require('../../utils/timer')

const wifi = require('node-wifi');
const os = require('os');



function detectPreferredInterface() {
  return new Promise((resolve, reject) => {
    exec('netsh wlan show interfaces', { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ ERROR: ${error.message}`);
        return reject(error);
      }

      if (stderr) {
        console.error(`⚠️ stderr: ${stderr}`);
        // 可以选择继续，也可以 reject
      }

      // 正则匹配像 WLAN 1、WLAN 5 等接口名
      const regex = /WLAN\s*\d+/i;
      const match = stdout.match(regex);
      const preferredInterface = match ? match[0].trim() : null;

      console.log('✅ Detected interface:', preferredInterface);
      resolve(preferredInterface);
    });
  });
}

detectPreferredInterface()
  .then(iface => {
    wifi.init({ iface });  // null 会自动用默认接口
    console.log('📶 Using interface:', iface || '(default)');
  })
  .catch(err => {
    console.error('❌ Failed to detect interface:', err);
  });




class SendWifiWindow extends AbstractWindow {
  constructor () {
    super({
      webPreferences: {
        nodeIntegration: true, // 需要与预加载脚本配合
        contextIsolation: false, // 先关闭排查问题
        enableRemoteModule: true, // 允许渲染进程使用 remote
        webviewTag: true // 启用 webview 支持
      }
    });
    

    this.window.setTitle(`wifi连接 - ${APP_NAME}`);
    this.window.setMinimizable(false);
    this.window.setMaximizable(false);

    const ipc = this.window.webContents.ipc;

    // ipc.handle('send-num', async (event, num) =>{
    //     sendNumPost(num)
    // })
    
     // 扫描 Wi-Fi 网络
    ipc.handle('scan-wifi', async () => {
      // exec('netsh wlan show networks', (error, stdout, stderr) => {
      //   if (error) {
      //       console.error(`exec error: ${error}`);
      //       return;
      //   }
      //   console.log(`stdout: ${stdout}`);
      //   console.error(`stderr: ${stderr}`);
      // });
      return new Promise((resolve, reject) => {
        
        wifi.scan((error, networks) => {
          if (error) {
            reject(error);
          } else {
            resolve(networks);  // 返回可用的 Wi-Fi 网络列表
          }
        });
      });
    });

    ipc.on('current-wifi', (event) => {
      event.returnValue = {
        wifi: currentWifi.getWifi(),
      }
    });


  //   function checkNetworkStatus() {
  //     const interfaces = os.networkInterfaces();
  //     let isConnected = false;
  
  //     for (const key in interfaces) {
  //         for (const net of interfaces[key]) {
  //             if (!net.internal && net.family === 'IPv4' && net.address !== '127.0.0.1') {
  //                 isConnected = true;
  //                 break;
  //             }
  //         }
  //     }
  //     if(!isConnected){
  //       currentWifi.setWifi('')
  //     }
  
  //     console.log(isConnected ? 'connected' : 'disconnected');
  // }
  
  // setInterval(checkNetworkStatus, 2000); // 每 2 秒检查一次


  async function checkWifi() {
    try {
      const interfaces = await si.networkInterfaces();
      const wifiInterface = interfaces.find(iface => 
        iface.type === 'wireless' && iface.operstate === 'up'
      );
      return !!wifiInterface;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  }


  // setInterval(() => {
  //   checkWifi().then(connected => {
  //     // console.log('WiFi connected:', connected);
  //     if(!connected){
  //       currentWifi.setWifi('')
  //     }
  //   });
  // },8000)

    function checkNetworkInterface(ssid) {
      const interfaces = os.networkInterfaces();
      for (let iface in interfaces) {
        for (let details of interfaces[iface]) {
          if (details.family === 'IPv4' && !details.internal) {
            console.log(`Connected Wi-Fi IP: ${details.address}`);
            return true;  // 设备成功获取了 IP，说明连上 Wi-Fi
          }
        }
      }
      return false;  // 设备没有获取 IP，说明 Wi-Fi 可能没连上
    }
    // 连接到 Wi-Fi
    ipc.handle('connect-wifi', async (event, ssid, password) => {
      return new Promise((resolve, reject) => {
        // 检查是否是开放网络（没有密码）
        wifi.getCurrentConnections((error, currentConnections) => {
          if (error) {
            reject(error);
          } else {
            const currentNetwork = currentConnections.find(conn => conn.ssid === ssid);
            if (currentNetwork && currentNetwork.security === 'none') {
              // 无密码网络，直接连接
              wifi.connect({ ssid: ssid }, (error) => {
                if (error) {
                  reject(error);  // 如果连接失败，返回错误
                } else {
                  currentWifi.setWifi(ssid)
                  resolve('Connected to open Wi-Fi network');  // 连接成功
                }
              });
            } else {
              // 有密码的网络，要求用户输入密码
              if (password) {
                wifi.connect({ ssid: ssid, password: password }, (error) => {
                  if (error) {
                    reject(error);  // 如果连接失败，返回错误
                  } else {
                     // **等待 5 秒，确保 Wi-Fi 连接状态更新**
                    // setTimeout(() => {
                    //   if (checkNetworkInterface(ssid)) {
                    //     currentWifi.setWifi(ssid)
                    //     resolve("连接成功!");
                    //   } else {
                    //     reject("网络已被连接");
                    //   }

                      
                    // }, 3000);

                    checkWifi().then(connected => {
                      if(connected){
                        currentWifi.setWifi(ssid)
                        clearInterval(netTimer.getTimer())
                        if(getSocket()){
                          console.log('可能发送了')
                          getSocket().send(JSON.stringify({
                            type: 'whatIp',
                            data: { message: '192.168.4.1' }
                          }))
                        }
                        resolve("连接成功!");
                      }else{
                        reject("网络连接失败");
                      }
                    });
                    // currentWifi.setWifi(ssid)
                    // resolve('Connected');  // 连接成功
                  }
                });
              } else {
                reject('Password is required for this network');
              }
            }
          }
        });
      });
    });


     // 监听来自渲染进程的消息
    ipc.handle('whatssid', async (event, arg) => {
      console.log('收到消息:', arg);
      return currentWifi.getWifi()

      // return new Promise((resolve, reject) => {
      //   wifi.getCurrentConnections((error, currentConnections) => {
      //     if (error) {
      //       console.error('获取当前 Wi-Fi 连接失败:', error);
      //       reject(error);
      //       return;
      //     }
    
      //     if (currentConnections.length > 0) {
      //       let ssid = currentConnections[0].ssid;
    
      //       // **强制转换编码为 UTF-8**
      //       ssid = iconv.decode(Buffer.from(ssid, 'binary'), 'utf-8');
    
      //       console.log('当前连接的 Wi-Fi SSID:', ssid);
      //       resolve(ssid);
      //     } else {
      //       console.log('当前未连接到 Wi-Fi');
      //       resolve(null);
      //     }
      //   });
      // });
      
    });

    ipc.handle('close', async (event, flag) => {
      if(flag){


        // if(getSocket()){
        //   console.log('postMessage')
        //   getSocket().send(JSON.stringify({
        //     type: 'wifi',
        //     data: { message: true }
        //   }))
        // }
        if (this.window && !this.window.isDestroyed()) {
          setTimeout(() => {
            this.window.close();
          }, 200); // 添加短暂延迟确保用户体验
        }

       
      }
    })



    ipc.handle('disConn', async (event) => {
      console.log('--------------------------')
      // 断开当前连接的 Wi-Fi 网络
      currentWifi.setWifi('')
      wifi.disconnect((err) => {
        if (err) {
            console.error('断开连接失败:', err);
            return;
        }
        console.log('成功断开当前 Wi-Fi 网络');
      });
    })

    ipc.handle('change-name', async (event,name) => {

      // let jsonData={
      //   "command": "update_ap",
      //   "params": 
      //    {
      //       "ssid": name,
      //   }
      // }
      
      // const Socket = new WebSocket('ws://192.168.4.1:8084');
                    
      // Socket.addEventListener('open', (event) => {


      //   Socket.send(JSON.stringify(jsonData))
        

      // });

      // Socket.addEventListener('message', (event) => {
      //   if(event.data=='success'){
      //     Socket.close()
      //   }
          
      // })

      return new Promise((resolve, reject) => {
        let jsonData = {
            "command": "update_ap",
            "params": {
                "ssid": name,
            }
        };

        const Socket = new WebSocket('ws://192.168.4.1:8084');

        // 监听 WebSocket 连接打开事件
        Socket.addEventListener('open', () => {
            Socket.send(JSON.stringify(jsonData));
        });

        // 监听 WebSocket 消息事件
        Socket.addEventListener('message', (event) => {
            if (event.data === 'success') {
                console.log('success')
                Socket.close();
                resolve(true); // 成功后返回 true
            }
        });
      })

    })
    this.loadURL('send-wifi://./send-wifi.html');
  }

  getDimensions () {
    return {
      width: 550,
      height: 500
    };
  }

  getPreload () {
    return 'send-wifi';
  }

  isPopup () {
    return true;
  }

  static show () {
    const window = AbstractWindow.singleton(SendWifiWindow);
    window.show();
  }
}

module.exports = SendWifiWindow;
