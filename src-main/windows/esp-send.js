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
const path = require('path');


const history = require('../../utils/historyIp')
const {getSocket} = require('../../utils/socket')

let esptool
// require = require('esm')(module)
// esptool =require('../../utils/espTool')
const { exec } = require('child_process');
const net = require("net");
const QRCode = require('qrcode');

const si = require('systeminformation');
const netTimer=require('../../utils/timer');
// const { name } = require('file-loader');
const ssid = 'MyHotspot'; // Wi-Fi 名称
const password = '12345678'; // Wi-Fi 密码
const os = require('os');

const currentEspIp = require('../../utils/currentEspIp')
function hexToByteArray(hex) {
  const byteArray = [];
  for (let i = 0; i < hex.length; i += 2) {
    byteArray.push(parseInt(hex.substr(i, 2), 16));
  }
  return byteArray;
}


const baseIp = "192.168.137."; // 你的电脑热点 IP 段（例如 192.168.137.X）
const port = 8082; // ESP32 运行 WebSocket 的端口
const TimeOut = 500; // 超时时间（毫秒）



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
        currentEspIp.setIp(espIp)
        clearInterval(netTimer.getTimer())
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



class EspSendWindow extends AbstractWindow {
  constructor () {
    super();

    this.window.setTitle(`热点二维码 - ${APP_NAME}`);
    this.window.setMinimizable(false);
    this.window.setMaximizable(false);

    const ipc = this.window.webContents.ipc;
    ipc.on('get-std', (event) => {
      event.returnValue = {
        stdout:false
      }
    });

    ipc.handle('wifi-info', async (event, info) =>{


      try {
        
        // 生成 Wi-Fi 配置字符串
        const wifiConfig = `WIFI:T:WPA;S:${info.name};P:${info.password};;`;

        // 生成二维码（返回 Promise）
        const qrUrl = await QRCode.toDataURL(wifiConfig);

        console.log('📷 生成的二维码 URL:', qrUrl);

        if (netTimer.getTimer()) {
          clearInterval(netTimer.getTimer());
        }
        // console.log('##################')
        // netTimer=setInterval(()=>{
        //   scanNetwork()
        // },5000)
        netTimer.setTimer(setInterval(()=>{
            scanNetwork()
          },5000))
        // 返回二维码 URL 给渲染进程
        return qrUrl;



      } catch (err) {
          console.error('❌ 生成二维码失败:', err);
          throw err;
      }
    })


    ipc.handle('set-history', async (event, info) =>{
      history.setName(info.name)
      history.setPass(info.password)
    })


    ipc.on('get-history', (event) => {
      event.returnValue = {
        name:history.getName(),
        pass:history.getPass()
      }
    });

    // // 获取资源路径
    // function getResourcePath(relativePath) {
    //   if (app.isPackaged) {
    //     // 打包后
    //     return path.join(process.resourcesPath, 'utils', relativePath);
    //   } else {
    //     // 开发环境
    //     return path.join(__dirname, '../../utils', relativePath);
    //   }
    // }

    // //ESP32
    // const firmwareFilePath=getResourcePath('ICBricks_Master1.0_V3.3.4T2.bin')
    // const esptoolPath=getResourcePath('esptool.exe');

    // //Arduino
    // const hexFilePath = getResourcePath('sketch_nov20a.ino.hex');
    // const avrdudePath = getResourcePath('avrdude-v8.0-windows-x64/avrdude.exe');
    // const avrdudeConfPath = getResourcePath('avrdude-v8.0-windows-x64/avrdude.conf');


    // //ESP32
    // const firmwareFilePath=path.resolve(__dirname, '../../utils', 'ICBricks_Master1.0_V3.3.4T2.bin');
    // const esptoolPath = path.resolve(__dirname, '../../utils', 'esptool.exe');

    // //Arduino
    // const hexFilePath = path.resolve(__dirname, '../../utils', 'BareMinimum.ino.hex');
    // const avrdudePath = path.resolve(__dirname, '../../utils/avrdude-v8.0-windows-x64', 'avrdude.exe'); 
    // const avrdudeConfPath = path.resolve(__dirname, '../../utils/avrdude-v8.0-windows-x64', 'avrdude.conf');
    // ipc.handle('send-who', async (event, who) =>{



    //    // 生成二维码
    //    const wifiConfig = `WIFI:T:WPA;S:${ssid};P:${password};;`;
    //    QRCode.toDataURL(wifiConfig, (err, url) => {
    //        if (err) {
    //            console.error('❌ 生成二维码失败:', err);
    //            return;
    //        }
    //        console.log('📷 扫描二维码连接 Wi-Fi:', url);
    //    });

    //    // 设置 Wi-Fi 热点
    // exec(`netsh wlan set hostednetwork mode=allow ssid=${ssid} key=${password}`, (error, stdout, stderr) => {
    //     if (error) {
    //         console.error(`❌ 设置热点失败: ${error.message}`);
    //         return;
    //     }
    //     console.log('✅ 热点已创建:', ssid);

    //     // 启动 Wi-Fi 热点
    //     exec('netsh wlan start hostednetwork', (error, stdout, stderr) => {
    //         if (error) {
    //             console.error(`❌ 启动热点失败: ${error.message}`);
    //             return;
    //         }
    //         console.log('🚀 Wi-Fi 热点已开启!');

    //         // 生成二维码
    //         const wifiConfig = `WIFI:T:WPA;S:${ssid};P:${password};;`;
    //         QRCode.toDataURL(wifiConfig, (err, url) => {
    //             if (err) {
    //                 console.error('❌ 生成二维码失败:', err);
    //                 return;
    //             }
    //             console.log('📷 扫描二维码连接 Wi-Fi:', url);
    //         });
    //     });
    // });
      // console.log(who)
      // if(who=='esp32'){
      //   // console.log(getPort().settings.path)
      //   console.log(firmwareFilePath);
      //   console.log(esptoolPath);
        
        

      //   const command = `${esptoolPath} --port COM3 write_flash 0x0 ${firmwareFilePath}`;

      //   const options = { encoding: 'utf8' }; // 明确指定编码

      //   exec(command,options, (error, stdout, stderr) => {
      //     if (error) {
      //       console.error(`Error executing esptool: ${error}`);
      //       event.sender.send('esptool-result', { error: error.message });
      //       return;
      //     }
      //     console.log(`stdout: ${stdout}`);
      //     console.error(`stderr: ${stderr}`);
      //     event.sender.send('esptool-result', { stdout, stderr });
      //   });
      // }else if(who=='arduinoUno'){
      //   console.log('arduino')


      //   // // 配置串行端口
      //   // const portName = 'COM4'; // 根据你的系统修改为正确的串行端口
      //   // const baudRate = 115200; // Arduino通常使用115200波特率

      //   // // 读取.hex文件
      //   // const hexFilePath = 'D:/model/desktop-master/utils/BareMinimum.ino.hex';
      //   // const hexData = fs.readFileSync(hexFilePath, 'utf8');

      //   // // 解析.hex文件
      //   // const hex = IntelHex.parse(hexData);
      //   // console.log(hex.data)

      //   // // const bytes = hex.data.extractBlocks([0x00]).reduce((acc, block) => acc.concat(block.data), []);

      //   // // 创建串行端口实例
      //   // const port = new SerialPort({ path:portName,baudRate:baudRate,dataBits: 8, 
      //   //   stopBits: 1,
      //   //   parity: 'none' }, (err) => {
      //   //   if (err) {
      //   //     return console.error('Error opening port: ', err.message);
      //   //   }
      //   //   console.log('Port opened successfully');
      //   // });

      //   // // 打开串行端口后发送数据
      //   // port.on('open', () => {
      //   //   // 将解析后的.hex数据转换为字节数组
      //   //   // const bytes = hexToByteArray(hex.data);

      //   //   // 发送数据到Arduino
      //   //   port.write(hex.data, (err) => {
      //   //     if (err) {
      //   //       return console.error('Error writing to port: ', err.message);
      //   //     }
      //   //     console.log('Data sent successfully');
      //   //     port.close();
      //   //   });
      //   // });

      //   // // 处理串行端口错误
      //   // port.on('error', (err) => {
      //   //   console.error('Serial port error: ', err.message);
      //   // });




      //   const portName = 'COM40'; // 根据你的系统修改为正确的串行端口
      //   const baudRate = 115200;
      //   // const hexFilePath = 'D:/model/desktop-master/utils/StandardFirmata.ino.hex';
      //   // const avrdudePath = 'D:/model/desktop-master/utils/avrdude-v8.0-windows-x64/avrdude.exe'; // 根据你的系统路径修改
      //   // const avrdudeConfPath = 'D:/model/desktop-master/utils/avrdude-v8.0-windows-x64/avrdude.conf'; // 根据你的系统路径修改

      //   // 构建avrdude命令
      //   const command = `${avrdudePath} -C ${avrdudeConfPath} -v -p atmega328p -c arduino -P ${portName} -b ${baudRate} -D -U flash:w:${hexFilePath}:i`;

      //   // 执行avrdude命令
      //   exec(command, (error, stdout, stderr) => {
      //     if (error) {
      //       console.error(`Error executing command: ${error.message}`);
      //       event.sender.send('avrdude-result', { error: error.message });
      //       return;
      //     }
      //     if (stderr) {
      //       console.error(`Stderr: ${stderr}`);
      //       event.sender.send('avrdude-result', { stderr });
      //       return;
      //     }
      //     console.log(`Stdout: ${stdout}`);
      //     event.sender.send('avrdude-result', { stdout });
      //   });
      // }
    // })
   
    
    this.loadURL('esp-send://./esp-send.html');
  }

  getDimensions () {
    return {
      width: 550,
      height: 500
    };
  }

  getPreload () {
    return 'esp-send';
  }

  isPopup () {
    return true;
  }

  static show (espTool) {
    console.log(JSON.parse(espTool))
    // esptool = espTool
    const window = AbstractWindow.singleton(EspSendWindow);
    window.show();
  }
}

module.exports = EspSendWindow;
