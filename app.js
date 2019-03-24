'use strict';

var SwaggerExpress = require('swagger-express-mw');
const jsyaml    = require('js-yaml');
const path      = require("path");
const fs        = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = jsyaml.safeLoad(fs.readFileSync(path.join(__dirname, './api/swagger/swagger.yaml'), 'utf8'));
var app = require('express')();
module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
};

// Initialize sequelize and swagger-sequelize:
const swaggerSequelize = require("./api/models/swaggerSequelize");

SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }

  // install middleware
  swaggerExpress.register(app);
  app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  var port = process.env.PORT || 10010;
  app.listen(port);

  if (swaggerExpress.runner.swagger.paths['/hello']) {
    console.log('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
  }
});
