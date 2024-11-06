using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;

namespace QualitasAPI.Functions
{
    public class GetDocumentById
    {
<<<<<<< HEAD
        private readonly IMongoCollection<BsonDocument> _templateCollection;
=======
        private readonly IMongoCollection<BsonDocument> _collection;
>>>>>>> d6743e7a62d285ad91f38a348bd0bc51ddafb0cd

        public GetDocumentById(IMongoClient mongoClient)
        {
            var database = mongoClient.GetDatabase("SampleDB");
<<<<<<< HEAD
            _templateCollection = database.GetCollection<BsonDocument>("SampleCollection2");
=======
            _collection = database.GetCollection<BsonDocument>("SampleCollection2");
>>>>>>> d6743e7a62d285ad91f38a348bd0bc51ddafb0cd
        }

        [FunctionName("GetDocumentById")]
        public async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "conversion-templates/{templateID}")] HttpRequest req,
            string templateID,
            ILogger log)
        {
            try
            {
                var filter = Builders<BsonDocument>.Filter.Eq("Id", templateID);
<<<<<<< HEAD
                var foundTemplate = await _templateCollection.Find(filter).FirstOrDefaultAsync();
                return foundTemplate != null ? new OkObjectResult(foundTemplate) : new NotFoundResult();
=======
                log.LogInformation("Querying MongoDB collection for document with Id: " + templateID);

                var foundDocument = await _collection.Find(filter).FirstOrDefaultAsync();

                if (foundDocument != null)
                {
                    return new OkObjectResult(foundDocument);
                }
                else
                {
                    return new NotFoundResult();
                }
>>>>>>> d6743e7a62d285ad91f38a348bd0bc51ddafb0cd
            }
            catch (MongoException ex)
            {
                log.LogError($"MongoDB error: {ex.Message}");
                return new StatusCodeResult((int)HttpStatusCode.InternalServerError);
            }
            catch (Exception ex)
            {
                log.LogError($"Unexpected error: {ex.Message}");
                return new StatusCodeResult((int)HttpStatusCode.InternalServerError);
            }
        }
    }
}