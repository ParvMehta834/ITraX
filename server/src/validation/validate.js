const Joi = require('joi');

function validate(schema) {
  return (req, res, next) => {
    const toValidate = {};
    if (req.body) toValidate.body = req.body;
    if (req.query) toValidate.query = req.query;
    if (req.params) toValidate.params = req.params;
    const { error } = schema.validate(toValidate, { abortEarly: false, allowUnknown: true });
    if (error) return res.status(400).json({ message: error.details.map(d => d.message).join(', ') });
    next();
  };
}

module.exports = { validate, Joi };
