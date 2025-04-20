/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Helper functions for generating Lua for blocks.
 * Based on Ellen Spertus's blocky-lua project.
 * @suppress {checkTypes|globalThis}
 */
'use strict';

// goog.module('Blockly.Lua');

// const stringUtils = goog.require('Blockly.utils.string');
// const {Block} = goog.requireType('Blockly.Block');
// const {CodeGenerator} = goog.require('Blockly.CodeGenerator');
// const {inputTypes} = goog.require('Blockly.inputTypes');
// const {Names} = goog.require('Blockly.Names');
// const {Workspace} = goog.requireType('Blockly.Workspace');
goog.provide('Blockly.Lua');

goog.require('Blockly.Generator');


/**
 * Lua code generator.
 * @type {!Blockly.Generator}
 */
Blockly.Lua = new Blockly.Generator('Lua');

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 */
Blockly.Lua.addReservedWords(
    // Special character
    '_,' +
    // From theoriginalbit's script:
    // https://github.com/espertus/blockly-lua/issues/6
    '__inext,assert,bit,colors,colours,coroutine,disk,dofile,error,fs,' +
    'fetfenv,getmetatable,gps,help,io,ipairs,keys,loadfile,loadstring,math,' +
    'native,next,os,paintutils,pairs,parallel,pcall,peripheral,print,' +
    'printError,rawequal,rawget,rawset,read,rednet,redstone,rs,select,' +
    'setfenv,setmetatable,sleep,string,table,term,textutils,tonumber,' +
    'tostring,turtle,type,unpack,vector,write,xpcall,_VERSION,__indext,' +
    // Not included in the script, probably because it wasn't enabled:
    'HTTP,' +
    // Keywords (http://www.lua.org/pil/1.3.html).
    'and,break,do,else,elseif,end,false,for,function,if,in,local,nil,not,or,' +
    'repeat,return,then,true,until,while,' +
    // Metamethods (http://www.lua.org/manual/5.2/manual.html).
    'add,sub,mul,div,mod,pow,unm,concat,len,eq,lt,le,index,newindex,call,' +
    // Basic functions (http://www.lua.org/manual/5.2/manual.html, section 6.1).
    'assert,collectgarbage,dofile,error,_G,getmetatable,inpairs,load,' +
    'loadfile,next,pairs,pcall,print,rawequal,rawget,rawlen,rawset,select,' +
    'setmetatable,tonumber,tostring,type,_VERSION,xpcall,' +
    // Modules (http://www.lua.org/manual/5.2/manual.html, section 6.3).
    'require,package,string,table,math,bit32,io,file,os,debug');

/**
 * Order of operation ENUMs.
 * http://www.lua.org/manual/5.3/manual.html#3.4.8
 */
Blockly.Lua.ORDER_ATOMIC = 0;  // literals
// The next level was not explicit in documentation and inferred by Ellen.
Blockly.Lua.ORDER_HIGH = 1;            // Function calls, tables[]
Blockly.Lua.ORDER_EXPONENTIATION = 2;  // ^
Blockly.Lua.ORDER_UNARY = 3;           // not # - ~
Blockly.Lua.ORDER_MULTIPLICATIVE = 4;  // * / %
Blockly.Lua.ORDER_ADDITIVE = 5;        // + -
Blockly.Lua.ORDER_CONCATENATION = 6;   // ..
Blockly.Lua.ORDER_RELATIONAL = 7;      // < > <=  >= ~= ==
Blockly.Lua.ORDER_AND = 8;             // and
Blockly.Lua.ORDER_OR = 9;              // or
Blockly.Lua.ORDER_NONE = 99;

/**
 * Note: Lua is not supporting zero-indexing since the language itself is
 * one-indexed, so the generator does not repoct the oneBasedIndex configuration
 * option used for lists and text.
 */

Blockly.Lua.INDENT='  '
/**
 * Whether the init method has been called.
 * @type {?boolean}
 */
