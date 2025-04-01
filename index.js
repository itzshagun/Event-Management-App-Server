const express = require("express");
const cors = require("cors");
const { connectMongoDB } = require("./config/db-config");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
//MongoDb Connection
connectMongoDB().catch((err) => {
  console.error("MongoDB Connection Failed");
  process.exit(1);
});

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

//Routes
app.use("/api/users", require("./routes/users-route"));
app.use("/api/events", require("./routes/events-route"));
app.use("/api/upload", require("./routes/upload-route")); //File Upload Route
app.use("/api/payments", require("./routes/payments-route")); //Payment
app.use("/api/bookings", require("./routes/bookings-route")); //Bookings Route
app.use("/api/reports", require("./routes/reports-route"));

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Node+Express Server is running on port ${port}`);
});
