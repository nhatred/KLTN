import User from "../models/User.js";
import { clerkClient } from "@clerk/express";

// Create new user
const createUser = async (req, res) => {
  try {
    const { _id, name, email, imageUrl } = req.body;

    // Validate required fields
    if (!_id || !name || !email) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: _id, name, email",
      });
    }

    // Check if user already exists
    const existingUser = await User.findById(_id);
    if (existingUser) {
      // Update existing user
      const updatedUser = await User.findByIdAndUpdate(
        _id,
        { name, email, imageUrl },
        { new: true }
      );

      return res.json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    }

    // Create new user with default role as student
    const newUser = new User({
      _id,
      name,
      email,
      imageUrl,
      role: "student",
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser,
    });
  } catch (error) {
    console.error("Error creating/updating user:", error);
    res.status(500).json({
      success: false,
      message: "Error creating/updating user",
      error: error.message,
    });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    // Get users from both Clerk and database
    const [clerkResponse, dbUsers] = await Promise.all([
      clerkClient.users.getUserList(),
      User.find(
        {},
        {
          _id: 1,
          name: 1,
          email: 1,
          imageUrl: 1,
          role: 1,
          createdAt: 1,
        }
      ),
    ]);

    // Ensure clerkResponse is valid and contains users
    if (!clerkResponse || !Array.isArray(clerkResponse.data)) {
      throw new Error("Invalid response from Clerk API");
    }

    const clerkUsers = clerkResponse.data;

    // Create a map of database users by ID
    const dbUserMap = dbUsers.reduce((acc, user) => {
      acc[user._id] = user;
      return acc;
    }, {});

    // Merge Clerk and database user data
    const mergedUsers = clerkUsers.map((clerkUser) => {
      const dbUser = dbUserMap[clerkUser.id] || {};
      return {
        _id: clerkUser.id,
        name:
          dbUser.name ||
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        email:
          dbUser.email ||
          (clerkUser.emailAddresses &&
            clerkUser.emailAddresses[0]?.emailAddress),
        imageUrl: dbUser.imageUrl || clerkUser.imageUrl,
        role:
          dbUser.role ||
          (clerkUser.publicMetadata && clerkUser.publicMetadata.role) ||
          "student",
        createdAt: dbUser.createdAt || clerkUser.createdAt,
      };
    });

    res.json({
      success: true,
      data: mergedUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    try {
      // First try to get user from Clerk
      const clerkUser = await clerkClient.users.getUser(userId);

      // Then try to get from database
      const dbUser = await User.findOne(
        { _id: userId },
        { _id: 1, name: 1, email: 1, imageUrl: 1, role: 1 }
      );

      // If user doesn't exist in database but exists in Clerk, create them
      if (!dbUser && clerkUser) {
        const newUser = new User({
          _id: clerkUser.id,
          name:
            `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
            clerkUser.username ||
            clerkUser.emailAddresses[0]?.emailAddress.split("@")[0],
          email: clerkUser.emailAddresses[0]?.emailAddress,
          imageUrl: clerkUser.imageUrl,
          role: clerkUser.publicMetadata?.role || "student",
        });

        try {
          await newUser.save();
          console.log("Created missing user in database:", userId);
        } catch (saveError) {
          console.error("Error saving user to database:", saveError);
        }
      }

      // Return merged data, preferring database values if they exist
      const user = {
        _id: clerkUser.id,
        name:
          dbUser?.name ||
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        email: dbUser?.email || clerkUser.emailAddresses[0]?.emailAddress,
        imageUrl: dbUser?.imageUrl || clerkUser.imageUrl,
        role: dbUser?.role || clerkUser.publicMetadata?.role || "student",
      };

      return res.json({
        success: true,
        data: user,
      });
    } catch (clerkError) {
      // If user not found in Clerk, try database as fallback
      if (clerkError.status === 404) {
        const dbUser = await User.findOne(
          { _id: userId },
          { _id: 1, name: 1, email: 1, imageUrl: 1, role: 1 }
        );

        if (dbUser) {
          return res.json({
            success: true,
            data: dbUser,
          });
        }
      }

      // If not found in either system
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: clerkError.message,
      });
    }
  } catch (error) {
    console.error("Error in getUserById:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!["admin", "teacher", "student"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be admin, teacher, or student",
      });
    }

    // Update role in both Clerk and database
    const [clerkUpdate, dbUpdate] = await Promise.all([
      clerkClient.users.updateUser(userId, {
        publicMetadata: { role },
      }),
      User.findByIdAndUpdate(userId, { role }, { new: true }),
    ]);

    if (!clerkUpdate || !dbUpdate) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return merged user data
    const updatedUser = {
      _id: clerkUpdate.id,
      name:
        dbUpdate.name ||
        `${clerkUpdate.firstName} ${clerkUpdate.lastName}`.trim(),
      email: dbUpdate.email || clerkUpdate.emailAddresses[0]?.emailAddress,
      imageUrl: dbUpdate.imageUrl || clerkUpdate.imageUrl,
      role: role,
    };

    res.json({
      success: true,
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user role",
      error: error.message,
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Delete user from both Clerk and database
    await Promise.all([
      clerkClient.users.deleteUser(userId),
      User.findByIdAndDelete(userId),
    ]);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

// Get multiple users by IDs
const getUsersByIds = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: "userIds must be an array",
      });
    }

    // Get users from both Clerk and database
    const [clerkUsers, dbUsers] = await Promise.all([
      clerkClient.users.getUserList({ userId: userIds }),
      User.find(
        { _id: { $in: userIds } },
        { _id: 1, name: 1, email: 1, imageUrl: 1, role: 1 }
      ),
    ]);

    // Create maps for easier lookup
    const clerkUserMap = clerkUsers.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    const dbUserMap = dbUsers.reduce((acc, user) => {
      acc[user._id] = user;
      return acc;
    }, {});

    // Map the results in the same order as requested IDs
    const orderedUsers = userIds.map((id) => {
      const clerkUser = clerkUserMap[id];
      const dbUser = dbUserMap[id];

      if (!clerkUser && !dbUser) {
        return {
          _id: id,
          name: "Unknown User",
          imageUrl:
            "https://images.unsplash.com/photo-1574232877776-2024ccf7c09e",
          role: "student",
        };
      }

      return {
        _id: id,
        name:
          dbUser?.name ||
          `${clerkUser?.firstName} ${clerkUser?.lastName}`.trim(),
        email: dbUser?.email || clerkUser?.emailAddresses[0]?.emailAddress,
        imageUrl: dbUser?.imageUrl || clerkUser?.imageUrl,
        role: dbUser?.role || clerkUser?.publicMetadata?.role || "student",
      };
    });

    res.json({
      success: true,
      data: orderedUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

export {
  getUsers,
  getUserById,
  getUsersByIds,
  createUser,
  updateUserRole,
  deleteUser,
};
