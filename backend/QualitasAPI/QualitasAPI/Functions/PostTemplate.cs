using System.Collections.Generic;
using System;
using System.IO;
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
using Newtonsoft.Json;
using QualitasAPI.model;

namespace QualitasAPI.Functions
{
    public static class PostTemplate
    {
        private static List<Template> templates = new List<Template>();

        [FunctionName("PostTemplate")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = "conversion-templates")] HttpRequest req)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            var template = JsonConvert.DeserializeObject<Template>(requestBody);

            template.Id = Guid.NewGuid().ToString();
            templates.Add(template);

            return new OkObjectResult(template);
        }
    }
}

