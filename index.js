const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const conversationRoute = require("./routes/conversations");
const messageRoute = require("./routes/messages");
const path = require("path");
const cors = require('cors');

dotenv.config();

mongoose.connect(
  process.env.MONGO_URL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("Connected to MongoDB");
  }
);

//middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use(cors());
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, req.body.name);
  },
});

const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    return res.status(200).json("File uploded successfully");
  } catch (error) {
    console.error(error);
  }
});

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);
app.use("/images", express.static(path.join(__dirname, "public/images")));
const PORT = process.env.PORT || 9001;
const server = app.listen(PORT, () => {
  console.log("Backend server is running!");
});
const io = require("socket.io")(server, {
  cors: {
    origin: process.env.FRONT_END_URL,
  },
});

let users = [];
let notifications = {};
let update_track = {};

const addUser = (user_1, socketId) => {
  users = users.filter((o) => o._id !== user_1._id);
  users.push({ ...user_1, socketId });
};

const getUser = (userId) => {
  return users.find((object) => object._id === userId);
};

io.on("connection", (socket) => {
  //take userId and socketId from user
  socket.on("addUser", (user) => {
    addUser(user, socket.id);
    console.log(users);
    io.emit("getUsers", { users: users, id: "", update_track: update_track });
  });

  //send and get message
  const deleteUser = (userId) => {
    users = users.filter((user) => user._id !== userId);
  };
  const disconnectUser = () => {
    users = users.filter((user) => user.socketId !== socket.id);
  };
  socket.on("deleteUser", (userId) => {
    deleteUser(userId);
    io.emit("getUsers", { users: users, id: "", update_track: update_track });
  });
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);

    if (!Object.keys(notifications).includes(receiverId)) {
      notifications[[receiverId]] = {};
    }
    (notifications[[receiverId]][[senderId]] = notifications[[receiverId]][
      [senderId]
    ]
      ? notifications[[receiverId]][[senderId]] + 1
      : 1),
      console.log(notifications[[receiverId]]);
    console.log("notification received");
    if (user) {
      io.to(user.socketId).emit("getMessage", {
        senderId,
        text,
        notifications: notifications[[receiverId]],
      });
    }
  });

  socket.on("updatedUser", (data) => {
    users = users.map((o) => {
      if (o._id === data?._id) {
        return { ...o, ...data };
      }
      return o;
    });
    update_track[[data?._id]] = update_track[[data?._id]]
      ? update_track[[data?._id]] + 1
      : 1;

    io.emit("getUsers", {
      users: users,
      id: data._id,
      update_track: update_track,
    });
  });
  socket.on("read", ({ receiverId, senderId }) => {
    if (receiverId && senderId) {
      if (!Object.keys(notifications).includes(receiverId)) {
        notifications[[receiverId]] = {};
      }
      notifications[[receiverId]][[senderId]] = 0;
    }
  });
  socket.on("disconnect", () => {
    console.log("a user disconnected!");
    disconnectUser();
    io.emit("getUsers", { users: users, id: "", update_track: update_track });
  });
});
