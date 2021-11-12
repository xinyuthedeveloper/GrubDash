const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");


//Respond with a list of all existing dish data.
function list(req, res) {
  res.json({ data: dishes });
}

//Validate if the request body has the required properties, create unique error message for each failed validation
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

//Create a new dish with the valid request and respond with the newly created dish
function create(req, res) {
  const { data } = req.body;
  const newDish = {
    ...data,
    id: nextId(),
  }
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

//Check if a dish exists in the data with the request parameter dishId
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

//Check if the id property inside the request body matches with the dishId in the parameter
function validateUpdateDishExists(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  if (!id || id === dishId) {
    res.locals.dishId = dishId;
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  })
}

//Update the dish where id === :dishId
function update(req, res) {
  let originalDish = res.locals.dish;
  const { data } = req.body;
  originalDish = {
    ...data,
    id: res.locals.dishId
  }
  res.json({ data: originalDish })
}

//Respond with the dish that has the matching id with the parameter dishId
function read(req, res) {
  res.json({ data: res.locals.dish });
}

module.exports = {
  list,
  create: [bodyHasRequiredProperty, create],
  read: [dishExists, read],
  update: [dishExists, bodyHasRequiredProperty, validateUpdateDishExists, update]
}