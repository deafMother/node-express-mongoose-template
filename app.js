const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const app = express();

const AppError = require("./uttil/appError");
const globalErrorHandler = require("./uttil/errorHandler");

const Test = require("./models/testModel");

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + "/public"));

app.use(morgan("dev"));

// setting the view engine path
app.set("views", path.join(__dirname, "views"));

// setting the view engine
app.set("view engine", "ejs");

app.post("/test", async (req, res) => {
  try {
    const test = await Test.create(req.body);

    res.status(200).json({
      status: "success",
      test,
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/test/:id", async (req, res) => {
  const testId = req.params.id;
  try {
    const test = await Test.findById(testId).select({ "questions.answer": 0 }); //  .project({ 'size.uom': 0 });

    res.json({
      status: "success",
      test,
    });
  } catch (err) {
    console.log(err);
  }
});

// default undefined routes
app.all("*", (req, res, next) => {
  next(new AppError("This route is not defined", 404));
});

// global error handler
app.use(globalErrorHandler);

module.exports = app;
