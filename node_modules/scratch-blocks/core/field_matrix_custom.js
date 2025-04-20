'use strict';
 
goog.provide('Blockly.FieldMatrixCustom');
goog.require('Blockly.DropDownDiv');
 
/**
 * 构造
 * @param matrix
 * @constructor
 */
Blockly.FieldMatrixCustom = function(matrix) {
  Blockly.FieldMatrixCustom.superClass_.constructor.call(this, matrix);
  this.addArgType('matrix');
 
  // 块字段上矩阵缩略图数组。
  this.ledThumbNodes_ = [];
 
  // 下拉菜单中矩阵编辑器的数组。
  this.ledButtons_ = [];
 
  // 用于存储当前矩阵值的字符串
  this.matrix_ = '';
 
  // 编辑器中LED矩阵
  this.matrixStage_ = null;
 
  // 下拉箭头
  this.arrow_ = null;
 
  // 指示矩阵绘制样式的字符串
  this.paintStyle_ = null;
 
  // 鼠标按下事件
  this.mouseDownWrapper_ = null;
 
  // 触摸事件（用于设置LED状态）
  this.matrixTouchWrapper_ = null;
 
  // 鼠标移动事件（用于设置LED状态）
  this.matrixMoveWrapper_ = null;
 
  // 鼠标释放事件（用于设置LED状态）
  this.matrixReleaseWrapper_ = null;
};
 
// 继承 Blockly.Field)
goog.inherits(Blockly.FieldMatrixCustom, Blockly.Field);
 
/**
 * 通过JSON生成
 */
Blockly.FieldMatrixCustom.fromJson = function(options) {
  return new Blockly.FieldMatrixCustom(options['matrix']);
};
 
/**
 * 矩阵行数
 */
Blockly.FieldMatrixCustom.MATRIX_ROW = 8;
 
/**
 * 矩阵列数
 */
Blockly.FieldMatrixCustom.MATRIX_COL = 24;
 
/**
 * 缩略点阵LED的大小（px）
 */
Blockly.FieldMatrixCustom.THUMBNAIL_NODE_SIZE = 2;
 
/**
 * 缩略点阵中每个LED的间距（px）
 */
Blockly.FieldMatrixCustom.THUMBNAIL_NODE_PAD = 1;
 
/**
 * 下拉箭头大小
 */
Blockly.FieldMatrixCustom.ARROW_SIZE = 12;
 
/**
 * 点阵LED的大小（px）
 * @type {number}
 */
Blockly.FieldMatrixCustom.MATRIX_NODE_SIZE = 18;
 
/**
 * 点阵LED的圆角（px）
 * @type {number}
 */
Blockly.FieldMatrixCustom.MATRIX_NODE_RADIUS = 4;
 
/**
 * 点阵LED的间距（px）
 * @type {number}
 */
Blockly.FieldMatrixCustom.MATRIX_NODE_PAD = 5;
 
/**
 * 所有内置的，用户无法删除的
 */
Blockly.FieldMatrixCustom.LEDS = {
  // 全灭
  ZEROS: "".padEnd(Blockly.FieldMatrixCustom.MATRIX_ROW * Blockly.FieldMatrixCustom.MATRIX_COL, "0"),
  // 全亮
  FULLS: "".padEnd(Blockly.FieldMatrixCustom.MATRIX_ROW * Blockly.FieldMatrixCustom.MATRIX_COL, "1"),
  // // HELLO样式
  // HELLO: "10100000101000001010000010100000101000001010000010101110101001101110101010101001101011101010100110101000101010011010111010100110",
  // // 实心
  // HEART: "00001110011100000001111111111000000111111111100000011111111110000000111111110000000001111110000000000011110000000000000110000000",
  // // 空心
  // HEART_OUT_LINE: "00001110011100000001000110001000000100000000100000010000000010000000100000010000000001000010000000000010010000000000000110000000",
  // 添加其他，会自动渲染
  // Add Others...
};
 
