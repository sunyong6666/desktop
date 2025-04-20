/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Lua for logic blocks.
 */
'use strict';

goog.provide('Blockly.Lua.control');

goog.require('Blockly.Lua');



Blockly.Lua['control_if'] = function(block) {
  // If/elseif/else condition.
  let n = 0;
  let code = '';
  if (Blockly.Lua.STATEMENT_PREFIX) {
    // Automatic prefix insertion is switched off for this block.  Add manually.
    code += Blockly.Lua.injectId(Blockly.Lua.STATEMENT_PREFIX, block);
  }
  // do {
  //   const conditionCode =
  //   Blockly.Lua.valueToCode(block, 'CONDITION' + n, Blockly.Lua.ORDER_NONE) || 'false';
  //   let branchCode = Blockly.Lua.statementToCode(block, 'SUBSTACK' + n);
  //   if (Blockly.Lua.STATEMENT_SUFFIX) {
  //     branchCode = Blockly.Lua.prefixLines(
  //       Blockly.Lua.injectId(Blockly.Lua.STATEMENT_SUFFIX, block), Blockly.Lua.INDENT) + branchCode;
  //   }
  //   code +=
  //       (n > 0 ? 'else' : '') + 'if ' + conditionCode + ' then\n' + branchCode;
  //   n++;
  // } while (block.getInput('CONDITION' + n));

    const conditionCode =
    Blockly.Lua.valueToCode(block, 'CONDITION', Blockly.Lua.ORDER_NONE) || 'false';
    let branchCode = Blockly.Lua.statementToCode(block, 'SUBSTACK');
    if (Blockly.Lua.STATEMENT_SUFFIX) {
      branchCode = Blockly.Lua.prefixLines(
        Blockly.Lua.injectId(Blockly.Lua.STATEMENT_SUFFIX, block), Blockly.Lua.INDENT) + branchCode;
    }
    code +=
        'if ' + conditionCode + ' then\n' + branchCode;

  if (block.getInput('ELSE') || Blockly.Lua.STATEMENT_SUFFIX) {
    let branchCode = Blockly.Lua.statementToCode(block, 'ELSE');
    if (Blockly.Lua.STATEMENT_SUFFIX) {
      branchCode = Blockly.Lua.prefixLines(
        Blockly.Lua.injectId(Blockly.Lua.STATEMENT_SUFFIX, block), Blockly.Lua.INDENT) +
          branchCode;
    }
    code += 'else\n' + branchCode;
  }

  let parent=block
  while (parent.getParent()) {
      parent = parent.getParent();
  }
  if(parent.type=='bricksevent_when'){
    return code + 'end\n';
  }else{
    return ''
  }
  
};

// Blockly.Lua['control_ifelse'] = Blockly.Lua['control_if'];
Blockly.Lua['control_if_else'] = function(block){
  var argument = Blockly.Lua.valueToCode(block, 'CONDITION',
    Blockly.Lua.ORDER_NONE) || 'False';
  var branch = Blockly.Lua.statementToCode(block, 'SUBSTACK');
  // branch = Blockly.Python.addLoopTrap(branch, block.id);
  var branch2 = Blockly.Lua.statementToCode(block, 'SUBSTACK2');
  // branch2 = Blockly.Python.addLoopTrap(branch2, block.id);

  var code = "if " + argument + " then\n";
  code += branch;
  // if (branch) {
  //     code += branch;
  // } else {
  //     code += Blockly.Lua.INDENT + "pass\n";
  // }
  code += "else\n";
  code += branch2;
  // if (branch2) {
  //     code += branch2;
  // } else {
  //     code += Blockly.Lua.INDENT + "pass\n";
  // }
  let parent=block
  while (parent.getParent()) {
      parent = parent.getParent();
  }
  if(parent.type=='bricksevent_when'){
    return code + 'end\n';
  }else{
    return ''
  }
}

Blockly.Lua['control_compare'] = function(block) {
  // Comparison operator.
  const OPERATORS =
      {'EQ': '==', 'NEQ': '~=', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>='};
  const operator = OPERATORS[block.getFieldValue('OP')];
  const argument0 = Blockly.Lua.valueToCode(block, 'A', Blockly.Lua.ORDER_RELATIONAL) || '0';
  const argument1 = Blockly.Lua.valueToCode(block, 'B', Blockly.Lua.ORDER_RELATIONAL) || '0';
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, Blockly.Lua.ORDER_RELATIONAL];
};

