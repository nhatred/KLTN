import { Webhook } from "svix";
import User from "../models/User.js";

export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = req.body;
    switch (type) {
      case "user.created": {
        // Xử lý khi có user mới được tạo trong Clerk
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
          createdQuizzes: [],
          recentlyJoinedQuizzes: [],
        };
        await User.create(userData);

        res.json({});
        break;
      }

      case "user.updated": {
        // Xử lý khi user được cập nhật trong Clerk
        const userData = {
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        };

        await User.findByIdAndUpdate(data.id, userData);
        res.status(200).json({ message: "User updated successfully" });
        break;
      }

      case "user.deleted": {
        // Xử lý khi user bị xóa trong Clerk
        await User.findByIdAndDelete(data.id);
        res.status(200).json({ message: "User deleted successfully" });
        break;
      }

      default:
        res.status(200).json({ message: "Event type not handled" });
        break;
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
