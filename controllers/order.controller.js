const Order = require('../models/order.model');
const Product = require('../models/product.model');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      isPaid, // NEW
      paidAt, // NEW
      paymentResult, // NEW
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    } else {
      for (const item of orderItems) {
        const product = await Product.findById(item.product);
        if (!product || product.stock < item.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock for ${item.name}` });
        }
      }

      const order = new Order({
        user: req.user.id,
        orderItems,
        shippingAddress,
        paymentMethod,
        isPaid, // Use isPaid from request body
        paidAt, // Use paidAt from request body
        paymentResult, // Use paymentResult from request body
        taxPrice,
        shippingPrice,
        totalPrice,
      });

      const createdOrder = await order.save();

      for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }

      res.status(201).json({ success: true, data: createdOrder });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (User or Admin)
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
      // Only allow owner or admin to view order
      if (order.user._id.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
      }
      res.status(200).json({ success: true, data: order });
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (error) {
    console.error('Error getting order by ID:', error);
    next(error);
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error getting user orders:', error);
    next(error);
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private (Admin)
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error getting all orders:', error);
    next(error);
  }
};

// @desc    Update order to paid (Admin only or Payment Gateway Callback)
// @route   PUT /api/orders/:id/pay
// @access  Private (Admin or system)
exports.updateOrderToPaid = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };

      const updatedOrder = await order.save();
      res.status(200).json({ success: true, data: updatedOrder });
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (error) {
    console.error('Error updating order to paid:', error);
    next(error);
  }
};

// @desc    Update order to delivered (Admin only)
// @route   PUT /api/orders/:id/deliver
// @access  Private (Admin)
exports.updateOrderToDelivered = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();

      const updatedOrder = await order.save();
      res.status(200).json({ success: true, data: updatedOrder });
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (error) {
    console.error('Error updating order to delivered:', error);
    next(error);
  }
};