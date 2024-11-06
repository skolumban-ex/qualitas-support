using System;
using System.IO;
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
            var database = mongoClient.GetDatabase("SampleDB");
            _templateCollection = database.GetCollection<BsonDocument>("SampleCollection2"); 
        }

        [FunctionName("PostTemplate")]
        public async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = "conversion-templates")] HttpRequest req,
            ILogger log)
        {
            try
            {
               // Read and deserialize the incoming request body into a Template object
                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                var template = JsonConvert.DeserializeObject<Template>(requestBody);


                var bsonTemplate = new BsonDocument
                {
                    { "_id", ObjectId.GenerateNewId() },
                    { "Id", template.Id },
                    { "Content", template.Content }
                };

                // Insert the new template into the MongoDB collection
                await _templateCollection.InsertOneAsync(bsonTemplate);

                // Return the created template as a response
                return new OkObjectResult(template);
            }
            catch (Exception ex)
            {
                log.LogError($"Unexpected error: {ex.Message}");
                return new StatusCodeResult((int)HttpStatusCode.InternalServerError);
            }
        }
    }
}
