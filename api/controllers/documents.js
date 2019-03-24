'use strict';

// For sequelize and swagger-sequelize:
const swaggerSequelize = require("../models/swaggerSequelize");

// Setup Sequelize-ORM for "Document" based on Swagger API specification:
var DocumentModel =  swaggerSequelize.sequelize.define('Document', swaggerSequelize.swaggerSequelize.generate(swaggerSequelize.swaggerSpec.definitions.Document));

// Setup/sync database table:
// force: false => If table already exists, don't touch or update it.
// force: true  => Delete table if it exists. Then create a new table.
DocumentModel.sync({force: false})
.then(() => { console.log("==>> DocumentModel synched ====================================="); });


// Just for Reference: List of important http status codes:
// 200 OK
// 201 CREATED
// 204 NO CONTENT (Indicates success but nothing is in the response body, often used for DELETE and PUT operations.)
// 400 BAD REQUEST (e.g. when data is missing or has wrong data type)
// 401 UNAUTHORIZED (e.g. missing or invalid authentication token)
// 403 FORBIDDEN (anlike a 401 Unauthorized response, authenticating will make no difference)
// 404 NOT FOUND
// 405 METHOD NOT ALLOWED (e.g. requested URL exists, but the requested HTTP method is not applicable. The Allow HTTP header must be set when returning a 405 to indicate the HTTP methods that are supported.
// 409 CONFLICT (e.g. a resource conflict would be caused by fulfilling the request)
// 500 INTERNAL SERVER ERROR (given when no more specific message is suitable)
// 501 Not Implemented



// The following controller methods are exported to be used by the API:

module.exports.create = (req, res) => {
  console.time("<<<<<< create()"); // Start time measurement
  const reqDocument = req.body;
  console.log("\n>>>>>> create() in controller documents.js");
  console.log("reqDocument:", reqDocument);
  //res.status(501).json({message:"NOT YET IMPLEMENTED"});

  // Create a new document, put it into the database and respond with the newly created document:
  DocumentModel.create(reqDocument).then( (createdDocument) => {
    res.status(201).json(createdDocument);
    console.timeEnd("<<<<<< create()"); // End time measurement
  });
}


module.exports.readAll = (req, res) => {
  console.time("<<<<<< readAll()"); // Start time measurement
  console.log("\n>>>>>> readAll() in controller documents.js");
  //res.status(501).json({message:"NOT YET IMPLEMENTED"});
  DocumentModel.findAll().then( (documents) => {
    console.log("Controller: documents.js; Function: readAll(): Responding with an array containing "+documents.length+" elements.");
    res.status(200).json(documents);
    console.timeEnd("<<<<<< readAll()"); // End time measurement
  });
}


module.exports.readById = (req, res) => {
  console.time("<<<<<< readById()"); // Start time measurement
  console.log("\n>>>>>> readById() in controller documents.js");
  const reqId = req.swagger.params.id.value;
  console.log("Requested id:", reqId);
  //res.status(501).json({message:"NOT YET IMPLEMENTED"});

  // Search document with provided reqId:
  DocumentModel
  .findById(reqId) /* Mor generic search .find( { where: { id: reqId } } ) */
  .then( (foundDocument) => {
    if(foundDocument==null) {
      // Document with reqId could not be found
      console.log("Document with requested id "+reqId+" could NOT be found.");
      res.status(404).json({message:"The requested document with id "+reqId+" could not be found. You may try another id."});
      console.timeEnd("<<<<<< readById()"); // End time measurement
    } else {
      console.log("Document with requested id "+reqId+" is found. Responding with object");
      console.log(foundDocument.dataValues);
      res.json(foundDocument);
      console.timeEnd("<<<<<< readById()"); // End time measurement
    }
  });
}


module.exports.deleteById = (req, res) => {
  console.time("<<<<<< deleteById()"); // Start time measurement
  console.log("\n>>>>>> deleteById() in controller documents.js");
  const reqId = req.swagger.params.id.value;
  console.log("Requested id:", reqId);
  //res.status(501).json({message:"NOT YET IMPLEMENTED"});

  DocumentModel
  .destroy( { where: { id: reqId } })
  .then( (destoryedCount) => {
    if(destoryedCount==0) {
      // Strange ... the document could not be deleted:
      console.log("Document with requested id "+reqId+" could NOT be deleted!");
      res.status(404).json({message:"The requested document with id "+reqId+" could not be deleted. You may try another id."});
      console.timeEnd("<<<<<< deleteById()"); // End time measurement
    } else {
      // Successfully deleted ...
      console.log("Document with requested id "+reqId+" is deleted! Number of deleted objects: "+destoryedCount);
      res.json( {
                  success: destoryedCount,
                  description: "Document with id "+reqId+" is deleted."
                });
      console.timeEnd("<<<<<< deleteById()"); // End time measurement
    }
  });
}