Blockly.Lua['control_operation'] = function(block) {
  // Operations 'and', 'or'.
  const operator = (block.getFieldValue('OP') === 'AND') ? 'and' : 'or';
  const order = (operator === 'and') ? Blockly.Lua.ORDER_AND : Blockly.Lua.ORDER_OR;
  let argument0 = Blockly.Lua.valueToCode(block, 'A', order);
  let argument1 = Blockly.Lua.valueToCode(block, 'B', order);
  if (!argument0 && !argument1) {
    // If there are no arguments, then the return value is false.
    argument0 = 'false';
    argument1 = 'false';
  } else {
    // Single missing arguments have no effect on the return value.
    const defaultArgument = (operator === 'and') ? 'true' : 'false';
    if (!argument0) {
      argument0 = defaultArgument;
    }
    if (!argument1) {
      argument1 = defaultArgument;
    }
  }
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Lua['control_negate'] = function(block) {
  // Negation.
  const argument0 = Blockly.Lua.valueToCode(block, 'BOOL', Blockly.Lua.ORDER_UNARY) || 'true';
  const code = 'not ' + argument0;
  return [code, Blockly.Lua.ORDER_UNARY];
};

Blockly.Lua['control_boolean'] = function(block) {
  // Boolean values true and false.
  const code = (block.getFieldValue('BOOL') === 'TRUE') ? 'true' : 'false';
  return [code, Blockly.Lua.ORDER_ATOMIC];
};

Blockly.Lua['control_null'] = function(block) {
  // Null data type.
  return ['nil', Blockly.Lua.ORDER_ATOMIC];
};

Blockly.Lua['control_ternary'] = function(block) {
  // Ternary operator.
  const value_if = Blockly.Lua.valueToCode(block, 'IF', Blockly.Lua.ORDER_AND) || 'false';
  const value_then = Blockly.Lua.valueToCode(block, 'THEN', Blockly.Lua.ORDER_AND) || 'nil';
  const value_else = Blockly.Lua.valueToCode(block, 'ELSE', Blockly.Lua.ORDER_OR) || 'nil';
  const code = value_if + ' and ' + value_then + ' or ' + value_else;
  return [code, Blockly.Lua.ORDER_OR];
};

Blockly.Lua['control_wait'] = function(block) {
  console.log(Blockly.Lua)
  let duration=Blockly.Lua.valueToCode(block, 'DURATION', Blockly.Lua.ORDER_NONE) || 'false';
  // let duration = block.getFieldValue('DURATION')
  console.log(duration)
  let second=block.getFieldValue('SECOND')
  console.log(second)
  let code;

  if(second=='s'){
    code=`D1(${duration})\n`
  }else{
    code=`Dm(${duration})\n`
  }

  let parent=block
  while (parent.getParent()) {
      parent = parent.getParent();
  }
  if(parent.type=='bricksevent_when'){
    return code
  }else{
    return ''
  }
}

Blockly.Lua['control_forever'] = function(block) {
  let substack=Blockly.Lua.statementToCode(block, 'SUBSTACK');
  let code=`D1(1)
while(true)
  do
  _C()
  ${substack}
  end`
  let parent=block
  while (parent.getParent()) {
      parent = parent.getParent();
  }
  if(parent.type=='bricksevent_when'){
    return code
  }else{
    return ''
  }
  
}

Blockly.Lua['control_repeat'] = function(block) {
  let repeats = Blockly.Lua.valueToCode(block, 'TIMES',
    Blockly.Lua.ORDER_NONE);
  let branch = Blockly.Lua.statementToCode(block, 'SUBSTACK');
  
  let code=`for var=0,${repeats} do \n`
  code+=branch

  let parent=block
  while (parent.getParent()) {
      parent = parent.getParent();
  }
  if(parent.type=='bricksevent_when'){
    return code + 'end\n';
  }else{
    return ''
  }
}


Blockly.Lua['control_wait_until'] = function(block) {
  let argument = Blockly.Lua.valueToCode(block, 'CONDITION',
    Blockly.Lua.ORDER_NONE);
  
  let code=`while(not ${argument})
    do
    end\n`

  let parent=block
  while (parent.getParent()) {
      parent = parent.getParent();
  }
  if(parent.type=='bricksevent_when'){
    return code;
  }else{
    return ''
  }
}

Blockly.Lua['control_repeat_until'] = function(block) {
  let argument = Blockly.Lua.valueToCode(block, 'CONDITION',
    Blockly.Lua.ORDER_NONE);

  let branch = Blockly.Lua.statementToCode(block, 'SUBSTACK');
  
  let code=`while(not ${argument})
    do
      ${branch}
    end\n`

  let parent=block
  while (parent.getParent()) {
      parent = parent.getParent();
  }
  if(parent.type=='bricksevent_when'){
    return code;
  }else{
    return ''
  }
}


Blockly.Lua['control_while'] = function(block) {
  let argument = Blockly.Lua.valueToCode(block, 'CONDITION',
    Blockly.Lua.ORDER_NONE);

  let branch = Blockly.Lua.statementToCode(block, 'SUBSTACK');
  
  let code=`while(${argument})
    do
      ${branch}
    end\n`

  let parent=block
  while (parent.getParent()) {
      parent = parent.getParent();
  }
  if(parent.type=='bricksevent_when'){
    return code;
  }else{
    return ''
  }
}

