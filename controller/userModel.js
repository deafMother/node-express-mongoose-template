const jwt = require("jsonwebtoken");
const { promisify } = require("util"); // neede to promisify a function
const CatchAsync = require("../utils/CatchAsync");
const AppError = require("../utils/AppError");
const User = require("../model/userModel");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// generate the jwt token
const generateToken = (user, statusCode, res) => {
  let token = signToken(user.id);
  user.password = undefined; // remove the password from the response
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.createUser = CatchAsync(async (req, res) => {
  const user = await User.create(req.body);
  user.password = undefined;
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// get all users

exports.getAllUsers = CatchAsync(async (req, res, next) => {
  await checkTokenStatus(req, next, true);
  let users;
  if (req.user) {
    users = await User.find({
      blockedUsers: { $ne: req.user._id },
    })
      .select({
        blockedUsers: 0, // 0 means this filed will not appear in the output
      })
      .populate("profileId");
  } else {
    users = await User.find()
      .select({
        blockedUsers: 0,
      })
      .populate("profileId");
  }

  res.status(200).json({
    status: "success",
    data: {
      users,
    },
  });
});

// login user, when the user logs in send the new generated jwt

exports.loginIn = CatchAsync(async (req, res, next) => {
  console.log(req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  const user = await User.findOne({ email })
    .select("+password") //+ means to select this field because in the schema selected is false
    .populate("profileId");
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError(new AppError("Invalid email or password", 404)));
  }
  generateToken(user, 200, res);
});

// check authentication/jwt token status: used in protecting routes and login status of user
const checkTokenStatus = async (req, next, fetchUsers = false) => {
  let token;
  // 1) check if the token exists, i.e  has been send in the request
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies) {
    token = req.cookies.jwt;
  }
  // console.log("token:", token);

  if (fetchUsers && !token) {
    // this is the case use when fetching all users by not logged in users
    return;
  }

  if (!token) {
    return next(
      new AppError("Authentication failed, Please login in to gain access", 401)
    );
  }
  // 2) validate the user of the token still exists in the database
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //3) check if the user still exists
  const freshUser = await User.findById(decoded.id).populate("profileId");
  if (!freshUser) {
    return next(new AppError("The User of this token has been deleted", 401));
  }
  req.user = freshUser;
};

// use for protecting routes
exports.protect = CatchAsync(async (req, res, next) => {
  await checkTokenStatus(req, next);
  if (req.user) {
    next();
  }
});

// use for checking the login status
exports.checkLoginStatus = CatchAsync(async (req, res, next) => {
  await checkTokenStatus(req, next);
  if (req.user) {
    res.status(200).json({
      status: "success",
      data: {
        message: "User logged in",
        data: req.user,
      },
    });
  }
});

// block user, protect this route
exports.blockUser = CatchAsync(async (req, res, next) => {
  const blockedUserId = req.params.blockID;
  // add the blocked id to the users blockedList
  const userID = req.user._id;

  // a user cannot block self, userID is of type objectid so convert ot string
  if (String(userID) === blockedUserId) {
    return next(new AppError("Cannot block self", 404));
  }

  // if user is already blocked then unblock the user

  const user = await User.findOne({ _id: userID, blockedUsers: blockedUserId });
  let updatedUser;
  if (user) {
    //if user is already blocked then remove from blocked list
    updatedUser = await User.findByIdAndUpdate(
      userID,
      {
        $pull: {
          blockedUsers: blockedUserId, // pushing  the id of the post to the  posts array
        },
      },
      {
        new: true,
      }
    );
    if (updatedUser) {
      console.log("C a");
      res.status(200).json({
        status: "success",
        data: {
          message: "unblocked ",
        },
      });
    } else {
      return next(new AppError("Unable to block user please try again", 404));
    }
  } else {
    updatedUser = await User.findByIdAndUpdate(
      userID,
      {
        $addToSet: {
          blockedUsers: blockedUserId, // pushing  the id of the post to the  posts array
        },
      },
      {
        new: true,
      }
    );
    if (updatedUser) {
      console.log("C b");
      res.status(200).json({
        status: "success",
        data: {
          message: "blocked ",
        },
      });
    } else {
      return next(new AppError("Unable to block user please try again", 404));
    }
  }
});

const alterLikes = async (userId, forRoute, value = 1) => {
  await User.findByIdAndUpdate(
    userId,
    {
      $inc: { [forRoute]: value },
    },
    { new: true }
  );
};

// liker user, protect this route
exports.likedUser = CatchAsync(async (req, res, next) => {
  const likeUserId = req.params.likeID;
  // add the liked id to the users liked
  const userID = req.user._id;

  // a user cannot like self, userID is of type objectid so convert ot string
  if (String(userID) === likeUserId) {
    return next(new AppError("Cannot like self", 404));
  }

  // if user is already liked then remove the like

  const user = await User.findOne({ _id: userID, likedUsers: likeUserId });
  let updatedUser;
  if (user) {
    //if user is already like then remove from like list
    updatedUser = await User.findByIdAndUpdate(
      userID,
      {
        $pull: {
          likedUsers: likeUserId, // pushing  the id of the post to the  posts array
        },
      },
      {
        new: true,
      }
    );

    await alterLikes(likeUserId, "likedCount", -1);

    if (updatedUser) {
      res.status(200).json({
        status: "success",
        data: {
          message: "like removed ",
        },
      });
    } else {
      return next(new AppError("Unable to like user please try again", 404));
    }
  } else {
    updatedUser = await User.findByIdAndUpdate(
      userID,
      {
        $addToSet: {
          likedUsers: likeUserId, // pushing  the id of the post to the  posts array
        },
      },
      {
        new: true,
      }
    );

    await alterLikes(likeUserId, "likedCount", 1);

    if (updatedUser) {
      res.status(200).json({
        status: "success",
        data: {
          message: "user liked ",
        },
      });
    } else {
      return next(new AppError("Unable to like user please try again", 404));
    }
  }
});

// liker user, protect this route
exports.superLike = CatchAsync(async (req, res, next) => {
  const likeUserId = req.params.likeID;
  // add the liked id to the users liked
  const userID = req.user._id;

  // a user cannot like self, userID is of type objectid so convert ot string
  if (String(userID) === likeUserId) {
    return next(new AppError("Cannot like self", 404));
  }

  // if user is already liked then remove the like

  const user = await User.findOne({ _id: userID, superLikedUsers: likeUserId });
  let updatedUser;
  if (user) {
    //if user is already like then remove from like list
    updatedUser = await User.findByIdAndUpdate(
      userID,
      {
        $pull: {
          superLikedUsers: likeUserId, // pushing  the id of the post to the  posts array
        },
      },
      {
        new: true,
      }
    );
    if (updatedUser) {
      res.status(200).json({
        status: "success",
        data: {
          message: "super like removed ",
        },
      });
    } else {
      return next(new AppError("Unable to like user please try again", 404));
    }
  } else {
    updatedUser = await User.findByIdAndUpdate(
      userID,
      {
        $addToSet: {
          superLikedUsers: likeUserId, // pushing  the id of the post to the  posts array
        },
      },
      {
        new: true,
      }
    );
    if (updatedUser) {
      res.status(200).json({
        status: "success",
        data: {
          message: "super liked ",
        },
      });
    } else {
      return next(
        new AppError("Unable to super  like user please try again", 404)
      );
    }
  }
});
