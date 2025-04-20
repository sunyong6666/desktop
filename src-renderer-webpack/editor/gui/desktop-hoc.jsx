import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {openLoadingProject, closeLoadingProject} from 'scratch-gui/src/reducers/modals';
import {
  requestProjectUpload,
  setProjectId,
  defaultProjectId,
  onFetchedProjectData,
  onLoadedProject,
  requestNewProject
} from 'scratch-gui/src/reducers/project-state';
import {setFileHandle, setUsername} from 'scratch-gui/src/reducers/tw';
import {WrappedFileHandle} from './filesystem-api.js';
import {setStrings} from '../prompt/prompt.js';
import codeModule from '../../../utils/global.js'

let mountedOnce = false;

/**
 * @param {string} filename
 * @returns {string}
 */
const getDefaultProjectTitle = (filename) => {
  const match = filename.match(/([^/\\]+)\.sb[2|3]?$/);
  if (!match) return filename;
  return match[1];
};

const handleClickAddonSettings = (search) => {
  EditorPreload.openAddonSettings(typeof search === 'string' ? search : null);
};

const handleClickNewWindow = () => {
  EditorPreload.openNewWindow();
};

const handleClickPackager = () => {
  EditorPreload.openPackager();
};

const handleClickDesktopSettings = () => {
  EditorPreload.openDesktopSettings();
};

const handleClickPrivacy = () => {
  EditorPreload.openPrivacy();
};

const handleClickAbout = () => {
  EditorPreload.openAbout();
};

// const handleClickMaster = () =>{
//   alert('主控器')
// }
const handleDownload = () =>{
  codeModule.getCode()
  EditorPreload.download(codeModule.getCode());
}

const handleSerialDownload = (place) =>{
  console.log(place)
  let data={
    place:place,
    code:codeModule.getCode()
  }
  EditorPreload.SerialDownload(data)
}
const handleSaveCode = (args) =>{
  console.log(args)
  // alert('保存代码')
  let blob = new Blob([codeModule.getCode()], { type: 'text/plain' }); // 创建一个Blob对象，指定内容类型为纯文本
  let fileDownloadUrl = URL.createObjectURL(blob); // 为Blob对象创建一个临时URL

  const name = 'project';
  // 创建一个临时的<a>标签用于下载
  let downloadLink = document.createElement('a');
  downloadLink.href = fileDownloadUrl;
  args.forEach((element,index) => {
    if(element && index==0){
      downloadLink.download = name+'.lua'; // 指定下载文件的名称
    }else if(element && index==1){
      downloadLink.download = name+'.py'; // 指定下载文件的名称
    }
  });
  

  document.body.appendChild(downloadLink); // 将<a>标签加入到文档中
  downloadLink.click(); // 模拟点击<a>标签以触发下载

  document.body.removeChild(downloadLink); // 移除<a>标签
  URL.revokeObjectURL(fileDownloadUrl); // 释放创建的临时URL资源
}

const handleLoadCode = () =>{
  // alert('导入代码')
  const input =document.createElement('input')
  input.type='file'
  input.id='fileInput'
  input.style='display:none'

  input.click()
  input.addEventListener('change',(event)=>{
    const file = event.target.files[0];  // 获取选中的文件
    if (!file) return;

    const reader = new FileReader();  // 创建 FileReader 实例

    // 读取完成后，将内容显示到文本框
    reader.onload = (e) => {
        // console.log(e.target.result);
        codeModule.setCode(e.target.result)
        input.remove()
    };

    // 读取文件内容（纯文本）
    reader.readAsText(file);
  })
}
const handleCancelload = () =>{
  EditorPreload.cancelload()
}

const handleClickSourceCode = () => {
  window.open('https://github.com/TurboWarp');
};

const handleClickDonate = () => {
  window.open('https://github.com/sponsors/GarboMuffin');
};

