// const mongoose = require("mongoose");

// const connectDB = async () => {
//     try {
//         // Remove the options - they're not needed in modern Mongoose
//         await mongoose.connect("mongodb://localhost:27017/escapeXpert");
        
//         console.log("MongoDB Connected ✔");
//     } catch (error) {
//         console.log("MongoDB Connection Error ", error);
//         process.exit(1);
//     }
// };

// module.exports = connectDB;

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected ✔");
  } catch (error) {
    console.log("MongoDB Connection Error ", error);
    process.exit(1);
  }
};

module.exports = connectDB;