/**
 * 用户自己保存的，可以由用户随意删除
 * 每次由本地读取
 * @type {{}}
 */
Blockly.FieldMatrixCustom.USER = JSON.parse(localStorage.getItem("USER_CUSTOM_MATRIX")) || {};
 
/**
 * 初始化
 */
Blockly.FieldMatrixCustom.prototype.init = function() {
  if (this.fieldGroup_) {
    return;
  }
 
  // 创建字段
  this.fieldGroup_ = Blockly.utils.createSvgElement('g', {}, null);
  this.sourceBlock_.getSvgRoot().appendChild(this.fieldGroup_);
 
  // 计算字段宽度 缩略点阵加下拉箭头所占的区域
  this.size_.width = (Blockly.FieldMatrixCustom.THUMBNAIL_NODE_SIZE + Blockly.FieldMatrixCustom.THUMBNAIL_NODE_PAD) *
    Blockly.FieldMatrixCustom.MATRIX_COL +
    Blockly.FieldMatrixCustom.ARROW_SIZE + Blockly.BlockSvg.DROPDOWN_ARROW_PADDING * 1.5;
 
  // 计算字段高度
  this.size_.height = (Blockly.FieldMatrixCustom.THUMBNAIL_NODE_SIZE + Blockly.FieldMatrixCustom.THUMBNAIL_NODE_PAD) *
    Blockly.FieldMatrixCustom.MATRIX_ROW + 10;
 
  // 创建缩略点阵
  var thumbnail = Blockly.utils.createSvgElement('g', {
    'transform': 'translate(5, 5)',
    'pointer-events': 'bounding-box', 'cursor': 'pointer'
  }, this.fieldGroup_);
 
  // 创建缩略点阵LED
  this.ledThumbNodes_ = [];
  var nodeSize = Blockly.FieldMatrixCustom.THUMBNAIL_NODE_SIZE;
  var nodePad = Blockly.FieldMatrixCustom.THUMBNAIL_NODE_PAD;
  for (var i = 0; i < Blockly.FieldMatrixCustom.MATRIX_ROW; i++) {
    for (var n = 0; n < Blockly.FieldMatrixCustom.MATRIX_COL; n++) {
      var attr = {
        'x': ((nodeSize + nodePad) * n) + nodePad,
        'y': ((nodeSize + nodePad) * i) + nodePad,
        'width': nodeSize,
        'height': nodeSize,
        'rx': nodePad, 'ry': nodePad
      };
      this.ledThumbNodes_.push(Blockly.utils.createSvgElement('rect', attr, thumbnail));
    }
    thumbnail.style.cursor = 'default';
    this.updateMatrix_();
  }
 
  // 创建下啦箭头
  if (!this.arrow_) {
    var arrowX = this.size_.width - Blockly.BlockSvg.DROPDOWN_ARROW_PADDING * 1.5;
    var arrowY = (this.size_.height - Blockly.FieldMatrixCustom.ARROW_SIZE) / 2;
    this.arrow_ = Blockly.utils.createSvgElement('image', {
      'height': Blockly.FieldMatrixCustom.ARROW_SIZE + 'px',
      'width': Blockly.FieldMatrixCustom.ARROW_SIZE + 'px',
      'transform': 'translate(' + arrowX + ', ' + arrowY + ')'
    }, this.fieldGroup_);
    this.arrow_.setAttributeNS('http://www.w3.org/1999/xlink',
      'xlink:href', Blockly.mainWorkspace.options.pathToMedia +
      'dropdown-arrow.svg');
    this.arrow_.style.cursor = 'default';
  }
 
  this.mouseDownWrapper_ = Blockly.bindEventWithChecks_(this.getClickTarget_(), 'mousedown', this, this.onMouseDown_);
};
 
/**
 * 设置值
 * @param matrix
 */
