using Microsoft.Azure.Functions.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using System;

[assembly: FunctionsStartup(typeof(QualitasAPI.Startup))]

namespace QualitasAPI
{
    public class Startup : FunctionsStartup
    {
        public override void Configure(IFunctionsHostBuilder builder)
        {
            builder.Services.AddSingleton<IMongoClient>(s =>
            {
                string connectionString = Environment.GetEnvironmentVariable(" ");
                return new MongoClient(connectionString);
            });
        }
    }
}