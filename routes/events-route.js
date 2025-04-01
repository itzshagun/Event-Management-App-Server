const express = require("express");
const router = express.Router();
const validateToken = require("../middlewares/validate-token");
const EventModel = require("../models/event-model"); // ✅ Correct model reference

// Create an event
router.post("/create-event", validateToken, async (req, res) => {
  try {
    console.log("📩 Received Event Data:", req.body); // Debugging

    const {
      name,
      description,
      organizer,
      date,
      time,
      address,
      city,
      pincode,
      images, // 🔥 This should contain Cloudinary URLs
      ticketTypes,
    } = req.body;

    console.log("📷 Images received for creation:", images); // Debugging

    if (
      !name ||
      !description ||
      !organizer ||
      !date ||
      !time ||
      !address ||
      !city ||
      !pincode
    ) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    // 🔄 Ensure images is an array before saving
    //const finalImages = Array.isArray(images) ? images : [];

    const newEvent = new EventModel({
      // name,
      // description,
      // organizer,
      // date,
      // time,
      // address,
      // city,
      // pincode,
      ...req.body,
      images: images && images.length > 0 ? images : [], // 🔥 Make sure images are saved
      ticketTypes: ticketTypes || [],
    });

    await newEvent.save();
    console.log("✅ Event Saved Successfully:", newEvent);

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    console.error("❌ Error saving event:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🛠 FIXED: Edit event
router.put("/edit-event/:id", async (req, res) => {
  try {
    const eventId = req.params.id;

    if (!eventId) {
      return res
        .status(400)
        .json({ message: "Event ID is required for update." });
    }

    const { images } = req.body;

    console.log("📷 Images received for update:", images); // Debugging

    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 🔹 Ensure images are updated properly
    const updatedEvent = await EventModel.findByIdAndUpdate(
      eventId,
      {
        $set: {
          ...req.body,
          images: images && images.length > 0 ? images : event.images,
        },
      },
      { new: true }
    );

    console.log("✅ Event Updated Successfully:", updatedEvent);
    res
      .status(200)
      .json({ message: "Event updated successfully", event: updatedEvent });
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete event
router.delete("/delete-event/:id", validateToken, async (req, res) => {
  try {
    await EventModel.findByIdAndDelete(req.params.id);
    return res.json({ message: "Event deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get all events
router.get("/get-events", validateToken, async (req, res) => {
  try {
    //access serach query
    const searchText = req.query.searchText;
    const date = req.query.date;

    const events = await EventModel.find({
      name: { $regex: new RegExp(searchText, "i") },
      ...(date && { date }),
    }).sort({ createdAt: -1 });
    if (!events || events.length === 0) {
      return res.status(404).json({ message: "No Events Found" });
    }
    return res.status(200).json({ data: events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
});

// Get a single event by ID
router.get("/get-event/:id", validateToken, async (req, res) => {
  try {
    const event = await EventModel.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    return res.json({
      success: true,
      data: event,
      images: event.images || [], // Ensure images are always returned
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
