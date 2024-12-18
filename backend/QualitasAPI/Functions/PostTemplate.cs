using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using Newtonsoft.Json;
using QualitasAPI.model;

namespace QualitasAPI.Functions
{
    public class PostTemplate
    {
        private readonly IMongoCollection<BsonDocument> _templateCollection;

        public PostTemplate(IMongoClient mongoClient)
        {
            var database = mongoClient.GetDatabase("qualitas-Surveys");
            _templateCollection = database.GetCollection<BsonDocument>("templates");
        }

        [FunctionName("PostTemplate")]
        public async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = "conversion-templates")] HttpRequest req,
            ILogger log)
        {
            try
            {
                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                var template = JsonConvert.DeserializeObject<Template>(requestBody);

                if (template == null || string.IsNullOrEmpty(template.Id))
                {
                    log.LogWarning("Template ID is missing or invalid.");
                    return new BadRequestObjectResult("Template ID is required.");
                }

                var existingTemplate = await _templateCollection
                    .Find(Builders<BsonDocument>.Filter.Eq("Id", template.Id))
                    .FirstOrDefaultAsync();

                if (existingTemplate != null)
                {
                    log.LogWarning($"Template with ID {template.Id} already exists.");
                    return new ConflictObjectResult($"Template with ID {template.Id} already exists.");
                }

                var mergeGroupsBsonArray = new BsonArray(
                    template.MergeGroups.Select(mergeGroup => new BsonDocument
                    {
                        { "Columns", new BsonArray(mergeGroup.Columns.Select(columnGroup => new BsonArray(columnGroup))) },
                        { "ValueMappings", new BsonDocument(
                            mergeGroup.ValueMappings.ToDictionary(
                                kv => kv.Key.ToString(),
                                kv => new BsonArray(kv.Value)
                            ))
                        },
                        { "ResultColumnName", new BsonArray(mergeGroup.ResultColumnName) }
                    })
                );

                var bsonTemplate = new BsonDocument
                {
                    { "Id", template.Id },
                    { "MergeGroups", mergeGroupsBsonArray }
                };

                await _templateCollection.InsertOneAsync(bsonTemplate);

                log.LogInformation($"Template with ID {template.Id} successfully created.");
                return new OkObjectResult(template);
            }
            catch (JsonException ex)
            {
                log.LogError($"Error parsing JSON: {ex.Message}");
                return new BadRequestObjectResult("Invalid JSON format.");
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