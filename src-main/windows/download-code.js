const {app, shell} = require('electron');
const AbstractWindow = require('./abstract');
const {translate, getStrings, getLocale} = require('../l10n');
const {APP_NAME} = require('../brand');
const settings = require('../settings');
const {isUpdateCheckerAllowed} = require('../update-checker');
const RichPresence = require('../rich-presence');

const { SerialPort } = require('serialport');
const { exec } = require('child_process');
const path = require('path');
// const {setCode,getCode} = require('../../utils/global');
// import {setCode,getCode} from '../../utils/global';
// const parser = require('@serialport/parser-readline');
const {getPort} =require('../../utils/port')
// const {code}= require('../../utils/bridge')
// require('../../utils/global')



let CODE=''
let Place=''
let Name=''
function stringToBinary(str) {
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(str);
  return uint8Array;
}

function startMsg(){
  let msg=[0xAF,0x04,0x96,0x00,0x01,0x4a]
  return msg;
}

function nameMsg(){
  let msg=[0xAF,0x1C,0x00,0x06]
  return msg;
}

function timeMsg(){
  let msg=[0xAF,0x1C,0x01,0x06]
  return msg;
}

function codeMsg(){
  let msg=[0xAF,0x1C,0x02,0x06];
  return msg;
}

function endMsg(){
  let msg=[0xAF,0x04,0x96,0x00,0x00,0x49]
  return msg;
}

function binToByteArray(binaryString) {
  // 确保二进制字符串的长度为 16 位
  if (binaryString.length !== 16) {
      binaryString = binaryString.padStart(16, '0');
  }

  const byte1 = parseInt(binaryString.substring(0, 8), 2);
  const byte2 = parseInt(binaryString.substring(8, 16), 2);

  return new Uint8Array([byte1, byte2]);
}

function codeSlice(start,end,code){
  return code.slice(start,end);
}
let isContinue='0'

class DownloadCodeWindow extends AbstractWindow {
  constructor () {
    super();

    this.window.setTitle(`代码下载 - ${APP_NAME}`);
    this.window.setMinimizable(false);
    this.window.setMaximizable(false);

    let PORT = getPort();
    // PORT.on('data', (data) => {
    //     console.log('Received data:', data.toString()); // 将 Buffer 转换为字符串
    //     isContinue=data.toString()
    // });
    
    // 发送数据并等待接收特定数据后再继续
    async function sendDataAndWait(dataToSend) {
      return new Promise(async (resolve, reject) => {
        // 发送数据
        await PORT.write(dataToSend, (err) => {
          if (err) {
            return reject('Error on write: ' + err.message);
          }

          console.log(`Data sent: ${dataToSend}`);
        });

        // 等待接收到的数据
        // await PORT.on('data', (data) => {
        //   console.log('Data received:', data.toString());
        //   console.log(typeof(data.toString()))

        //   // 检查是否是我们想要的响应（例如，'0'）
        //   if (data.toString().includes('71')) {
        //     console.log('Received 71, continuing...');
        //     PORT.removeListener('data');
        //     resolve(); // 继续执行
        //   }
        // });
        const onDataReceived = (data) => {
          console.log('Data received:', data.toString());
          console.log(typeof (data.toString()));
        
          // 检查是否是我们想要的响应（例如，'0'）
          if(data.toString().includes('74')){
            console.log('Received 74, completed');
            PORT.removeListener('data', onDataReceived); // 使用 removeListener 停止监听
            resolve(); // 继续执行
          }else if (data.toString().includes('71')) {
            console.log('Received 71, continuing...');
            PORT.removeListener('data', onDataReceived); // 使用 removeListener 停止监听
            resolve(); // 继续执行
          }
        };
        
        PORT.on('data', onDataReceived); // 添加 data 事件的监听器

        // 可选：添加一个超时机制，防止长时间等待
        setTimeout(() => {
          reject('Timeout: No response received in time.');
        }, 5000); // 5秒超时
      });
    }

    const ipc = this.window.webContents.ipc;

    ipc.on('get-code', (event) => {
      event.returnValue = {
        CODE
      }
    });

    const execFile=path.resolve(__dirname, '../../utils', 'syntax_checker.exe');

    function checkPythonSyntax(code) {
      return new Promise((resolve, reject) => {
        const child = exec(execFile, (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }
          try {
            const errors = JSON.parse(stdout);
            resolve(errors);
          } catch (e) {
            reject(e);
          }
    
        });
        child.stdin.write(code);
        child.stdin.end()
      });
    }
    ipc.handle('send-code',(event,code)=>{
      // exec(`${execFile} ${code}`, (error, stdout, stderr) => {
      //   if (error) {
      //       console.error('Error:', error);
      //       return;
      //   }

      //   const result = JSON.parse(stdout);
      //   console.log(result)
      // });

      checkPythonSyntax(code)
      .then(errors => {
        console.log(errors);
      })
      .catch(error => {
        console.error(error);
      });
    })

