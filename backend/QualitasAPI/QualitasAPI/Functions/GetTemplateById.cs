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
using System.Collections.Generic;
using System.Linq;

namespace QualitasAPI.Functions
{
    public class GetTemplateById
    {
        private static List<Template> templates = new List<Template>();

        [FunctionName("GetTemplateById")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "conversion-templates/{templateID}")] HttpRequest req, string templateID)
        {
            Template foundTemplate = null;
            foreach (var template in templates)
            {
                if (string.Equals(template.Id, templateID, StringComparison.OrdinalIgnoreCase))
                {
                    foundTemplate = template;
                    break;
                }
            }

            return foundTemplate != null ? (IActionResult)new OkObjectResult(foundTemplate) : new NotFoundResult();
        }
    }
}

