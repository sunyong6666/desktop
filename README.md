# ICreateCode

> 本项目基于 [TurboWarp](https://github.com/TurboWarp/desktop) 进行二次开发，加入了多个新功能并对原有代码结构进行了优化。

## 项目简介

本项目是一个用于图形化编程的电脑桌面应用程序。相比原始项目，增加了更多**硬件设备的扩展**，修改了部分**界面**，添加了**硬件连接方式**，以及增加了**代码下载**等诸多功能，并提升了整体的可维护性和用户体验。

## 🔧 新增功能与修改说明

### ✨ 功能上的改变

- 增加了 **ICrobot**，**ICbricks**两款设备的扩展，并且另外添加了**机器学习**相关扩展
- 添加上了代码生成的相关功能，可以生成python代码以及Lua代码
- 添加了与硬件的连接方式，原本turbowarp使用scratch link与硬件设备进行蓝牙或串口的连接，但是，新增设备并没有使用scratch link进行连接，蓝牙连接直接使用web bluetooth api进行连接，串口连接使用一个node库serial-port进行连接，wifi连接使用node库wifi-node库进行连接，并使用websocket进行通信。
- 界面进行了部分修改
  - 在主界面添加了选择主控器的按钮，蓝牙连接，串口连接，wifi连接等相关按钮及其相关弹窗
  - 添加了wifi图标显示，主控状态图标等
  - 增加了生成代码展示与下载区域。

### 🛠️ 代码层面的改动

- 扩展

  - 在your-path/node-modules/scratch-vm/src/extension 目录下即可看到添加的所有扩展的结构及执行逻辑
  - 在your-path/node-modules/scratch-gui/src/lib/librarys/extension 目录下即可看到扩展页面的展示

- 代码生成

  - 在your-path/node-modules/scratch-blocks/generators 里面是相关代码生成器，并在build目录以及build.py里面进行了相关配置的修改

  - 修改完生成的代码后执行以下命令即可打包编译

  - ```bash
    cd your_path/node-modules/scratch-blocks
    npm run prepublish
    ```

  - 编译完之后在your-path/node-modules/scratch-gui/src/lib/blocks.js文件里面引入上一步打包好的your-langague_compressed.js压缩文件

- 连接方式

  - 蓝牙连接
    - 主要功能在your-path/src-main/windows/ble-connect.js里面，这个弹窗将其设置为了浏览器性质的弹窗，以便使用web bluetooth api进行蓝牙连接
    - 后续的数据传输都是将想要传输的数据传到的这个弹窗界面里面进行蓝牙数据传输

  - 串口连接
    - 主要功能在your-path/src-main/windows/serial-connect里面，串口连接使用的是serial-port库，同样是将需要发送的数据传到这个界面再发送

  - wifi连接
    - 主要功能在your-path/src-main/windows/send-wifi.js里面，连接主要使用wifi-node库，并使用websocket进行通信

- 界面修改

  - 界面修改主要在your-path/node-modules/scratch-gui/src/compoents/gui.js里面以及当前目录下的大部分文件
  - 弹窗界面修改主要在your-path/src-render里面

## 🚀 启动方式

请按照以下步骤启动项目：

1. 克隆仓库

   ```bash
   git clone https://github.com/sunyong6666/desktop.git
   cd your-modified-project
   ```
   
   
   
2. 下载依赖

   ```bash
   npm ci
   ```

   

3. 编译

   ```bash
   npm run webpack:compile
   ```

   

4. 启动electron

   ```bash
   npm run electron:start 
   ```

   

5. 打包

   ```bash
   npx electron-builder --windows nsis --x64
   ```

   

