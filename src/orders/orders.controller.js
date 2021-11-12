const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: orders });
}

function bodyHasRequiredProperty(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  if (!deliverTo) {
    next({
      status: 400,
      message: "Order must include a deliverTo",
    });
  } else if (!mobileNumber) {
    next({
      status: 400,
      message: "Order must include a mobileNumber",
    });
  } else if (!dishes) {
    next({
      status: 400,
      message: "Order must include a dish"
    });
  } else if (!Array.isArray(dishes) || dishes.length === 0) {
    next({
      status: 400,
      message: "Order must include at least one dish",
    });
  } 
  dishes.forEach((dish, index) => {
    const quantity = dish.quantity;
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  return next();
}
  
function create(req, res) {
  const { data } = req.body;
  const newOrder = {
    ...data,
    id: nextId(),
  }
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}
 
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const matchedOrder = orders.find((order) => order.id === orderId);
  if (matchedOrder) {
    res.locals.order = matchedOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`
  });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function validateUpdateOrderExists(req, res, next) {
  const { data } = req.body;
  const { status, id } = data;
  const { orderId } = req.params;
  const matchedOrder = orders.find((order) => order.id === orderId);
  if (!matchedOrder) {
    next({
      status: 404,
      message: `Order id not found: ${orderId}`
    });
  } else if (id !== orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  } else if (status === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  } else if (!status || status !== "pending" || status !== "preparing" || status !== "out-for-delivery") {
    next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  return next()
}

function update(req, res, next) {
  const originalOrder = res.locals.order;
  const order = req.body.data;
  originalOrder = order
  res.json({ data: orginalOrder })
}

function validatePendingStatus(req, res, next) {
  const { orderId } = req.params;
  const matchedOrder = orders.find((order) => order.id === orderId);
  if (matchedOrder.status === "pending") return next();
  next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    })
}

function destory(req, res, next) {
  const { orderId } = req.params;
  const indexToDeleteFrom = orders.findIndex((order) => order.id === orderId);  
  orders.splice(indexToDeleteFrom, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [bodyHasRequiredProperty, create],
  read: [orderExists, read],
  update: [orderExists, bodyHasRequiredProperty, validateUpdateOrderExists, update],
  delete: [orderExists, validatePendingStatus, destory],
}