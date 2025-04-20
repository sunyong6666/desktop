'use strict';


goog.provide('Blockly.Lua.extensions');

goog.require('Blockly.Lua');
Blockly.Lua['helloworld_hello']=function(block){
    // alert(JSON.stringify(block))
	// Blockly.Python.definitions_['from PIL import Image'] = "from PIL import Image";
    
    let code='aaaa'

	return code;
};

Blockly.Lua['helloworld_strictlyEquals']=function(block){
    // alert(JSON.stringify(block))
	Blockly.Lua.definitions_['from PIL import Image'] = "from PIL import Image";
    // console.log(block)
    let ONE= Blockly.Lua.valueToCode(block, 'ONE',Blockly.Lua.ORDER_NONE) || 'False';
    let TWO= Blockly.Lua.valueToCode(block, 'TWO',Blockly.Lua.ORDER_NONE) || 'False';
    let code=`${ONE}==${TWO}`

	return [code,Blockly.Lua.ORDER_NONE];
};
//bricks
Blockly.Lua['brickssensors_motoranagle']=function(block){
    // alert(JSON.stringify(block))
	// Blockly.Lua.definitions_['from PIL import Image'] = "from PIL import Image";
    // console.log(block.getFieldValue('ONE'))
    // console.log(block.getFieldValue)
    // let ONE= Blockly.Lua.valueToCode(block, 'ONE',Blockly.Lua.ORDER_NONE) || 'False';
    let ONE= block.getFieldValue('ONE');
    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    let code=`S2(${ONE},1)`

    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
        return ''
    }
	
};
function isNumeric(str) {
    const regex = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;
    return regex.test(str);
  }
