'use strict';

goog.provide('Blockly.Python.matrixcustom');

goog.require('Blockly.Python');


Blockly.Python['matrix_custom'] = function(block) {
//   console.log(block.getFieldValue('MATRIX_CUSTOM'))
  return block.getFieldValue('MATRIX_CUSTOM')
};
