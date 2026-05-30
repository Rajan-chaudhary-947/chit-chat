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

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, //  7 days in MiliSecond
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite: "none", // CSRF attacks cross-site request forgery attacks
    secure: process.env.NODE_ENV !== "development",
  });

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
// Resend setup kept for future use:
// export const resend = new Resend(process.env.RESEND_API_KEY);


export const sendVerificationOtp = async (user, otp) => {
  // Resend email sender kept for future use:
  // const { error } = await resend.emails.send({
  //   from: EMAIL_FROM,
  //   to: user.email,
  //   subject: "Verify your email for Chat App",
  //   html: `
  //     <p>Hi ${user.fullName},</p>
  //     <p>Your OTP for verifying your email is: <strong>${otp}</strong></p>
  //     <p>This OTP is valid for 10 minutes.</p>
  //     <p>If you did not request this, please ignore this email.</p>
  //     <p>Thanks,<br/>Chit Chat Team</p>
  //   `,
  // });
  //
  // if (error) {
  //   throw new Error("Failed to send verification email");
  // }


  const transporter = nodemailer.createTransport({
    host: host,
    port: mailPort,
    auth: {
      user: USERNAME,
      pass: PASSWORD
    }
  });

  const info = await transporter.sendMail({
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
  });
};
export const generateOtp = () => {
  return randomInt(100000, 1000000).toString();
};
