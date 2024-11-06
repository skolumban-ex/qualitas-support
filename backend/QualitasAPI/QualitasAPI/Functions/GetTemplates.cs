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
    public class GetTemplates
    {
        private readonly IMongoCollection<BsonDocument> _templateCollection;

        public GetTemplates(IMongoClient mongoClient)
        {
            var database = mongoClient.GetDatabase("SampleDB");
            _templateCollection = database.GetCollection<BsonDocument>("SampleCollection2"); 
        }

        [FunctionName("GetTemplates")]
        public async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "conversion-templates")] HttpRequest req,
            ILogger log)
        {
            try
            {
                var templates = await _templateCollection.Find(_ => true).ToListAsync();

                return new OkObjectResult(templates);
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
