using ClosedXML.Excel;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using System;
using Newtonsoft.Json;
using Microsoft.Extensions.Logging;
using System.Linq;
using QualitasAPI.model;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.OpenApi.Models;

namespace QualitasAPI.Functions
{
    public static class ProcessColumns
    {
        [FunctionName("ProcessColumns")]
        //[OpenApiParameter(name: "remove...", In = ParameterLocation.Query, Required = false, Type = typeof(bool), Description = "If we should remove columns that are re encoded, set to true.")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = "process-columns")] HttpRequest req,
            ILogger log)
        {
            log.LogInformation("Processing process-columns request.");
            //bool removeReEncodedColumns = bool.Parse(req.Query["remove-reEncoded-Columns"]);

            try
            {
                string filePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads", "teszt.xlsx");

                if (!File.Exists(filePath))
                {
                    log.LogError($"The file at {filePath} does not exist.");
                    return new NotFoundObjectResult($"The file at {filePath} was not found.");
                }

                using var workbook = new XLWorkbook(filePath);
                var worksheet = workbook.Worksheets.First();

                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                ProcessRequest request;

                try
                {
                    request = JsonConvert.DeserializeObject<ProcessRequest>(requestBody);
                }
                catch (JsonException ex)
                {
                    log.LogError($"Error parsing JSON: {ex.Message}");
                    return new BadRequestObjectResult("Invalid JSON format.");
                }

                if (request == null || request.MergeGroups == null || !request.MergeGroups.Any())
                {
                    log.LogWarning("Invalid request payload.");
                    return new BadRequestObjectResult("MergeGroups must be provided.");
                }

                foreach (var mergeGroup in request.MergeGroups)
                {
                    if (mergeGroup.Columns == null || mergeGroup.ValueMappings == null || mergeGroup.ResultColumnName == null || mergeGroup.Columns.Count != mergeGroup.ResultColumnName.Count)
                    {
                        log.LogWarning("Invalid merge group configuration. Skipping.");
                        continue;
                    }

                    for (int i = 0; i < mergeGroup.Columns.Count; i++)
                    {
                        var columnGroup = mergeGroup.Columns[i];
                        string resultColumnName = mergeGroup.ResultColumnName[i];

                        int targetColumn = worksheet.LastColumnUsed().ColumnNumber() + 1;
                        worksheet.Cell(1, targetColumn).Value = resultColumnName;

                        for (int row = 2; row <= worksheet.LastRowUsed().RowNumber(); row++)
                        {
                            string mergedValue = null;

                            foreach (var colName in columnGroup)
                            {
                                int colIndex = GetColumnIndexByName(worksheet, colName);
                                var cellValue = worksheet.Cell(row, colIndex).GetString().ToLower();

                                foreach (var mapping in mergeGroup.ValueMappings)
                                {
                                    if (mapping.Value.Contains(cellValue))
                                    {
                                        mergedValue = mapping.Key.ToString();
                                        break;
                                    }
                                }

                                if (mergedValue != null) break;
                            }

                            worksheet.Cell(row, targetColumn).Value = mergedValue ?? "";
                        }

                        foreach (var colName in columnGroup)
                        {
                            int colIndex = GetColumnIndexByName(worksheet, colName);
                            worksheet.Column(colIndex).Delete();
                        }
                    }
                }

                var memoryStream = new MemoryStream();
                workbook.SaveAs(memoryStream);
                memoryStream.Position = 0;

                return new FileContentResult(memoryStream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                {
                    FileDownloadName = "processed_file.xlsx"
                };
            }
            catch (Exception ex)
            {
                log.LogError($"Unexpected error: {ex.Message}");
                return new StatusCodeResult((int)HttpStatusCode.InternalServerError);
            }
        }

        private static int GetColumnIndexByName(IXLWorksheet worksheet, string columnName)
        {
            var headerRow = worksheet.FirstRowUsed();
            for (int col = 1; col <= worksheet.LastColumnUsed().ColumnNumber(); col++)
            {
                if (headerRow.Cell(col).GetString().Equals(columnName, StringComparison.OrdinalIgnoreCase))
                    return col;
            }

            throw new ArgumentException($"Column '{columnName}' not found.");
        }
    }
}
