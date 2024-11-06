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
using QualitasAPI.model;

namespace QualitasAPI.Functions
{
    public class GetTemplateById
    {
        private readonly IMongoCollection<BsonDocument> _templateCollection;

        public GetTemplateById(IMongoClient mongoClient)
        {
            var database = mongoClient.GetDatabase("SampleDB");
            _templateCollection = database.GetCollection<BsonDocument>("SampleCollection2");
        }

        [FunctionName("GetTemplateById")]
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