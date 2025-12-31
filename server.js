const express = require("express");
const crypto = require("crypto");
const rateLimiter = require("./rateLimiter");

const app = express();
app.use(express.json());

let otpStore = {};

const MAX_ATTEMPTS = 3;
const BLOCK_TIME = 5 * 60 * 1000; // 5 minutes

// Send OTP
app.post("/send-otp", (req, res) => {
  const phone = req.body.phone;
  const otp = crypto.randomInt(100000, 999999);

  otpStore[phone] = {
    otp,
    expires: Date.now() + 2 * 60 * 1000,
    attempts: 0
  };

  console.log(`OTP for ${phone}: ${otp}`);
  res.json({ message: "OTP sent" });
});

// Verify OTP
app.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body;

  const limiter = rateLimiter(phone, MAX_ATTEMPTS, BLOCK_TIME);
  if (limiter.blocked) {
    return res.json({ error: "Too many attempts. Try later." });
  }

  const record = otpStore[phone];
  if (!record) return res.json({ error: "OTP not found" });

  if (Date.now() > record.expires) {
    delete otpStore[phone];
    return res.json({ error: "OTP expired" });
  }

  if (record.otp == otp) {
    delete otpStore[phone];
    return res.json({ success: true });
  } else {
    record.attempts++;

    if (record.attempts >= MAX_ATTEMPTS) {
      limiter.block();
      delete otpStore[phone];
      return res.json({ error: "Account temporarily locked" });
    }

    return res.json({
      error: "Wrong OTP",
      attemptsLeft: MAX_ATTEMPTS - record.attempts
    });
  }
});

app.listen(3000, () =>
  console.log("Secure OTP server running on port 3000")
);
