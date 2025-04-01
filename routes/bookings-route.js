const express = require("express");
const router = express.Router();
const validateToken = require("../middlewares/validate-token");
const sendEmail = require("../helpers/send-email");
const BookingModel = require("../models/booking-model");
const EventModel = require("../models/event-model");
const UserModel = require("../models/user-model");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-booking", validateToken, async (req, res) => {
  try {
    req.body.user = req.user._id;
    const event = await EventModel.findById(req.body.event);
    if (!event) return res.status(404).json({ message: "Event not found!" });

    if (!event.ticketTypes || !Array.isArray(event.ticketTypes)) {
      return res.status(400).json({ message: "Invalid ticketTypes data" });
    }

    const booking = await BookingModel.create(req.body);

    const updatedTicketTypes = event.ticketTypes.map((ticketType) => {
      if (ticketType.name === req.body.ticketType) {
        ticketType.booked =
          Number(ticketType.booked ?? 0) + Number(req.body.ticketsCount);
        ticketType.available =
          Number(ticketType.available ?? ticketType.limit) -
          Number(req.body.ticketsCount);
      }
      return ticketType;
    });

    await EventModel.findByIdAndUpdate(req.body.event, {
      ticketTypes: updatedTicketTypes,
    });

    //send email
    const userObj = await UserModel.findById(req.user._id);
    const emailPayload = {
      email: userObj.email,
      subject: "Your booking at Event Management App",
      text: `Hi ${userObj.name}, your booking for ${event.name} has been confirmed. You have successfully booked ${req.body.ticketsCount} ticket(s) for ${event.name}.`,
      html: ``,
    };

    await sendEmail(emailPayload);

    return res
      .status(201)
      .json({ message: "Booking created successfully", booking });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/get-user-bookings", validateToken, async (req, res) => {
  try {
    const bookings = await BookingModel.find({ user: req.user._id })
      .populate("event")
      .sort({ createdAt: -1 });
    return res.status(200).json({ data: bookings });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/get-all-bookings", validateToken, async (req, res) => {
  try {
    const bookings = await BookingModel.find()
      .populate("event")
      .populate("user")
      .sort({ createdAt: -1 });
    return res.status(200).json({ data: bookings });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/cancel-booking", validateToken, async (req, res) => {
  try {
    const { eventId, paymentId, bookingId, ticketsCount, ticketTypeName } =
      req.body;

    if (paymentId) {
      const refund = await stripe.refunds.create({ payment_intent: paymentId });
      if (refund.status !== "succeeded")
        return res.status(400).json({ message: "Refund failed" });
    }

    await BookingModel.findByIdAndUpdate(bookingId, { status: "cancelled" });

    const event = await EventModel.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found!" });

    const updatedTicketTypes = event.ticketTypes.map((ticketType) => {
      if (ticketType.name === ticketTypeName) {
        ticketType.booked = Math.max(
          0,
          Number(ticketType.booked ?? 0) - Number(ticketsCount)
        );
        ticketType.available =
          Number(ticketType.available ?? ticketType.limit) +
          Number(ticketsCount);
      }
      return ticketType;
    });

    await EventModel.findByIdAndUpdate(eventId, {
      ticketTypes: updatedTicketTypes,
    });

    const userObj = await UserModel.findById(req.user._id);
    const emailPayload = {
      email: userObj.email,
      subject: "Regarding Booking Cancellation",
      text: `Hi ${userObj.name}, your booking for ${event.name} has been cancelled. You have successfully cancelled ${ticketsCount} ticket(s) for ${event.name}.`,
      html: ``,
    };
    await sendEmail(emailPayload);
    return res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
