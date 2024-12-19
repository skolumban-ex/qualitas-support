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
            var database = mongoClient.GetDatabase("qualitas-Surveys");
            _templateCollection = database.GetCollection<BsonDocument>("templates");
        }

        [FunctionName("GetTemplates")]
        public async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "conversion-templates")] HttpRequest req,
            ILogger log)
        {
            try
            {
                var templates = await _templateCollection.Find(_ => true).ToListAsync();

                if (templates == null || templates.Count == 0)
                {
                    log.LogInformation("No templates found.");
                    return new NotFoundObjectResult("No templates found.");
                }

                log.LogInformation($"Found {templates.Count} template(s).");
                return new OkObjectResult(templates);
            }
            catch (MongoException ex)
            {
                log.LogError($"MongoDB error while fetching templates: {ex.Message}");
                return new StatusCodeResult((int)HttpStatusCode.InternalServerError);
            }
            catch (TimeoutException ex)
            {
                log.LogError($"Timeout occurred while querying MongoDB: {ex.Message}");
                return new StatusCodeResult((int)HttpStatusCode.RequestTimeout);
            }
            catch (Exception ex)
            {
                log.LogError($"Unexpected error occurred while fetching templates: {ex.Message}");
                return new StatusCodeResult((int)HttpStatusCode.InternalServerError);
            }
        }
    }
}