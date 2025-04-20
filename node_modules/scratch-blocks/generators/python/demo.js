'use strict';
goog.provide('Blockly.Python.demo');

goog.require('Blockly.Python');
Blockly.Python['demo1']=function(block){
    // alert(JSON.stringify(block))
	// Blockly.Python.definitions_['from PIL import Image'] = "from PIL import Image";
    
    let code=''
    let name= block.getFieldValue('DEMO') || 'False';
    let light= Blockly.Python.valueToCode(block, 'FIELDNAME2',Blockly.Python.ORDER_NONE) || 'False';
    let state = block.getFieldValue('FIELDNAME3') || 'False';

    Blockly.Python.definitions_[`LED${name}=ICM_IO_Port_Dev.LED(${name})`] = `LED${name}=ICM_IO_Port_Dev.LED(${name})`;
    if (state=='0'){
        code = `LED${name}.write(${light})\n`;
      }else {
        code = `LED${name}.write(0)\n`;
      }
	return code;
};

Blockly.Python['text_cus']=function(block){
    let code=''
    let value=block.getFieldValue('TEXT');

    code=`${value}`;
    return [code,Blockly.Python.ORDER_NONE];
}

Blockly.Python['elect_rate']=function(block){
    // alert(JSON.stringify(block))
	// Blockly.Python.definitions_['from PIL import Image'] = "from PIL import Image";
    
    let code=''
    let elect= block.getFieldValue('ELECT') || 'False';
    let rate= Blockly.Python.valueToCode(block, 'RATE',Blockly.Python.ORDER_NONE) || 'False';

    Blockly.Python.definitions_[`M${elect}=ICM_IIC_Port_Dev.ServoMotor(${elect})`] = `M${elect}=ICM_IIC_Port_Dev.ServoMotor(${elect})`;
    code=`M${elect}.write([0x01,${rate},0])\n`
	return code;
};