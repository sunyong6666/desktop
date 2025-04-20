// 'use strict';

goog.provide('Blockly.Blocks.demo');

goog.require('Blockly.Blocks');
goog.require('Blockly.Colours');
goog.require('Blockly.constants');
goog.require('Blockly.ScratchBlocks.VerticalExtensions');

Blockly.Blocks['demo1'] = {
    /**
     * Block to move steps.
     * @this Blockly.Block
     */
    init: function() {
      this.jsonInit({
        "message0": 'LED灯 %1 以 %2 亮度 %3',
        "args0": [
          {
            "type": "field_dropdown",
            "name": "DEMO",
            "options": [
              [ "A", "1" ],
              [ "B", "2" ],
              [ "C", "3" ],
              [ "D", "4" ]
            ]
          },
          {
            "type": 'input_value',
            "name": "FIELDNAME2",
          },
          {
            "type": 'field_dropdown',
            "name": "FIELDNAME3",
            "options": [
              [ "开", "0" ],
              [ "关", "1" ]
            ]
      
          },
        ],
        // "category": Blockly.Categories.demo,
        // "extensions": ["colours_motion", "shape_statement"]
        "colour":30,
        "previousStatement":null,
        "nextStatement":null
      });
    }
};

Blockly.Blocks['text_cus'] = {
  /**
   * Block to move steps.
   * @this Blockly.Block
   */
  init: function() {
    this.jsonInit({
      "message0": ' %1',
      "args0": [
        {
          "type": 'field_input',
          "name": "TEXT",
          "text":"",
          "spellcheck":false
        },
      ],
      // "category": Blockly.Categories.demo,
      // "extensions": ["colours_motion", "shape_statement"]
      "colour":30,
      "output":'String',
      "shape":"round"
    });
  }
};


Blockly.Blocks['elect_rate'] = {
  /**
   * Block to move steps.
   * @this Blockly.Block
   */
  init: function() {
    this.jsonInit({
      "message0": '%1 电机 以 %2 速度转动',
      "args0": [
        {
          "type": "field_dropdown",
          "name": "ELECT",
          "options": [
            [ "1", "1" ],
            [ "2", "2" ],
            [ "3", "3" ],
            [ "4", "4" ],
            [ "5", "5" ],
            [ "6", "6" ]
          ]
        },
        {
          "type": 'input_value',
          "name": "RATE",
        },
      ],
      // "category": Blockly.Categories.demo,
      // "extensions": ["colours_motion", "shape_statement"]
      "colour":30,
      "previousStatement":null,
      "nextStatement":null
    });
  }
};

