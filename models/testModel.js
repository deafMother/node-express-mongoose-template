const mongoose = require("mongoose");

/*
    questions:[
    {
        question: what are tapables,
        options:[
            {a: "code flow"},{b:"web workers"},{c:"some typ of function"},{d:"web pack object"}
        
        ],
        answer: "b"
    
    },
    {
        ...
    }
    ]

*/

const optionSchema = new mongoose.Schema({
  option: {
    type: String,
  },
  desc: {
    type: String,
  },
});

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, "a question must have a question description"],
  },
  options: [optionSchema],
  answer: {
    type: String,
    required: [true, "answer must be provided"],
  },
});

const testSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: ["true", "a test must have a description"],
    },
    questions: [questionSchema],
  },
  {
    timestamps: true,
  }
);

const Test = mongoose.model("Test", testSchema);
module.exports = Test;