Blockly.FieldMatrixCustom.prototype.setValue = function(matrix) {
  if (!matrix || matrix === this.matrix_) {
    return;  // No change
  }
  if (this.sourceBlock_ && Blockly.Events.isEnabled()) {
    Blockly.Events.fire(new Blockly.Events.Change(
      this.sourceBlock_, 'field', this.name, this.matrix_, matrix));
  }
  matrix = matrix.padEnd(Blockly.FieldMatrixCustom.MATRIX_ROW * Blockly.FieldMatrixCustom.MATRIX_COL, "0");
  matrix = matrix.substr(0, Blockly.FieldMatrixCustom.MATRIX_ROW * Blockly.FieldMatrixCustom.MATRIX_COL);
  this.matrix_ = matrix;
  this.updateMatrix_();
};
 
/**
 * 获取值
 * @returns {string}
 */
Blockly.FieldMatrixCustom.prototype.getValue = function() {
  return String(this.matrix_);
};
 
/**
 * 显示编辑器
 * @private
 */
Blockly.FieldMatrixCustom.prototype.showEditor_ = function() {
 
  // 清除上次显示内容以及动效
  Blockly.DropDownDiv.hideWithoutAnimation();
  Blockly.DropDownDiv.clearContent();
 
  // 获取下拉内容容器
  var container = Blockly.DropDownDiv.getContentDiv();
 
  // 计算点阵尺寸
  var matrixWidth = (Blockly.FieldMatrixCustom.MATRIX_NODE_SIZE + Blockly.FieldMatrixCustom.MATRIX_NODE_PAD) *
    Blockly.FieldMatrixCustom.MATRIX_COL + Blockly.FieldMatrixCustom.MATRIX_NODE_PAD;
  var matrixHeight = (Blockly.FieldMatrixCustom.MATRIX_NODE_SIZE + Blockly.FieldMatrixCustom.MATRIX_NODE_PAD) *
    Blockly.FieldMatrixCustom.MATRIX_ROW + Blockly.FieldMatrixCustom.MATRIX_NODE_PAD;
 
  // 创建点阵
  this.matrixStage_ = Blockly.utils.createSvgElement('svg', {
    'xmlns': 'http://www.w3.org/2000/svg',
    'xmlns:html': 'http://www.w3.org/1999/xhtml',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    'version': '1.1',
    'height': matrixHeight + 'px',
    'width': matrixWidth + 'px'
  }, container);
 
  // 创建点阵中的LED
  this.ledButtons_ = [];
  for (var i = 0; i < Blockly.FieldMatrixCustom.MATRIX_ROW; i++) {
    for (var n = 0; n < Blockly.FieldMatrixCustom.MATRIX_COL; n++) {
      var x = (Blockly.FieldMatrixCustom.MATRIX_NODE_SIZE * n) + (Blockly.FieldMatrixCustom.MATRIX_NODE_PAD * (n + 1));
      var y = (Blockly.FieldMatrixCustom.MATRIX_NODE_SIZE * i) + (Blockly.FieldMatrixCustom.MATRIX_NODE_PAD * (i + 1));
      var attr = {
        'x': x + 'px', 'y': y + 'px',
        'width': Blockly.FieldMatrixCustom.MATRIX_NODE_SIZE,
        'height': Blockly.FieldMatrixCustom.MATRIX_NODE_SIZE,
        'rx': Blockly.FieldMatrixCustom.MATRIX_NODE_RADIUS,
        'ry': Blockly.FieldMatrixCustom.MATRIX_NODE_RADIUS
      };
      var led = Blockly.utils.createSvgElement('rect', attr, this.matrixStage_);
      this.matrixStage_.appendChild(led);
      this.ledButtons_.push(led);
    }
  }
 
  // 创建工具箱
  var toolbox = document.createElement('div');
  container.appendChild(toolbox);
  toolbox.className = "custom-matrix-toolbox";
 
  // led选择
  if (this.leds) {
    this.leds.innerHTML = "";
  } else {
    this.leds = document.createElement('div');
  }
  toolbox.appendChild(this.leds);
  this.leds.className = "custom-matrix-leds";
  this.leds.style.borderRight = "1px solid " + this.sourceBlock_.colourSecondary_;
 
  // 添加内置LED点阵
  for (var key in Blockly.FieldMatrixCustom.LEDS) {
    if (Blockly.FieldMatrixCustom.LEDS[key]) {
      this.leds.appendChild(this.createMatrixBtn_(key, Blockly.FieldMatrixCustom.LEDS[key]));
    }
  }
 
  // 添加用户LED点阵
  for (var key in Blockly.FieldMatrixCustom.USER) {
    if (Blockly.FieldMatrixCustom.USER[key]) {
      this.leds.appendChild(this.createMatrixBtn_(key, Blockly.FieldMatrixCustom.USER[key], true));
    }
  }
 
  // 工具
  var tool = document.createElement('div');
  toolbox.appendChild(tool);
  tool.className = "custom-matrix-tool";
 
  var thisField = this;
  // 全灭按钮
  var clearButtonDiv = document.createElement('div');
  tool.appendChild(clearButtonDiv);
  clearButtonDiv.innerText = "全灭";
  clearButtonDiv.className = "custom-matrix-btn";
  clearButtonDiv.onclick = function() {
    thisField.setValue(Blockly.FieldMatrixCustom.LEDS.ZEROS);
  };
 
  // 全亮按钮
  var fullsButtonDiv = document.createElement('div');
  tool.appendChild(fullsButtonDiv);
  fullsButtonDiv.className = "custom-matrix-btn";
  fullsButtonDiv.innerText = "全亮";
  fullsButtonDiv.onclick = function() {
    thisField.setValue(Blockly.FieldMatrixCustom.LEDS.FULLS);
  };
 
  // 保存当图案
  var saveButtonDiv = document.createElement('div');
  tool.appendChild(saveButtonDiv);
  saveButtonDiv.innerText = "保存";
  saveButtonDiv.className = "custom-matrix-btn";
  saveButtonDiv.onclick = function() {
    thisField.saveMatrix_(thisField.getValue());
  };
 
  Blockly.DropDownDiv.setColour(this.sourceBlock_.getColour(),
    this.sourceBlock_.getColourTertiary());
  Blockly.DropDownDiv.setCategory(this.sourceBlock_.getCategory());
  Blockly.DropDownDiv.showPositionedByBlock(this, this.sourceBlock_);
 
  this.matrixTouchWrapper_ = Blockly.bindEvent_(this.matrixStage_, 'mousedown', this, this.onMouseDown);
 
  this.updateMatrix_();
};
 
