const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: dishes });
}

function bodyHasRequiredProperty(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  if (!name) {
    next({
      status: 400,
      message: "Dish must include a name",
    });
  } else if (!description) {
    next({
      status: 400,
      message: "Dish must include a description",
    });
  } else if (!price) {
    next({
      status: 400,
      message: "Dish must include a price"
    });
  } else if (price <=0 || !Number.isInteger(price)) {
    next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0"
    });
  } else if (!image_url) {
    next({
      status: 400,
      message: "Dish must include a image_url",
    });
  } 
  return next();
}

function create(req, res) {
  const { data } = req.body;
  const newDish = {
    ...data,
    id: nextId(),
  }
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const matchedDish = dishes.find((dish) => dish.id === dishId);
  if (matchedDish) {
    res.locals.dish = matchedDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  })
}

function validateUpdateDishExists(req, res, next) {
  const { dishId } = req.params;
  const { id } = req.body.data;
  if (!dishId) {
    next({
      status: 404,
      message: `Dish does not exist: ${dishId}.`
    })
  } else if (id !== dishId) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
    })
  }
  return next()
}

function update(req, res) {
  let originalDish = res.locals.dish;
  const { data } = req.body;
  originalDish = data;
  res.json({ data: originalDish })
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

module.exports = {
  list,
  create: [bodyHasRequiredProperty, create],
  read: [dishExists, read],
  update: [dishExists, bodyHasRequiredProperty, validateUpdateDishExists, update]
}