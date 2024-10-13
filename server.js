const express = require("express");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const http = require("http");

const { connectDB } = require("./config/postgres");

const routes = require("./routes");

const { sendError } = require("./services/responseHandler");

const whiteList = process.env.WHITE_LIST.split(",");
// const corsOptions = {
//   origin: (origin, callback) => {
//     if (!origin || whiteList.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
// };
const corsOptions = {
  origin: true, 
  credentials: true,
};

const app = express();
const server = http.createServer(app);

app.use(express.static("public"));
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

Object.entries(routes).forEach(([path, router]) => {
  app.use(`/${path}`, router);
});

app.use((err, req, res, next) => {
  sendError(res, err);
});

const PORT = process.env.PORT || 8089;

Promise.all([connectDB()])
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });