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
    public class GetTemplateById
    {
        private readonly IMongoCollection<BsonDocument> _templateCollection;

        public GetTemplateById(IMongoClient mongoClient)
        {
            var database = mongoClient.GetDatabase("qualitas-Surveys");
            _templateCollection = database.GetCollection<BsonDocument>("templates");
        }

        [FunctionName("GetTemplateById")]
        public async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "conversion-templates/{templateID}")] HttpRequest req,
            string templateID,
            ILogger log)
        {
            if (string.IsNullOrEmpty(templateID))
            {
                log.LogWarning("Template ID is missing or invalid.");
                return new BadRequestObjectResult("Template ID cannot be null or empty.");
            }

            try
            {
                log.LogInformation($"Fetching template with ID: {templateID}");

                var filter = Builders<BsonDocument>.Filter.Eq("Id", templateID);
                var foundTemplate = await _templateCollection.Find(filter).FirstOrDefaultAsync();

                if (foundTemplate == null)
                {
                    log.LogInformation($"Template with ID {templateID} not found.");
                    return new NotFoundObjectResult($"Template with ID {templateID} not found.");
                }

                log.LogInformation($"Template with ID {templateID} found.");
                return new OkObjectResult(foundTemplate);
            }
            catch (MongoException ex)
            {
                log.LogError($"MongoDB error while querying for template with ID {templateID}: {ex.Message}");
                return new StatusCodeResult((int)HttpStatusCode.InternalServerError);
            }
            catch (TimeoutException ex)
            {
                log.LogError($"Timeout occurred while querying MongoDB: {ex.Message}");
                return new StatusCodeResult((int)HttpStatusCode.RequestTimeout);
            }
            catch (Exception ex)
            {
                log.LogError($"Unexpected error occurred while fetching template with ID {templateID}: {ex.Message}");
                return new StatusCodeResult((int)HttpStatusCode.InternalServerError);
            }
        }
    }
}
