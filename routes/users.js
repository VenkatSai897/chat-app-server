const User = require("../models/User");
const router = require("express").Router();
const bcrypt = require("bcrypt");

//update user
router.put("/:id", async (req, res) => {
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }
    try {
      const user = await User.findByIdAndUpdate(req.params.id, {
        $set: req.body},
        { new: true }
      );
      res.status(200).json(user);
    } catch (err) {
      return res.status(500).json(err);
    }
});

//delete user
router.delete("/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("Account has been deleted");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can delete only your account!");
  }
});

//get a user
router.get("/all",async(req,res)=>{
  try{
    const users = await User.find();
    res.status(200).json(users)
  }
  catch(err){
    res.status(500).json(err);
  }
})
router.get("/", async (req, res) => {
  const userId = req.query.userId;
  const username = req.query.username;
  try {
    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ username: username });
    const { password, updatedAt, ...other } = user._doc;
    res.status(200).json(other);
  }
  catch (err) {
  res.status(500).json(err);
  }
});


module.exports = router;
