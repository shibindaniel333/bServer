const mongoose = require("mongoose")

const connectionString = process.env.DBCONNECTIONSTRING;

mongoose.connect(connectionString)
  .then(res => {
    console.log("MongoDB Atlas connected succesfully with pf server");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
