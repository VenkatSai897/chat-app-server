const router = require("express").Router();
const Conversation = require("../models/Conversation");

//new conv

router.post("/", async (req, res) => {
  const newConversation = new Conversation({
    members: [req.body.senderId, req.body.receiverId],
  });

  try {
    const savedConversation = await newConversation.save();
    res.status(200).json(savedConversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get conv of a user

router.get("/:userId", async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members: { $in: [req.params.userId] },
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get conv includes two userId

router.get("/find/:firstUserId/:secondUserId", async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] },
    });
    if (!conversation) {
      console.log("is this executed");
      const newConversation = new Conversation({
        members: [req.params.firstUserId, req.params.secondUserId],
      });
      const savedConversation = await newConversation.save();
      const conversation_1 = await Conversation.findOne({
        members: { $all: [req.params.firstUserId, req.params.secondUserId] },
      });
      res
        .status(200)
        .json({ conv: conversation_1, warn: "Conv was not found" });
      console.log("conversation", conversation_1);
    } else {
      console.log("conversation", conversation);
      res.status(200).json(conversation);
    }
  } catch (err) {
    console.log("This is the error", err);
  }
});

module.exports = router;
