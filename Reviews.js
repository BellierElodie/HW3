const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process if the connection fails (optional)
  }
};

connectDB();


//Review schema
module.exports = mongoose.model('Movie', MovieSchema);

const reviewSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  username: {type: String, required: true},
  review: String,
  rating: { type: Number, min: 0, max: 5 }
});

reviewSchema.index({movieId: 1, username: 1}, {unique: true});

module.exports = mongoose.model('Review', MovieSchema);