using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace QualitasAPI.Functions
{
    public class GetDocumentById
    {
        private readonly IMongoCollection<BsonDocument> _templateCollection;
        private readonly IMongoCollection<BsonDocument> _collection;

        public GetDocumentById(IMongoClient mongoClient)
        {
            var database = mongoClient.GetDatabase("SampleDB");
            _templateCollection = database.GetCollection<BsonDocument>("SampleCollection2");
            _collection = database.GetCollection<BsonDocument>("SampleCollection2");
        }

        [FunctionName("GetDocumentById")]
        [OpenApiOperation(operationId: "Run", tags: new[] { "GetDocumentById" })]
        public async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "conversion-templates/{templateID}")] HttpRequest req,
            string templateID,
            ILogger log)
        {
            try
            {
                var filter = Builders<BsonDocument>.Filter.Eq("Id", templateID);
                var foundTemplate = await _templateCollection.Find(filter).FirstOrDefaultAsync();
                return foundTemplate != null ? new OkObjectResult(foundTemplate) : new NotFoundResult();
                log.LogInformation("Querying MongoDB collection for document with Id: " + templateID);

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