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
          username:
            data.username ||
            data.email_addresses[0].email_address.split("@")[0],
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          avatar: data.profile_image_url,
          isVerified: true, // Mặc định đã xác thực vì đến từ Clerk
        };
        await User.create(userData);
        res.json({});
        break;
      }

      case "user.updated": {
        // Xử lý khi user được cập nhật trong Clerk
        const updatedData = {
          email: data.email_addresses[0].email_address,
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          avatar: data.profile_image_url,
        };

        await User.findByIdAndUpdate(data.id, updatedData);
        return res.status(200).json({ message: "User updated successfully" });
      }

      case "user.deleted": {
        // Xử lý khi user bị xóa trong Clerk
        await User.findByIdAndDelete(data.id);
        return res.status(200).json({ message: "User deleted successfully" });
      }

      default:
        return res.status(200).json({ message: "Event type not handled" });
    }
  } catch (error) {}
};
