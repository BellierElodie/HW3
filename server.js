const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const authJwtController = require("./auth_jwt"); 
const cors = require("cors");
const User = require("./Users");
const Movie = require("./Movies"); 
const Review = require("./Reviews");
require("dotenv").config(); // Load environment variables from .env file
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());

const router = express.Router(); 

router.post("/signup", async (req, res) => {
  // Use async/await
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({
      success: false,
      msg: "Please include both username and password to signup.",
    }); // 400 Bad Request
  }

  try {
    const user = new User({
      // Create user directly with the data
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
    });

    await user.save(); // Use await with user.save()

    res
      .status(201)
      .json({ success: true, msg: "Successfully created new user." }); // 201 Created
  } catch (err) {
    if (err.code === 11000) {
      // Strict equality check (===)
      return res.status(409).json({
        success: false,
        message: "A user with that username already exists.",
      }); // 409 Conflict
    } else {
      console.error(err); // Log the error for debugging
      return res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      }); // 500 Internal Server Error
    }
  }
});

router.post("/signin", async (req, res) => {
  // Use async/await
  try {
    const user = await User.findOne({ username: req.body.username }).select(
      "name username password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "Authentication failed. User not found.",
      }); // 401 Unauthorized
    }

    const isMatch = await user.comparePassword(req.body.password); // Use await

    if (isMatch) {
      const userToken = { id: user._id, username: user.username }; // Use user._id (standard Mongoose)
      const token = jwt.sign(userToken, process.env.SECRET_KEY, {
        expiresIn: "1h",
      }); // Add expiry to the token (e.g., 1 hour)
      res.json({ success: true, token: "JWT " + token });
    } else {
      res.status(401).json({
        success: false,
        msg: "Authentication failed. Incorrect password.",
      }); // 401 Unauthorized
    }
  } catch (err) {
    console.error(err); // Log the error
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    }); // 500 Internal Server Error
  }
});

router
  .route("/movies")
  .get(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movies = await Movie.find({}); // Fetch all movies from the database
      console.log(movies); // Log the movies for debugging

      res.json(movies);
    } catch (err) {
      console.error(err); // Log the error for debugging
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      }); // 500 Internal Server Error
    }
  })
  .post(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movie = new Movie(req.body);
      await movie.save();
  
      res.status(201).json({
        success: true,
        movie: movie
      });
    } catch (err) {
      console.error(err);
  
      if (err.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Invalid movie information."
        });
      }
  
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later."
      });
    }
  });
 
router
  .route("/movies/:movieId")
  .get(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movie = await Movie.findById(req.params.movieId);
      if (!movie) {
        return res
          .status(404)
          .json({ success: false, message: "Movie not found" });
      }
      res.json(movie);
    } catch (err) {
      console.error(err);
      if (err.name === "CastError") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Movie ID." });
      }
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      });
    }
  })
  .put(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movie = await Movie.findByIdAndUpdate(
        req.params.movieId,
        req.body,
        { new: true, runValidators: true } // Return the updated document and run validators
      );
      if (!movie) {
        return res
          .status(404)
          .json({ success: false, message: "Movie not found" });
      }
      res.json({ success: true, movie: movie });
    } catch (err) {
      console.error(err);
      if (err.name === "CastError") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Movie ID." });
      }
      if (err.name === 'ValidationError'){
         return res.status(400).json({
        success: false,
        message: "Invalid Movie information.",
      });
      }
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      });
    }
  })
  .delete(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movie = await Movie.findByIdAndDelete(req.params.movieId);
      if (!movie) {
        return res
          .status(404)
          .json({ success: false, message: "Movie not found" });
      }
      res.json({ success: true, message: "Movie deleted successfully" });
    } catch (err) {
      console.error(err);
      if (err.name === "CastError") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Movie ID." });
      }
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      });
    }
  });

app.use("/", router);

const PORT = process.env.PORT || 8080; // Define PORT before using it
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // for testing only


router.route('/reviews')
  .get(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const reviews = await Review.find({});
      return res.json(reviews);
    } catch(err) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving reviews',
        error: err.message
      });
    }
  })

  .post(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const review = new Review({
        movieId: req.body.movieId,
        username: req.user.username,
        review: req.body.review,
        rating: req.body.rating
      });

      await review.save();

      return res.status(201).json({
        success: true,
        message: 'Review created!',
        review: review
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "A review with that ID already exisits"
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error creating review",
        error: err.message
      });
    }
  })


  router.route('/movies')
    .get(authJwtController.isAuthenticated, async (req, res) => {
      try {
        if (req.query.reviews === "true") {
          const movies = await Movie.aggregate([
            {
              $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "movieId",
                as: "reviews"
              }
            },
            {
              $addFields: {
                avgRating: {
                  $cond: {
                    if: { $gt: [{$size: "$reviews"}, 0]},
                    then: { $avg: "$reviews.rating"},
                    else: null
                  }
                }
              }
            },
            {
              $sort: {
                avgRating: -1,
                title: 1
              }
            }
          ]);

          return res.json(movies);
        } else {
          const movies = (await Movie.find()).toSorted({title: 1});
          return res.json(movies);
        }
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: "Error retrieving movies",
          error: err.message
        });

      }
    })
