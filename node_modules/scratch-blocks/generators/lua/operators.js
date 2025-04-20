'use strict';

goog.provide('Blockly.Lua.operators');

goog.require('Blockly.Lua');


Blockly.Lua['operator_add'] = function(block) {
    let ONE= Blockly.Lua.valueToCode(block, 'NUM1',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'NUM1');
    let TWO= Blockly.Lua.valueToCode(block, 'NUM2',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'NUM2');
    let code=`(${ONE}+${TWO})`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};

Blockly.Lua['operator_subtract'] = function(block) {
    let ONE= Blockly.Lua.valueToCode(block, 'NUM1',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'NUM1');
    let TWO= Blockly.Lua.valueToCode(block, 'NUM2',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'NUM2');
    let code=`(${ONE}-${TWO})`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};

Blockly.Lua['operator_multiply'] = function(block) {
    let ONE= Blockly.Lua.valueToCode(block, 'NUM1',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'NUM1');
    let TWO= Blockly.Lua.valueToCode(block, 'NUM2',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'NUM2');
    let code=`(${ONE}*${TWO})`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};

Blockly.Lua['operator_divide'] = function(block) {
    let ONE= Blockly.Lua.valueToCode(block, 'NUM1',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'NUM1');
    let TWO= Blockly.Lua.valueToCode(block, 'NUM2',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'NUM2');
    let code=`(${ONE}/${TWO})`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};

Blockly.Lua['operator_random'] = function(block) {
    let ONE= Blockly.Lua.valueToCode(block, 'FROM',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'FROM');
    let TWO= Blockly.Lua.valueToCode(block, 'TO',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'TO');
    let code=`math.random(${ONE}, ${TWO})`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};

Blockly.Lua['operator_lt'] = function(block) {
    let ONE= Blockly.Lua.valueToCode(block, 'OPERAND1',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'OPERAND1');
    let TWO= Blockly.Lua.valueToCode(block, 'OPERAND2',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'OPERAND2');

    try{
        ONE=ONE.replace(/'/g, '');
        TWO=TWO.replace(/'/g, '');
    }catch(e){

    }
    
    let code=`${ONE}<${TWO}`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};

Blockly.Lua['operator_gt'] = function(block) {
    let ONE= Blockly.Lua.valueToCode(block, 'OPERAND1',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'OPERAND1');
    let TWO= Blockly.Lua.valueToCode(block, 'OPERAND2',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'OPERAND2');
    try{
        ONE=ONE.replace(/'/g, '');
        TWO=TWO.replace(/'/g, '');
    }catch(e){

    }
    let code=`${ONE}>${TWO}`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};

Blockly.Lua['operator_equals'] = function(block) {
    let ONE= Blockly.Lua.valueToCode(block, 'OPERAND1',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'OPERAND1');
    let TWO= Blockly.Lua.valueToCode(block, 'OPERAND2',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'OPERAND2');
    try{
        ONE=ONE.replace(/'/g, '');
        TWO=TWO.replace(/'/g, '');
    }catch(e){

    }
    let code=`${ONE}==${TWO}`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};

Blockly.Lua['operator_and'] = function(block) {
    let ONE= Blockly.Lua.valueToCode(block, 'OPERAND1', Blockly.Lua.ORDER_NONE) || 'false';
    let TWO= Blockly.Lua.valueToCode(block, 'OPERAND2', Blockly.Lua.ORDER_NONE) || 'false';
    let code=`${ONE} and ${TWO}`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};


Blockly.Lua['operator_or'] = function(block) {
    let ONE= Blockly.Lua.statementToCode(block, 'OPERAND1');
    let TWO= Blockly.Lua.statementToCode(block, 'OPERAND2');
    let code=`${ONE} or ${TWO}`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};

Blockly.Lua['operator_not'] = function(block) {
    let ONE= Blockly.Lua.statementToCode(block, 'OPERAND');
    let code=`not(${ONE})`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};

Blockly.Lua['operator_join'] = function(block) {
    let ONE= Blockly.Lua.valueToCode(block, 'STRING1',Blockly.Lua.ORDER_NONE) || '';
    let TWO= Blockly.Lua.valueToCode(block, 'STRING2',Blockly.Lua.ORDER_NONE) || '';
    let code=`${ONE} .. ${TWO}`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};

Blockly.Lua['operator_letter_of'] = function(block) {
    let ONE= Blockly.Lua.valueToCode(block, 'LETTER',Blockly.Lua.ORDER_NONE) || '1';
    let TWO= Blockly.Lua.valueToCode(block, 'STRING',Blockly.Lua.ORDER_NONE) || '\'\'';
    let code=`string.sub(${TWO}, ${ONE}, ${ONE})`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};

Blockly.Lua['operator_length'] = function(block) {
    let ONE= Blockly.Lua.valueToCode(block, 'STRING',Blockly.Lua.ORDER_NONE) || '';
    let code=`string.len(${ONE})`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};


Blockly.Lua['operator_contains'] = function(block) {
    let ONE= Blockly.Lua.valueToCode(block, 'STRING1',Blockly.Lua.ORDER_NONE) || '';
    let TWO= Blockly.Lua.valueToCode(block, 'STRING2',Blockly.Lua.ORDER_NONE) || '';
    let code=`string.find(${ONE}, ${TWO})`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};

Blockly.Lua['operator_mod'] = function(block) {
    let ONE= Blockly.Lua.valueToCode(block, 'NUM1',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'NUM1');
    let TWO= Blockly.Lua.valueToCode(block, 'NUM2',Blockly.Lua.ORDER_NONE) || Blockly.Lua.statementToCode(block, 'NUM2');
    let code=`(${ONE}%${TWO})`
    

    let parent=block
    while (parent.getParent()) {
        parent = parent.getParent();
    }
    if(parent.type=='bricksevent_when'){
        return [code,Blockly.Lua.ORDER_NONE];
    }else{
      return ''
    }
};