const securityManager = {
  // Everything not specified here falls back to the scratch-gui security manager

  // Managed by Electron main process:
  canReadClipboard: () => true,
  canNotify: () => true,

  // Does not work in Electron:
  canGeolocate: () => false
};

const USERNAME_KEY = 'tw:username';
const DEFAULT_USERNAME = 'player';

const DesktopHOC = function (WrappedComponent) {
  class DesktopComponent extends React.Component {
    constructor (props) {
      super(props);
      this.state = {
        title: ''
      };
      this.handleUpdateProjectTitle = this.handleUpdateProjectTitle.bind(this);

      // Changing locale always re-mounts this component
      const stateFromMain = EditorPreload.setLocale(this.props.locale);
      this.messages = stateFromMain.strings;
      this.isMAS = stateFromMain.mas;
      setStrings({
        ok: this.messages['prompt.ok'],
        cancel: this.messages['prompt.cancel']
      });

      const storedUsername = localStorage.getItem(USERNAME_KEY);
      if (typeof storedUsername === 'string') {
        this.props.onSetReduxUsername(storedUsername);
      } else {
        this.props.onSetReduxUsername(DEFAULT_USERNAME);
      }
    }
    componentDidMount () {
      EditorPreload.setExportForPackager(() => this.props.vm.saveProjectSb3('arraybuffer')
        .then((buffer) => ({
          name: this.state.title,
          data: buffer
        })));

      // This component is re-mounted when the locale changes, but we only want to load
      // the initial project once.
      if (mountedOnce) {
        return;
      }
      mountedOnce = true;

      this.props.onLoadingStarted();
      (async () => {
        // Note that 0 is a valid ID and does mean there is a file open
        const id = await EditorPreload.getInitialFile();
        if (id === null) {
          this.props.onHasInitialProject(false, this.props.loadingState);
          this.props.onLoadingCompleted();
          return;
        }

        this.props.onHasInitialProject(true, this.props.loadingState);
        const {name, type, data} = await EditorPreload.getFile(id);

        await this.props.vm.loadProject(data);
        this.props.onLoadingCompleted();
        this.props.onLoadedProject(this.props.loadingState, true);

        const title = getDefaultProjectTitle(name);
        if (title) {
          this.setState({
            title
          });
        }

        if (type === 'file' && name.endsWith('.sb3')) {
          this.props.onSetFileHandle(new WrappedFileHandle(id, name));
        }
      })().catch(error => {
        console.error(error);
        alert(error);

        this.props.onLoadingCompleted();
        this.props.onLoadedProject(this.props.loadingState, false);
        this.props.onHasInitialProject(false, this.props.loadingState);
        this.props.onRequestNewProject();
      });
    }
    componentDidUpdate (prevProps, prevState) {
      if (this.props.projectChanged !== prevProps.projectChanged) {
        EditorPreload.setChanged(this.props.projectChanged);
      }

      if (this.state.title !== prevState.title) {
        document.title = this.state.title;
      }

      if (this.props.fileHandle !== prevProps.fileHandle) {
        if (this.props.fileHandle) {
          EditorPreload.openedFile(this.props.fileHandle.id);
        } else {
          EditorPreload.closedFile();
        }
      }

      if (this.props.reduxUsername !== prevProps.reduxUsername) {
        localStorage.setItem(USERNAME_KEY, this.props.reduxUsername);
      }

      if (this.props.isFullScreen !== prevProps.isFullScreen) {
        EditorPreload.setIsFullScreen(this.props.isFullScreen);
      }
    }
    handleUpdateProjectTitle (newTitle) {
      this.setState({
        title: newTitle
      });
    }
    render() {
      const {
        locale,
        loadingState,
        projectChanged,
        fileHandle,
        reduxUsername,
        onFetchedInitialProjectData,
        onHasInitialProject,
        onLoadedProject,
        onLoadingCompleted,
        onLoadingStarted,
        onRequestNewProject,
        onSetFileHandle,
        onSetReduxUsername,
        vm,
        ...props
      } = this.props;
      return (
        <WrappedComponent
          projectTitle={this.state.title}
          onUpdateProjectTitle={this.handleUpdateProjectTitle}
          onClickAddonSettings={handleClickAddonSettings}
          onClickNewWindow={handleClickNewWindow}
          onClickPackager={handleClickPackager}
          // onClickMaster={handleClickMaster}
          onClickAbout={[
            {
              title: this.messages['in-app-about.desktop-settings'],
              onClick: handleClickDesktopSettings
            },
            {
              title: this.messages['in-app-about.privacy'],
              onClick: handleClickPrivacy
            },
            {
              title: this.messages['in-app-about.about'],
              onClick: handleClickAbout
            },
            {
              title: this.messages['in-app-about.source-code'],
              onClick: handleClickSourceCode
            },
            // Donation link must be hidden in MAS builds for App store compliance
            ...(this.isMAS ? [] : [
              {
                title: this.messages['in-app-about.donate'],
                onClick: handleClickDonate
              }
            ])
          ]}
          onClickDesktopSettings={handleClickDesktopSettings}
          // clickSerialConnect={handleClickDesktopSettings}
          download={handleDownload}
          SerialDownload={handleSerialDownload}
          saveCode={handleSaveCode}
          loadCode={handleLoadCode}
          cancelload={handleCancelload}
          securityManager={securityManager}
          {...props}
        />
      );
    }
  }

  DesktopComponent.propTypes = {
    locale: PropTypes.string.isRequired,
    loadingState: PropTypes.string.isRequired,
    projectChanged: PropTypes.bool.isRequired,
    fileHandle: PropTypes.shape({
      id: PropTypes.number.isRequired
    }),
    isFullScreen: PropTypes.bool.isRequired,
    reduxUsername: PropTypes.string.isRequired,
    onFetchedInitialProjectData: PropTypes.func.isRequired,
    onHasInitialProject: PropTypes.func.isRequired,
    onLoadedProject: PropTypes.func.isRequired,
    onLoadingCompleted: PropTypes.func.isRequired,
    onLoadingStarted: PropTypes.func.isRequired,
    onRequestNewProject: PropTypes.func.isRequired,
    onSetFileHandle: PropTypes.func.isRequired,
    onSetReduxUsername: PropTypes.func.isRequired,
    vm: PropTypes.shape({
      loadProject: PropTypes.func.isRequired
    }).isRequired
  };

  const mapStateToProps = state => ({
    locale: state.locales.locale,
    loadingState: state.scratchGui.projectState.loadingState,
    isFullScreen: state.scratchGui.mode.isFullScreen,
    projectChanged: state.scratchGui.projectChanged,
    fileHandle: state.scratchGui.tw.fileHandle,
    reduxUsername: state.scratchGui.tw.username,
    vm: state.scratchGui.vm
  });

  const mapDispatchToProps = dispatch => ({
    onLoadingStarted: () => dispatch(openLoadingProject()),
    onLoadingCompleted: () => dispatch(closeLoadingProject()),
    onHasInitialProject: (hasInitialProject, loadingState) => {
      if (hasInitialProject) {
        return dispatch(requestProjectUpload(loadingState));
      }
      return dispatch(setProjectId(defaultProjectId));
    },
    onFetchedInitialProjectData: (projectData, loadingState) => dispatch(onFetchedProjectData(projectData, loadingState)),
    onLoadedProject: (loadingState, loadSuccess) => {
      return dispatch(onLoadedProject(loadingState, /* canSave */ false, loadSuccess));
    },
    onRequestNewProject: () => dispatch(requestNewProject(false)),
    onSetFileHandle: fileHandle => dispatch(setFileHandle(fileHandle)),
    onSetReduxUsername: (username) => dispatch(setUsername(username))
  });

  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(DesktopComponent);
};

export default DesktopHOC;
