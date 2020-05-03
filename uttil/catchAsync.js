// this is the async error catch handler for the controller functions
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err)); // the global error hadling middleware will catch this next(err)
  };
};
