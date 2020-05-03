const sendErrorPro = (err, req, res) => {
  // console.log(err);
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

module.exports = (err, req, res) => {
  console.log(err);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  sendErrorPro(err, req, res);
};

// catch Async will throw an error with a new error object  using next(errObject) and this will catch that error
// in some cases we will also manually throw errors using AppError in which case we will specify the error codes and error message
