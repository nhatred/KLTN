import { Webhook } from "svix";
import User from "../models/User.js";

export const clerkWebhooks = async (req, res) => {
  console.log("=== Processing Webhook ===");

  try {
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error("WEBHOOK_SECRET is missing in environment variables");
      throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env");
    }

    // Get the headers
    const svix_id = req.headers["svix-id"];
    const svix_timestamp = req.headers["svix-timestamp"];
    const svix_signature = req.headers["svix-signature"];

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("Missing Svix headers:", {
        svix_id,
        svix_timestamp,
        svix_signature,
      });
      return res.status(400).json({
        success: false,
        message: "Error occurred -- no svix headers",
      });
    }

    // Get the body
    const payload = req.body;
    const body = JSON.stringify(payload);
    console.log("Processing webhook payload:", payload);

    // Create a new Webhook instance with your secret
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
      console.log("Webhook verified successfully");
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return res.status(400).json({
        success: false,
        message: "Error occurred during webhook verification",
        error: err.message,
      });
    }

    const eventType = evt.type;
    console.log("Processing event type:", eventType);

    if (eventType === "user.created") {
      console.log("Processing user.created event");
      const {
        id,
        email_addresses,
        username,
        first_name,
        last_name,
        image_url,
        public_metadata,
      } = evt.data;

      // Log the user data we're about to save
      console.log("Creating new user with data:", {
        id,
        email: email_addresses?.[0]?.email_address,
        name: first_name && last_name ? `${first_name} ${last_name}` : username,
        imageUrl: image_url,
      });

      try {
        // Check if user already exists
        const existingUser = await User.findById(id);
        if (existingUser) {
          console.log("User already exists in MongoDB:", id);
          return res.json({
            success: true,
            message: "User already exists",
          });
        }

        // Create new user
        const newUser = new User({
          _id: id,
          name:
            first_name && last_name
              ? `${first_name} ${last_name}`
              : username || email_addresses[0].email_address.split("@")[0],
          email: email_addresses[0].email_address,
          imageUrl: image_url,
          role: "student", // Default role
        });

        const savedUser = await newUser.save();
        console.log("User successfully saved to MongoDB:", savedUser);

        return res.json({
          success: true,
          message: "User created successfully",
          data: savedUser,
        });
      } catch (dbError) {
        console.error("MongoDB Error:", dbError);
        return res.status(500).json({
          success: false,
          message: "Error saving user to database",
          error: dbError.message,
        });
      }
    } else if (eventType === "user.updated") {
      // Handle user update
      const {
        id,
        email_addresses,
        username,
        first_name,
        last_name,
        image_url,
        public_metadata,
      } = evt.data;

      const updatedUser = await User.findByIdAndUpdate(
        id,
        {
          name:
            first_name && last_name
              ? `${first_name} ${last_name}`
              : username || email_addresses[0].email_address.split("@")[0],
          email: email_addresses[0].email_address,
          imageUrl: image_url,
          ...(public_metadata?.role && { role: public_metadata.role }), // Only update role if it exists in metadata
        },
        { new: true }
      );

      if (!updatedUser) {
        // If user doesn't exist in our DB, create them
        const newUser = new User({
          _id: id,
          name:
            first_name && last_name
              ? `${first_name} ${last_name}`
              : username || email_addresses[0].email_address.split("@")[0],
          email: email_addresses[0].email_address,
          imageUrl: image_url,
          role: public_metadata?.role || "student",
        });

        await newUser.save();
      }
      console.log("User updated:", id);
    } else if (eventType === "user.deleted") {
      // Handle user deletion
      const { id } = evt.data;
      await User.findByIdAndDelete(id);
      console.log("User deleted:", id);
    }

    console.log("Webhook processed successfully");
    return res.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing webhook",
      error: error.message,
    });
  }
};