/**
 * 创建点阵按钮
 */
Blockly.FieldMatrixCustom.prototype.createMatrixBtn_ = function(key, value, enableDelete = false) {
  var thisField = this;
  var button = document.createElement('div');
  button.className = "custom-matrix-led-btn";
  button.appendChild(this.createMatrix_(value));
  button.value = value;
  button.onclick = function() {
    thisField.setValue(this.value);
  };
 
  if (enableDelete) {
    var removeBtn = document.createElement('div');
    button.appendChild(removeBtn);
    removeBtn.innerText = "×";
    removeBtn.key = key;
    removeBtn.className = "custom-matrix-times";
    removeBtn.onclick = function(e) {
      button.remove();
      thisField.removeMatrix_(this.key);
      e.stopPropagation();
      e.preventDefault();
    };
  }
  return button;
};
 
/**
 * 创建缩略点阵
 */
Blockly.FieldMatrixCustom.prototype.createMatrix_ = function(fill) {
 
  // 预览Led大小与间距
  var nodeSize = 4;
  var nodePad = 1;
 
  // 计算按钮大小
  var width = Blockly.FieldMatrixCustom.MATRIX_COL * (nodeSize + nodePad);
  var height = Blockly.FieldMatrixCustom.MATRIX_ROW * (nodeSize + nodePad);
 
  var colorEmpty = this.sourceBlock_.colourSecondary_;
  var colorFill = '#FFFFFF';
  var button = Blockly.utils.createSvgElement('svg', {
    'xmlns': 'http://www.w3.org/2000/svg',
    'xmlns:html': 'http://www.w3.org/1999/xhtml',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    'version': '1.1',
    'width': width + 'px',
    'height': height + 'px',
  });
 
  for (var i = 0; i < Blockly.FieldMatrixCustom.MATRIX_ROW; i++) {
    for (var j = 0; j < Blockly.FieldMatrixCustom.MATRIX_COL; j++) {
      Blockly.utils.createSvgElement('rect', {
        'x': ((nodeSize + nodePad) * j) + nodePad,
        'y': ((nodeSize + nodePad) * i) + nodePad,
        'width': nodeSize,
        'height': nodeSize,
        'rx': nodePad,
        'ry': nodePad,
        'fill': (fill.charAt(Blockly.FieldMatrixCustom.MATRIX_COL * i + j) === '1') ? colorFill : colorEmpty
      }, button);
    }
  }
  return button;
};
 
