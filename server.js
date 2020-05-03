const mongoose = require("mongoose");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const app = require("./app");

const DB_URL = process.env.DB_URL;
const PORT = process.env.PORT || 7000;

mongoose
  .connect(DB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB connected successfully");
    app.listen(PORT, () => {
      console.log("Server running on port..." + PORT);
    });
  })
  .catch((err) => {
    console.log("Error in connection", err);
  });
