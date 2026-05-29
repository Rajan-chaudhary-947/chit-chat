import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { generateUserId } from "../lib/utils.js";
import { sendVerificationOtp } from "../lib/utils.js";
import { generateOtp } from "../lib/utils.js";

const getPublicUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  profilePic: user.profilePic,
  userId: user.userId,
  isVerified: user.isVerified,
});

const createVerificationOtp = async (user) => {
  const otp = generateOtp();
  user.emailOtp = await bcrypt.hash(otp, 10);
  user.emailOtpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
  user.emailOtpLastSent = Date.now();
  await user.save();
  await sendVerificationOtp(user, otp);
};

// Handling Signup a new user
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    // Check if all fields are provided
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "Email already exists" });

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      userId: generateUserId(fullName),
    });

    if (newUser) {
      try {
        await createVerificationOtp(newUser);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error sending verification OTP" });
      }

      res.status(201).json({
        message: "Account created. Please verify your email.",
        email: newUser.email,
        requiresVerification: true,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Handling Email Verification
export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified", user: getPublicUser(user) });
    }
    if (!otp || otp.length !== 6) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (!user.emailOtp){
      return res.status(400).json({ message: "No OTP found. Please request a new one." });
    }
    if (user.emailOtpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    const validOtp = await bcrypt.compare(otp, user.emailOtp);
    if (!validOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    
    user.isVerified = true;
    user.emailOtp = null;
    user.emailOtpExpiry = null;
    user.emailOtpLastSent = null;
    await user.save();

    generateToken(user._id, res);

    res.status(200).json({ message: "Email verified successfully", user: getPublicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Handling Resend Verification OTP
export const resendVerificationOtp = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if(!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if(user.isVerified) {
      return res.status(400).json({ message: "Email is already verified", user: getPublicUser(user) }); 
    }

    const lastSent = user.emailOtpLastSent?.getTime() || 0;
    const cooldownEndsAt = lastSent + 60 * 1000; // 1 minute cooldown
    if (Date.now() < cooldownEndsAt) {
      const secondsLeft = Math.ceil((cooldownEndsAt - Date.now()) / 1000);
      return res.status(429).json({ message: `Please wait ${secondsLeft} seconds before requesting a new OTP` });
    }

    await createVerificationOtp(user);

    res.status(200).json({ message: "Verification OTP resent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Handling Login a user
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // finding the user by email from database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if the password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      res.cookie("jwt", "", { maxAge: 0 });
      const lastSent = user.emailOtpLastSent?.getTime() || 0;
      const cooldownEndsAt = lastSent + 60 * 1000;

      if (!user.emailOtp || user.emailOtpExpiry < Date.now() || Date.now() >= cooldownEndsAt) {
        await createVerificationOtp(user);
      }

      return res.status(200).json({
        message: "Please verify your email to continue.",
        email: user.email,
        requiresVerification: true,
      });
    }

    // If user exists and password is correct, generate a token
    generateToken(user._id, res);

    res.status(200).json(getPublicUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// Handling Logout a user
export const logout = (req, res) => {
  try {
    // Clear the cookie
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// Handling Profile Update
export const updateProfile = async (req, res) => {
  try {
    // Accsessing the profile pic from the request body
    const { profilePic } = req.body;
    const userId = req.user._id;

    // If there is no profile pic
    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    // If there is a profile pic, uploading it to cloudinary and updating the user
    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );
    res.status(200).json(updatedUser);

  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};


// Handling Authentication check
export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
