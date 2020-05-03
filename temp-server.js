const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
var expressLayouts = require("express-ejs-layouts");

const cors = require("cors");
const app = express();

app.use(bodyParser());
app.use(cors());
app.use(expressLayouts);

// static folder
app.use(express.static(__dirname + "/public"));

// setting the view engine path
app.set("views", path.join(__dirname, "views"));

// setting the view engine
app.set("view engine", "ejs");

// endering te template
app.get("/", function (req, res) {
  res.render("index", {
    foo: "hag rider",
  });
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(8000, () => {
  console.log("running in 8000");
});