    ipc.handle('send-place-name', async (event, place,name) =>{

      const encoder = new TextEncoder();
      const data1 = encoder.encode('Lua:').buffer;
      const data2=encoder.encode('aaaaaaa').buffer
      let code=`while(true)
do
  L1(0,255,0,0)
  D1(1)
  L1(0,0,29,255)
  D1(1)

end`
      sendDataAndWait('Lua:').then(() => {
        sendDataAndWait(code).then(() => {
          sendDataAndWait('endLua')
        })
      })

      // console.log(place);
      // console.log(name);
      // Place=place
      // Name=name

      // let NAME=Place+'_'+Name+'.py'
      // const data1 = new Uint8Array(startMsg());

      // //名称请求信息（固定不变）
      // let nameM = nameMsg();
      // let Nam = stringToBinary(NAME);
      // let j = 0;
      // for (let i = 4; i < 29; i++) {
      //   if (j < Nam.length) {
      //     nameM.push(Nam[j]);
      //     j++;
      //   } else {
      //     nameM.push(0);
      //   }
      // }
      // let perfi = 0;
      // for (let s = 0; s < nameM.length; s++) {
      //   perfi = perfi + nameM[s];
      // }
      // nameM.push(perfi)
      // const data2 = new Uint8Array(nameM);
      // // console.log(data2)

      // //结束请求信息（固定不变）
      // const data4 = new Uint8Array(endMsg());

      // const now = new Date()
      // let year=now.getFullYear()
      // let month=now.getMonth()+1
      // let date=now.getDate()
      // let hours=now.getHours()
      // let minutes=now.getMinutes()
      // let seconds=now.getSeconds()
      // console.log(year)
      // console.log(month)
      // console.log(date)
      // console.log(hours)
      // console.log(minutes)
      // console.log(seconds)

      // let yearBin=(year-1980).toString(2)
      // let first=(year-1980)*Math.pow(2,9)+month*32+date
      // let second=hours*2048+minutes*32+seconds/2

      // let firstArray=binToByteArray(first.toString(2))
      // let secondArray=binToByteArray(second.toString(2))
      // let timeM=timeMsg()
      // for (let p=0;p<firstArray.length;p++){
      //   timeM.push(firstArray[p])
      // }
      // for (let q=0;q<secondArray.length;q++){
      //   timeM.push(secondArray[q])
      // }
      // for (let k=8;k<29;k++){
      //   timeM.push(0)
      // }
      // let totalTime = 0;
      // for (let x = 0; x < timeM.length; x++) {
      //   totalTime = totalTime + timeM[x];
      // }
      // timeM.push(totalTime)
      // console.log(timeM)
      // const data5=new Uint8Array(timeM)
      // sendDataAndWait(data1).then(() => {
      //   sendDataAndWait(data5).then(() => {
      //     sendDataAndWait(data2).then(async () => {
      //       console.log(CODE)
      //       if (stringToBinary(CODE).length > 25) {//如果代码长度大于25则需要切片
      //         let start = 0;
      //         let end = 24
      //         let flag = false;
      //         while (true) {
      //           if (flag) {
      //             let dataCode = codeSlice(start, end, stringToBinary(CODE));
      //             let codeM = codeMsg();
      //             codeM.push(end - start);
      //             for (let i = 0; i < dataCode.length; i++) {
      //               codeM.push(dataCode[i]);
      //             }
      //             let len0 = 25 - end + start - 1;
      //             for (let j = 0; j < len0; j++) {
      //               codeM.push(0);
      //             }
      //             if (codeM.length>30){
      //               codeM=codeM.slice(0,-1)
      //             }
      //             let m = 0;
      //             for (let k = 0; k < codeM.length; k++) {
      //               m = m + codeM[k];
      //             }
      //             codeM.push(m)
      //             const data3 = new Uint8Array(codeM);
      //             console.log(data3)
      //             sendDataAndWait(data3).then(() => {
      //               sendDataAndWait(data4).then(() => {
      //                 console.log("下载完成")
      //                 ipc.on('is-posted', (event) => {
      //                   event.returnValue = {
      //                     flag: true
      //                   }
      //                 });
      //               })
      //             })
      
      
      //             break;
      //           }
      //           let dataCode = codeSlice(start, end, stringToBinary(CODE));
      //           let codeM = codeMsg();
      //           codeM.push(end - start);
      //           for (let i = 0; i < dataCode.length; i++) {
      //             codeM.push(dataCode[i]);
      //           }
      //           let m = 0;
      //           for (let k = 0; k < codeM.length; k++) {
      //             m = m + codeM[k];
      //           }
      //           codeM.push(m)
      //           const data3 = new Uint8Array(codeM);
      //           start = end;
      //           end = end + 24;
      //           if (end > stringToBinary(CODE).length) {
      //             end = stringToBinary(CODE).length - 1
      //             flag = true
      //           }
      //           // await writer.write(data3)
      //           console.log(data3)
      //           await sendDataAndWait(data3)
      
      
      //         }
      //       } else {
      //         console.log("执行了")
      //         let codeM = codeMsg();
      //         codeM.push(stringToBinary(CODE).length);
      //         for (let i = 0; i < stringToBinary(CODE).length; i++) {
      //           codeM.push(stringToBinary(CODE)[i]);
      //         }
      //         let len0 = 24 - stringToBinary(CODE).length
      //         for (let j = 0; j < len0; j++) {
      //           codeM.push(0)
      //         }
      //         let m = 0;
      //         for (let k = 0; k < codeM.length; k++) {
      //           m = m + codeM[k]
      //         }
      
      //         codeM.push(m);
      //         const data3 = new Uint8Array(codeM);
      //         console.log(data3)
      //         // await writer.write(data3)
      //         sendDataAndWait(data3).then(() => {
      //           sendDataAndWait(data4).then(() => {
      //             console.log("下载完成")
      //             ipc.on('is-posted', (event) => {
      //               event.returnValue = {
      //                 flag: true
      //               }
      //             });
      //           })
      //         })
    
      
      //       }
      //     })
      //   })
      // })
      
      

      



      // await PORT.write(data1);
      // if(isContinue=='0'){
      //   console.log('start')
      //   await PORT.write(data5);
      //   if(isContinue=='0'){
      //     console.log('time')
      //     await PORT.write(data2);
      //     if(isContinue=='0'){
      //       console.log('name')
      //       if (stringToBinary(CODE).length > 25) {//如果代码长度大于25则需要切片
      //         let start = 0;
      //         let end = 24
      //         let flag = false;
      //         while (true) {
      //           if (flag) {
      //             let dataCode = codeSlice(start, end, stringToBinary(CODE));
      //             let codeM = codeMsg();
      //             codeM.push(end - start);
      //             for (let i = 0; i < dataCode.length; i++) {
      //               codeM.push(dataCode[i]);
      //             }
      //             let len0 = 25 - end + start - 1;
      //             for (let j = 0; j < len0; j++) {
      //               codeM.push(0);
      //             }
      //             if (codeM.length>30){
      //               codeM=codeM.slice(0,-1)
      //             }
      //             let m = 0;
      //             for (let k = 0; k < codeM.length; k++) {
      //               m = m + codeM[k];
      //             }
      //             codeM.push(m)
      //             const data3 = new Uint8Array(codeM);
      //             await PORT.write(data3)
      //             if(isContinue=='0'){
      //               await PORT.write(data4);
      //               if(isContinue=='0'){
      //                 console.log("下载完成")
      //               }else{
      //                 console.log("结束异常")
      //               }
      //             }

      //             break;
      //           }
      //           let dataCode = codeSlice(start, end, stringToBinary(CODE));
      //           let codeM = codeMsg();
      //           codeM.push(end - start);
      //           for (let i = 0; i < dataCode.length; i++) {
      //             codeM.push(dataCode[i]);
      //           }
      //           let m = 0;
      //           for (let k = 0; k < codeM.length; k++) {
      //             m = m + codeM[k];
      //           }
      //           codeM.push(m)
      //           const data3 = new Uint8Array(codeM);
      //           start = end;
      //           end = end + 24;
      //           if (end > stringToBinary(CODE).length) {
      //             end = stringToBinary(CODE).length - 1
      //             flag = true
      //           }
      //           await PORT.write(data3)

      //           if(isContinue=='0'){
      //             console.log('代码发送结束')
      //           }

      //         }
      //       } else {
      //         console.log("执行了")
      //         let codeM = codeMsg();
      //         codeM.push(stringToBinary(CODE).length);
      //         for (let i = 0; i < stringToBinary(CODE).length; i++) {
      //           codeM.push(stringToBinary(CODE)[i]);
      //         }
      //         let len0 = 24 - stringToBinary(CODE).length
      //         for (let j = 0; j < len0; j++) {
      //           codeM.push(0)
      //         }
      //         let m = 0;
      //         for (let k = 0; k < codeM.length; k++) {
      //           m = m + codeM[k]
      //         }

      //         codeM.push(m);
      //         const data3 = new Uint8Array(codeM);
      //         console.log(data3)
      //         await PORT.write(data3)
      //         console.log("write执行了")

      //         if(isContinue=='0'){
      //           console.log('代码发送结束')
      //           await PORT.write(data4);
      //           if(isContinue=='0'){
      //             console.log('发送结束')
      //             console.log("下载完成")
      //           }else{
      //             console.log("结束异常")
      //           }
      //         }
      //       }
      //     }
      //   }
      // }

    })

 
    // try {
    //     let startMsg=[0xAF,0x04,0x96,0x00,0x01,0x4a]
    //     const data1 = new Uint8Array(startMsg);
    //     PORT.write(data1);
    // }
    // catch (err) {
    //     console.log('发送数据失败: ' + err.message+'\n');
    // }
    console.log(getPort());
    console.log('Code:'+CODE);
    
    
    this.loadURL('download-code://./download-code.html');
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

  static show (code) {
    try{
      CODE=code
      const window = AbstractWindow.singleton(DownloadCodeWindow);
      window.show();
    }catch (err) {
      console.log(err);
    }
    
  }
}

module.exports = DownloadCodeWindow;