Blockly.Lua['bricksmotor_motorSpeed']=function(block){
    let ONE = block.getFieldValue('ONE');
    let TWO = Blockly.Lua.valueToCode(block, 'TWO',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'TWO');
    let THREE = block.getFieldValue('THREE');
    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    console.log(parent)
    console.log(parent.type);
    
    console.log(TWO);
    TWO=TWO.replace(/^["']|["']$/g, '');
    // if(TWO){
    //     TWO=parseFloat(TWO.match(/-?\d+(\.\d+)?/));
    // }
    if(isNumeric(TWO) && TWO>255){
        alert('请输入0~255之间的数字')
        return `S1(${ONE},0x01,0,0)\n`
    }
    
    TWO=`${TWO}*${THREE}`
    let code=`S1(${ONE},0x01,${TWO},0)\n`

    if(parent.type=='bricksevent_when'){
        return code;
    }else{
        return ''
    }
	
};
Blockly.Lua['bricksmotor_motorSpeedCir']=function(block){
    let ONE = block.getFieldValue('ONE');
    let TWO = Blockly.Lua.valueToCode(block, 'TWO',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block,'TWO');
    let THREE = block.getFieldValue('THREE');
    let FOUR = Blockly.Lua.valueToCode(block, 'FOUR',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block,'FOUR');
    let FIVE = block.getFieldValue('FIVE');
    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    // if(TWO){
    //     TWO=parseFloat(TWO.match(/-?\d+(\.\d+)?/));
    // }
    TWO=TWO.replace(/^["']|["']$/g, '');
    // if(FOUR){
    //     FOUR=parseFloat(FOUR.match(/-?\d+(\.\d+)?/));
    // }
    FOUR=FOUR.replace(/^["']|["']$/g, '');
    if(isNumeric(TWO) && TWO>255){
        alert('请输入0~255之间的数字')
        return `S4(${ONE},0x04,0,0)\n`
    }
    TWO=`${TWO}*${THREE}`
    if(parent.type=='bricksevent_when'){
        if(FIVE==1){
            FOUR=`${FOUR}*360`
            return `S4(${ONE},0x04,${TWO},${FOUR})\n`
        }else if(FIVE == 2){
            return `S4(${ONE},0x04,${TWO},${FOUR})\n`
        }else if(FIVE == 3){
            return `S4(${ONE},0x02,${TWO},${FOUR})\n`
        }
    }else{
        return ''
    }
    
    
};

Blockly.Lua['bricksmotor_setZero']=function(block){
    let ONE = block.getFieldValue('ONE');
    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    let code=`S2(${ONE},0)\n`
    if(parent.type=='bricksevent_when'){
        return code
    }else{
        return ''
    }
    
    
};

Blockly.Lua['bricksmotor_moveto']=function(block){
    let ONE = block.getFieldValue('ONE');
    let TWO = Blockly.Lua.valueToCode(block, 'TWO',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block,'TWO');
    let THREE = Blockly.Lua.valueToCode(block, 'THREE',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block,'THREE');
    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    // if(TWO){
    //     TWO=parseFloat(TWO.match(/-?\d+(\.\d+)?/));
    // }
    TWO=TWO.replace(/^["']|["']$/g, '');
    if(isNumeric(TWO) && TWO>255){
        alert('请输入0~255之间的数字')
        return `S4(${ONE},0x03,0,0)\n`
    }
    // if(THREE){
    //     THREE=parseFloat(THREE.match(/-?\d+(\.\d+)?/));
    // }
    THREE=THREE.replace(/^["']|["']$/g, '');
    let code=`S4(${ONE},0x03,${TWO},${THREE})\n`

    if(parent.type=='bricksevent_when'){
        return code;
    }else{
        return ''
    }
	
};

Blockly.Lua['bricksmotor_stop']=function(block){
    let ONE = block.getFieldValue('ONE');
    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    let code=`S4(${ONE},0x00,0,0)\n`

    if(parent.type=='bricksevent_when'){
        return code;
    }else{
        return ''
    }
	
};

let firstMotor=1;
let secondMotor=2;
Blockly.Lua['brickstwomotor_setmovemotor']=function(block){
    let ONE = block.getFieldValue('ONE');
    let TWO = block.getFieldValue('TWO');
    firstMotor=ONE
    secondMotor=TWO

	return '';
};

Blockly.Lua['brickstwomotor_speedmove']=function(block){
    let ONE = block.getFieldValue('ONE');
    let TWO = Blockly.Lua.valueToCode(block, 'TWO',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block,'TWO');
    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    // if(TWO){
    //     TWO=parseFloat(TWO.match(/-?\d+(\.\d+)?/));
    // }
    TWO=TWO.replace(/^["']|["']$/g, '');
    if(isNumeric(TWO) && TWO>255){
        alert('请输入0~255之间的数字')
        return `S5(${firstMotor},${secondMotor},0x01,0,0,${ONE})\n`
    }
    let code=`S5(${firstMotor},${secondMotor},0x01,${TWO},0,${ONE})\n`
    if(parent.type=='bricksevent_when'){
        return code;
    }else{
        return ''
    }
	
};

Blockly.Lua['brickstwomotor_speedmoveplace']=function(block){
    let ONE = block.getFieldValue('ONE');
    let TWO = Blockly.Lua.valueToCode(block, 'TWO',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block,'TWO');
    let THREE = Blockly.Lua.valueToCode(block, 'THREE',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block,'THREE');
    let FOUR = block.getFieldValue('FOUR');
    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    let code;
    // if(TWO){
    //     TWO=parseFloat(TWO.match(/-?\d+(\.\d+)?/));
    // }
    TWO=TWO.replace(/^["']|["']$/g, '');
    if(isNumeric(TWO) && TWO>255){
        alert('请输入0~255之间的数字')
        return `S5(${firstMotor},${secondMotor},0x04,0,0,${ONE})\n`
    }
    // if(THREE){
    //     THREE=parseFloat(THREE.match(/-?\d+(\.\d+)?/));
    // }
    THREE=THREE.replace(/^["']|["']$/g, '');
    if(FOUR==1){
        THREE=`${THREE}*360`
        code=`S5(${firstMotor},${secondMotor},0x04,${TWO},${THREE},${ONE})\n`
    }else if(FOUR==2){
        code=`S5(${firstMotor},${secondMotor},0x04,${TWO},${THREE},${ONE})\n`
    }else if(FOUR==3){
        code=`S5(${firstMotor},${secondMotor},0x02,${TWO},${THREE},${ONE})\n`
    }
    
    if(parent.type=='bricksevent_when'){
        return code;
    }else{
        return ''
    }
	
};

Blockly.Lua['brickstwomotor_stop']=function(block){
    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    let code=`S5(${firstMotor},${secondMotor},0x00,0,0,0)\n`
    if(parent.type=='bricksevent_when'){
        return code;
    }else{
        return ''
    }
	
};

function hexToRgb(hexColor) {
    // 去除可能存在的 '#' 前缀
    hexColor = hexColor.replace('#', '');
  
    // 使用parseInt()函数将十六进制颜色值转换为十进制
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
  
    // 返回RGB格式的颜色值
    return [r, g, b];
}

Blockly.Lua['brickslight_outlight']=function(block){
    let ONE = block.getFieldValue('ONE');
    let TWO = Blockly.Lua.valueToCode(block, 'TWO',Blockly.Lua.ORDER_NONE);
    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    let rgb=hexToRgb(TWO)

    let code=`L1(${ONE},${rgb[0]},${rgb[1]},${rgb[2]})\n`
    if(parent.type=='bricksevent_when'){
        return code;
    }else{
        return ''
    }
	
};

Blockly.Lua['brickslight_inlight']=function(block){
    let ONE = block.getFieldValue('ONE');
    let TWO = Blockly.Lua.valueToCode(block, 'TWO',Blockly.Lua.ORDER_NONE);
    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    let rgb=hexToRgb(TWO)

    let code=`L2(${ONE-1},${rgb[0]},${rgb[1]},${rgb[2]})\n`
    if(parent.type=='bricksevent_when'){
        return code;
    }else{
        return ''
    }
	
};

Blockly.Lua['brickssensors_distance']=function(block){
    let ONE = block.getFieldValue('ONE');
    let TWO = block.getFieldValue('TWO');
    let THREE = Blockly.Lua.valueToCode(block, 'THREE',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block,'THREE');

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    let code;
    // if(THREE){
    //     THREE=parseFloat(THREE.match(/-?\d+(\.\d+)?/));
    // }
    THREE=THREE.replace(/^["']|["']$/g, '');
    if(TWO=='='){
        code=`R1(${ONE})${TWO}${TWO}${THREE}`
    }else{
        code=`R1(${ONE})${TWO}${THREE}`
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
        return ''
    }
    
	
};

Blockly.Lua['brickssensors_song']=function(block){
    let ONE = block.getFieldValue('ONE');
    let TWO = block.getFieldValue('TWO');
    let THREE = Blockly.Lua.valueToCode(block, 'THREE',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block,'THREE');

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    let code;
    // if(THREE){
    //     THREE=parseFloat(THREE.match(/-?\d+(\.\d+)?/));
    // }
    THREE=THREE.replace(/^["']|["']$/g, '');
    if(TWO=='='){
        code=`S3(${ONE})${TWO}${TWO}${THREE}`
    }else{
        code=`S3(${ONE})${TWO}${THREE}`
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
        return ''
    }
	
};

Blockly.Lua['brickssensors_knob']=function(block){
    let ONE = block.getFieldValue('ONE');
    let TWO = block.getFieldValue('TWO');
    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }

    let code=`E2(${ONE},${TWO})`
	if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
        return ''
    }
};

Blockly.Lua['brickssensors_incline']=function(block){
    let ONE = block.getFieldValue('ONE');
    let TWO = block.getFieldValue('TWO');
    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }

    let code=`G3(${ONE},${TWO})`
	if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
        return ''
    }
};

Blockly.Lua['brickssensors_handpose']=function(block){
    let ONE = block.getFieldValue('ONE');
    let TWO = block.getFieldValue('TWO');

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    let code=`G4(${ONE},${TWO})`
	if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
        return ''
    }
};

Blockly.Lua['brickssensors_controlbutton']=function(block){
    let ONE = block.getFieldValue('ONE');

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    let code=`K1(${ONE})`
	if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
        return ''
    }
};

Blockly.Lua['brickssensors_virtualbutton']=function(block){
    let ONE = block.getFieldValue('ONE');

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    let code=`K2(${ONE})\n`
	if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
        return ''
    }
};

Blockly.Lua['brickssensors_readincline']=function(block){
    let ONE = block.getFieldValue('ONE');
    let TWO = block.getFieldValue('TWO');
    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }

    let code=`G1(${ONE},${TWO})`
	if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
        return ''
    }
};

Blockly.Lua['brickssensors_readknob']=function(block){
    let ONE = block.getFieldValue('ONE');

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    let code=`E1(${ONE})`
	if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
        return ''
    }
};

Blockly.Lua['brickssensors_readdistance']=function(block){
    let ONE = block.getFieldValue('ONE');

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    let code=`R1(${ONE})`
	if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
        return ''
    }
};

Blockly.Lua['brickssensors_readsong']=function(block){
    let ONE = block.getFieldValue('ONE');

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    let code=`S3(${ONE})`
	if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
        return ''
    }
};
Blockly.Lua['bricksevent_when']=function(block){

	return '';
};