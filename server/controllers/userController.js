import User from "../models/User.js";

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find(
      {},
      {
        _id: 1,
        name: 1,
        email: 1,
        imageUrl: 1,
      }
    );

    res.json({
      success: true,
      data: users,
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

    const user = await User.findOne(
      { _id: userId },
      { _id: 1, name: 1, email: 1, imageUrl: 1 }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
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

    const users = await User.find(
      { _id: { $in: userIds } },
      { _id: 1, name: 1, email: 1, imageUrl: 1 }
    );

    // Create a map of users by ID for easier lookup
    const userMap = users.reduce((acc, user) => {
      acc[user._id] = user;
      return acc;
    }, {});

    // Map the results in the same order as requested IDs
    const orderedUsers = userIds.map(
      (id) =>
        userMap[id] || {
          _id: id,
          name: "Unknown User",
          imageUrl:
            "https://images.unsplash.com/photo-1574232877776-2024ccf7c09e",
        }
    );

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

export { getUsers, getUserById, getUsersByIds };