module.exports.updateOrCreate = (req, res) => {
  console.time("<<<<<< updateOrCreate()"); // Start time measurement
  console.log("\n>>>>>> updateOrCreate() in controller documents.js");
  const reqId = req.swagger.params.id.value;
  const reqDocument = req.body;
  console.log("Requested id:", reqId);
  console.log("Requested contents:", reqDocument);
  //res.status(501).json({message:"NOT YET IMPLEMENTED"});
  DocumentModel
  .findOrCreate( { where: { id: reqId }, defaults: reqDocument })
  .spread( (document, created) => {
    if(created) {
      // New document has been created, but most likely with wrong id:
      let createdId = document.id;
      if(createdId===reqId) {
        console.log("createdId AND reqId: "+createdId);
        // Status code 201: Successfully created
        console.log("New document has been created:", document.dataValues);
        res.status(201).json(document);
        console.timeEnd("<<<<<< updateOrCreate()"); // End time measurement
      } else {
        console.warn("createdId:"+createdId+" BUT reqId:"+reqId);
        // To change the id, document.updateAttributes() is not enough.
        // We need DocumentModle.update() for this:
        DocumentModel.update({id:reqId}, {where: {id:createdId}}).then( (affectedRowsCount) => {
          if(affectedRowsCount>0) {
            // Success: id has been changed. Need to read latest values from data base:
            DocumentModel
            .findById(reqId) /* Allgemeine Suche: .find( { where: { id: reqId } } ) */
            .then( (foundDocument) => {
              if(foundDocument==null) {
                // PROBLEM: Id could not be updated, even though affectedRowsCount indicates, it is:
                console.timeEnd("<<<<<< updateOrCreate()"); // End time measurement
                throw new Error("ERROR in updateOrCreate(): New document with id "+createdId+" should have been updated to new id "+reqId+", but is not ...");
              } else {
                // Status code 201: Successfully created (and updated)
                console.log("New document has been created, id has been corrected:", foundDocument.dataValues);
                res.status(201).json(foundDocument);
                console.timeEnd("<<<<<< updateOrCreate()"); // End time measurement
              }
            })
          } else {
            // PROBLEM: Id could not be updated!
            console.timeEnd("<<<<<< updateOrCreate()"); // End time measurement
            throw new Error("ERROR in updateOrCreate(): New document with id "+createdId+" could not be updated to new id "+reqId);
          }
        })
      }
    } else {
      // Document has been found. Need to update:
      document.updateAttributes(reqDocument).then( (updatedDocument) => {
        // Status Code 200: Successfully updated
        console.log("Existing document has been updated:", updatedDocument.dataValues);
        res.json(updatedDocument);        
        console.timeEnd("<<<<<< updateOrCreate()"); // End time measurement
      });
    }
  });
}

module.exports.updateById = (req, res) => {
  console.time("<<<<<< updateById()"); // Start time measurement
  console.log("\n>>>>>> updateById() in controller documents.js");
  const reqId = req.swagger.params.id.value;
  const reqDocument = req.body;
  console.log("Requested id:", reqId);
  console.log("Requested contents:", reqDocument);
  //res.status(501).json({message:"NOT YET IMPLEMENTED"});

  DocumentModel
  .findById(reqId) /* More generic search would be: .find( { where: { id: id } } ) */
  .then( (foundDocument) => {
    if(foundDocument==null) {
      // Document with reqId could not be found
      console.log("Document with requested id "+reqId+" could NOT be found.");
      res.status(404).json({message:"The requested document with id "+reqId+" could not be found. You may try another id."});
      console.timeEnd("<<<<<< updateById()"); // End time measurement
    } else {
      foundDocument.updateAttributes(reqDocument).then( (updatedDocument) => {
        // Status Code 200: Successfully updated
        console.log("Existing document has been updated:", updatedDocument.dataValues);
        res.json(updatedDocument);        
        console.timeEnd("<<<<<< updateById()"); // End time measurement
      });
    }
  });
}