Blockly.Lua.isInitialized = false;

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
Blockly.Lua.init = function(workspace) {
  // console.log(workspace)
  // Call Blockly.CodeGenerator's init.
  Blockly.Lua.definitions_ = Object.create(null);
  Object.getPrototypeOf(this).init.call(this);

  if (!this.nameDB_) {
    this.nameDB_ = new Blockly.Names(this.RESERVED_WORDS_);
  } else {
    this.nameDB_.reset();
  }
  this.nameDB_.setVariableMap(workspace.getVariableMap());
  // this.nameDB_.populateVariables(workspace);
  // this.nameDB_.populateProcedures(workspace);

  this.isInitialized = true;
};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly.Lua.finish = function(code) {
 
  console.log('finish:'+code)
  // Convert the definitions dictionary into a list.
  console.log(Blockly.Lua.definitions_)
  const definitions = Object.values(Blockly.Lua.definitions_);
  // Call Blockly.CodeGenerator's finish.
  code = Object.getPrototypeOf(this).finish.call(this, code);
  this.isInitialized = false;

  this.nameDB_.reset();
  delete Blockly.Lua.definitions_;
  return definitions.join('\n\n') + '\n\n\n' + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything. In Lua, an expression is not a legal statement, so we must assign
 * the value to the (conventionally ignored) _.
 * http://lua-users.org/wiki/ExpressionsAsStatements
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly.Lua.scrubNakedValue = function(line) {
  return line + '\n';
};

/**
 * Encode a string as a properly escaped Blockly.Lua string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} Blockly.Lua string.
 * @protected
 */
Blockly.Lua.quote_ = function(string) {
  string = string.replace(/\\/g, '\\\\')
               .replace(/\n/g, '\\\n')
               .replace(/'/g, '\\\'');
  return '\'' + string + '\'';
};

/**
 * Encode a string as a properly escaped multiline Blockly.Lua string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} Blockly.Lua string.
 * @protected
 */
Blockly.Lua.multiline_quote_ = function(string) {
  const lines = string.split(/\n/g).map(this.quote_);
  // Join with the following, plus a newline:
  // .. '\n' ..
  return lines.join(' .. \'\\n\' ..\n');
};

/**
 * Common tasks for generating Blockly.Lua from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Block} block The current block.
 * @param {string} code The Blockly.Lua code created for this block.
 * @param {boolean=} opt_thisOnly True to generate code for only this statement.
 * @return {string} Blockly.Lua code with comments and subsequent blocks added.
 * @protected
 */
Blockly.Lua.scrub_ = function(block, code, opt_thisOnly) {
  console.log('aaaaaa')
  // console.log(block)
  let commentCode = '';
  // Only collect comments for blocks that aren't inline.
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    // Collect comment for this block.
    let comment = block.getCommentText();
    if (comment) {
      comment = Blockly.utils.string.wrap(comment, this.COMMENT_WRAP - 3);
      commentCode += this.prefixLines(comment, '-- ') + '\n';
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (let i = 0; i < block.inputList.length; i++) {
      console.log(block.inputList[i].type)
      console.log(Blockly.INPUT_VALUE)
      if (block.inputList[i].type === Blockly.INPUT_VALUE) {
        const childBlock = block.inputList[i].connection.targetBlock();
        if (childBlock) {
          comment = this.allNestedComments(childBlock);
          if (comment) {
            commentCode += this.prefixLines(comment, '-- ');
          }
        }
      }
    }
  }
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  console.log(nextBlock)
  const nextCode = opt_thisOnly ? '' : this.blockToCode(nextBlock);
  console.log(nextCode)
  console.log(code)
  // const nextCode = nextBlock ? this.blockToCode(nextBlock) : '';
  // const nextCode = this.blockToCode(nextBlock);
  return commentCode + code + nextCode;
};

// exports.luaGenerator = Blockly.Lua;
