import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
// Resend setup kept for future use:
// import { Resend } from "resend";
import { randomInt } from "crypto";

// Generating JWT token valid for 7 days.
export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000, //  7 days in MiliSecond
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite: "none", // CSRF attacks cross-site request forgery attacks
    secure: true, // Must be true when sameSite is 'none'
    path: "/",
  };

  console.log("Setting cookie with options:", cookieOptions);
  res.cookie("jwt", token, cookieOptions);

  return token;
};


export const generateUserId = (fullName) => {
  const firstName =
    fullName
      .trim()
      .split(" ")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const timePart =
    Date.now().toString().slice(-5);

  const randomPart =
    Math.floor(10 + Math.random() * 90);

  return `${firstName}${timePart}${randomPart}`;
};

const EMAIL_FROM = process.env.EMAIL_FROM;
const USERNAME = process.env.GMAIL_USER;
const PASSWORD = process.env.GMAIL_PASS;
const host = process.env.HOST;
const mailPort = process.env.SMTP_PORT;

// Create transporter once instead of creating it every time
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: host,
      port: mailPort,
      secure: mailPort == 465, // true for 465, false for other ports
      auth: {
        user: USERNAME,
        pass: PASSWORD
      }
    });
  }
  return transporter;
};

export const sendVerificationOtp = async (user, otp) => {
  try {
    console.log("Sending OTP to:", user.email);
    
    const transporter = getTransporter();

    const mailOptions = {
      from: EMAIL_FROM,
      to: user.email,
      subject: "Verify your email for getting started with Chit Chat",
      html: `
        <p>Hi ${user.fullName},</p>
        <p>Your OTP for verifying your email is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 5 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Thanks,<br/>Chit Chat Team</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

export const generateOtp = () => {
  return randomInt(100000, 1000000).toString();
};
