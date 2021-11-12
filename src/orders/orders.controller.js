const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//Respond with a list of all existing order data.
function list(req, res) {
  res.json({ data: orders });
}

//Validate if the request body has the required properties, create unique error message for each failed validation
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

//Create a new order with the valid request, and respond with the newly created order
function create(req, res) {
  const { data } = req.body;
  const newOrder = {
    ...data,
    id: nextId(),
  }
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

//Check if a order exists in the data with the request parameter dishId
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

//Check if the id property inside the request body matches with the dishId in the parameter, and there is a valid input for status
function validateUpdateOrderExists(req, res, next) {
  const { data: { id, status } = {} } = req.body;
  const { orderId } = req.params;
  // check if id of body does not match :orderId from the route
  if (id && id !== orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
    })
  } 
  // check if status property is missing or empty, and if status input is valid
  else if (!status || status === "" || (status !== "pending" && status !== "preparing" && status !== "out-for-delivery")) {
    next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    })
  } 
  // check if status property of the existing order === "delivered
  else if (status === "delivered"){
    next({
      status: 400,
      message: "A delivered order cannot be changed"
    })
  }
  next();
}

//Update the order where id === :dishId
function update(req, res, next) {
  let originalOrder = res.locals.order;
  const order = req.body.data;
  originalOrder = {
    ...order,
    id: res.locals.order.id,
  }
  res.json({ data: originalOrder })
}

//Check if the status of order is pending, if not pending return the error message
function validatePendingStatus(req, res, next) {
  const { orderId } = req.params;
  const matchedOrder = orders.find((order) => order.id === orderId);
  if (matchedOrder.status === "pending") return next();
  next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    })
}

//Delete the matched order for the parameter orderId and respond with the status code 204
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