/**
 * 生成指定长度的随机字符串
 * @param len
 * @returns {string}
 */
Blockly.FieldMatrixCustom.prototype.createRandomString = (len = 16) => {
  const t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
  const a = t.length;
  let n = "";
  for (let i = 0; i < len; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
};
 
/**
 * 保存当前点阵
 * @param value
 * @private
 */
Blockly.FieldMatrixCustom.prototype.saveMatrix_ = function(value) {
  var key = this.createRandomString();
  Blockly.FieldMatrixCustom.USER[key] = value;
  if (this.leds) {
    this.leds.appendChild(this.createMatrixBtn_(key, value, true));
  }
  localStorage.setItem("USER_CUSTOM_MATRIX", JSON.stringify(Blockly.FieldMatrixCustom.USER || {}));
};
 
/**
 * 移除当前点阵
 * @private
 */
Blockly.FieldMatrixCustom.prototype.removeMatrix_ = function(key) {
  delete Blockly.FieldMatrixCustom.USER[key];
  localStorage.setItem("USER_CUSTOM_MATRIX", JSON.stringify(Blockly.FieldMatrixCustom.USER || {}));
};
 
/**
 * 更新点阵
 * @private
 */
Blockly.FieldMatrixCustom.prototype.updateMatrix_ = function() {
  for (var i = 0; i < this.matrix_.length; i++) {
    if (this.matrix_[i] === '0') {
      this.fillMatrixNode_(this.ledButtons_, i, this.sourceBlock_.colourSecondary_);
      this.fillMatrixNode_(this.ledThumbNodes_, i, this.sourceBlock_.colour_);
    } else {
      this.fillMatrixNode_(this.ledButtons_, i, '#FFFFFF');
      this.fillMatrixNode_(this.ledThumbNodes_, i, '#FFFFFF');
    }
  }
};
 
Blockly.FieldMatrixCustom.prototype.fillMatrixNode_ = function(node, index, fill) {
  if (!node || !node[index] || !fill) return;
  node[index].setAttribute('fill', fill);
};
 
Blockly.FieldMatrixCustom.prototype.setLEDNode_ = function(led, state) {
  if (led < 0 || led > Blockly.FieldMatrixCustom.MATRIX_COL * Blockly.FieldMatrixCustom.MATRIX_ROW - 1) return;
  var matrix = this.matrix_.substr(0, led) + state + this.matrix_.substr(led + 1);
  this.setValue(matrix);
};
 
Blockly.FieldMatrixCustom.prototype.fillLEDNode_ = function(led) {
  if (led < 0 || led > Blockly.FieldMatrixCustom.MATRIX_COL * Blockly.FieldMatrixCustom.MATRIX_ROW - 1) return;
  this.setLEDNode_(led, '1');
};
 
Blockly.FieldMatrixCustom.prototype.clearLEDNode_ = function(led) {
  if (led < 0 || led > Blockly.FieldMatrixCustom.MATRIX_COL * Blockly.FieldMatrixCustom.MATRIX_ROW - 1) return;
  this.setLEDNode_(led, '0');
};
 
Blockly.FieldMatrixCustom.prototype.toggleLEDNode_ = function(led) {
  if (led < 0 || led > Blockly.FieldMatrixCustom.MATRIX_COL * Blockly.FieldMatrixCustom.MATRIX_ROW - 1) return;
  if (this.matrix_.charAt(led) === '0') {
    this.setLEDNode_(led, '1');
  } else {
    this.setLEDNode_(led, '0');
  }
};
 
Blockly.FieldMatrixCustom.prototype.onMouseDown = function(e) {
  this.matrixMoveWrapper_ =
    Blockly.bindEvent_(document.body, 'mousemove', this, this.onMouseMove);
  this.matrixReleaseWrapper_ =
    Blockly.bindEvent_(document.body, 'mouseup', this, this.onMouseUp);
  var ledHit = this.checkForLED_(e);
  if (ledHit > -1) {
    if (this.matrix_.charAt(ledHit) === '0') {
      this.paintStyle_ = 'fill';
    } else {
      this.paintStyle_ = 'clear';
    }
    this.toggleLEDNode_(ledHit);
    this.updateMatrix_();
  } else {
    this.paintStyle_ = null;
  }
};
 
Blockly.FieldMatrixCustom.prototype.onMouseUp = function() {
  Blockly.unbindEvent_(this.matrixMoveWrapper_);
  Blockly.unbindEvent_(this.matrixReleaseWrapper_);
  this.paintStyle_ = null;
};
 
Blockly.FieldMatrixCustom.prototype.onMouseMove = function(e) {
  e.preventDefault();
  if (this.paintStyle_) {
    var led = this.checkForLED_(e);
    if (led < 0) return;
    if (this.paintStyle_ === 'clear') {
      this.clearLEDNode_(led);
    } else if (this.paintStyle_ === 'fill') {
      this.fillLEDNode_(led);
    }
  }
};
 
Blockly.FieldMatrixCustom.prototype.checkForLED_ = function(e) {
  var bBox = this.matrixStage_.getBoundingClientRect();
  var nodeSize = Blockly.FieldMatrixCustom.MATRIX_NODE_SIZE;
  var nodePad = Blockly.FieldMatrixCustom.MATRIX_NODE_PAD;
  var dx = e.clientX - bBox.left;
  var dy = e.clientY - bBox.top;
  var min = nodePad / 2;
  var max = bBox.width - (nodePad / 2);
  if (dx < min || dx > max || dy < min || dy > max) {
    return -1;
  }
  var xDiv = Math.trunc((dx - nodePad / 2) / (nodeSize + nodePad));
  var yDiv = Math.trunc((dy - nodePad / 2) / (nodeSize + nodePad));
  return xDiv + (yDiv * Blockly.FieldMatrixCustom.MATRIX_COL);
};
 
Blockly.FieldMatrixCustom.prototype.dispose_ = function() {
  var thisField = this;
  return function() {
    Blockly.FieldMatrixCustom.superClass_.dispose_.call(thisField)();
    thisField.matrixStage_ = null;
    if (thisField.mouseDownWrapper_) {
      Blockly.unbindEvent_(thisField.mouseDownWrapper_);
    }
    if (thisField.matrixTouchWrapper_) {
      Blockly.unbindEvent_(thisField.matrixTouchWrapper_);
    }
    if (thisField.matrixReleaseWrapper_) {
      Blockly.unbindEvent_(thisField.matrixReleaseWrapper_);
    }
    if (thisField.matrixMoveWrapper_) {
      Blockly.unbindEvent_(thisField.matrixMoveWrapper_);
    }
  };
};
 
Blockly.Field.register('field_matrix_custom', Blockly.FieldMatrixCustom);