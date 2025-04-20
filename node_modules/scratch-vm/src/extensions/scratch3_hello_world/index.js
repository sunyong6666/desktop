const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type')

class HelloWorld {
  getInfo() {
    return {
      id: 'helloworld',
      name: 'test block!',
      blocks: [
        {
          opcode: 'hello',
          blockType: BlockType.REPORTER,
          text: 'Hello!'
        },
        {
          opcode: 'strictlyEquals',
          blockType: BlockType.BOOLEAN,
          text: '[ONE] strictly equals [TWO]',
          arguments: {
            ONE: {
              type: ArgumentType.STRING
            },
            TWO: {
              type: ArgumentType.STRING,
              defaultValue: 'Second value'
            }
          }
        }

      ]
    };
  }

  hello() {
    console.log('执行了')
    return 'World!';
  }
  strictlyEquals(args) {
    return args.ONE === args.TWO;
  }


   // 新增方法：为每个块生成Python代码
   generatePythonCode(block) {
    switch (block.opcode) {
      case 'hello':
        return this.generateHelloPythonCode();
      case 'strictlyEquals':
        return this.generateStrictlyEqualsPythonCode(block);
      default:
        return '';
    }
  }

  generateHelloPythonCode() {
    return '# Hello block\nprint("Hello!")';
  }

  generateStrictlyEqualsPythonCode(block) {
    const argOne = block.arguments.ONE.value || '\'\''; // 如果没有值，使用空字符串
    const argTwo = block.arguments.TWO.value || '\'Second value\''; // 使用默认值或提供的值
    return `# Strictly Equals block\n${argOne} == ${argTwo}`;
  }



  // constructor(runtime) {
  //   // 在构造函数中注册代码生成器
  //   this.generatePythonCode();
  // }

  // registerPythonGenerators() {
  //   console.log(Blockly)
  //   Blockly.Python['hello '] = function(block) {
  //     const code = '\'World!\'';
  //     return [code, Blockly.Python.ORDER_ATOMIC];
  //   };

  //   Blockly.Python['strictlyEquals'] = function(block) {
      
  //     const code =' == ';
  //     return [code, Blockly.Python.ORDER_RELATIONAL];
  //   };
  // }

}

// global.Scratch.extensions.register(new HelloWorld());

module.exports = HelloWorld;
