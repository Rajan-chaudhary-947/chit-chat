import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Relationship from "../models/relationship.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const areUsersConnected = async (userA, userB) => {
  const [userOne, userTwo] = [userA.toString(), userB.toString()].sort();

  const relationship = await Relationship.findOne({
    userOne,
    userTwo,
    status: "accepted",
  });

  return Boolean(relationship);
};


// Function to handle connected users for showing in the sidebar.
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const relationships = await Relationship.find({
      status: "accepted",
      $or: [
        { userOne: loggedInUserId },
        { userTwo: loggedInUserId },
      ],
    });

    const connectedUserIds = relationships.map((relationship) =>
      relationship.userOne.toString() === loggedInUserId.toString()
        ? relationship.userTwo
        : relationship.userOne
    );

    const filteredUsers = await User.find({
      _id: { $in: connectedUserIds },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};


// Function to handle fetching messages between two users
export const getMessages = async (req, res) => {
  try {
    // Destructuring the id as userToChatId from the request parameters
    const { id: userToChatId } = req.params;
    const myId = req.user._id; // Destructuring the logged-in user's ID from the request object

    const isConnected = await areUsersConnected(myId, userToChatId);
    if (!isConnected) {
      return res.status(403).json({ error: "You can only message connected users" });
    }

    // Find messages between the logged-in user(me) and the selected user
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};


// Function to handle sending messages
export const sendMessage = async (req, res) => {
  try {
    // Destructuring the text and image from the request body
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const isConnected = await areUsersConnected(senderId, receiverId);
    if (!isConnected) {
      return res.status(403).json({ error: "You can only message connected users" });
    }

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Creating the message
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    // Saving the message to the database
    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};
