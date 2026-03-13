using Microsoft.Data.SqlClient;
using System.Data;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace APIWithControllers.net9
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            builder.Services.AddCors(o =>
            {
                o.AddPolicy("Angular", p => p
                    .WithOrigins("http://localhost:4200")
                    .AllowAnyHeader()
                    .AllowAnyMethod());
            });

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseCors("Angular");

            
            app.MapPost("/api/exec", async (ExecRequest request, IConfiguration config) =>
            {
                if (string.IsNullOrWhiteSpace(request.ProcedureName))
                    return Results.BadRequest(new { message = "procedureName is required" });

                foreach (var ch in request.ProcedureName)
                {
                    if (!(char.IsLetterOrDigit(ch) || ch == '_' || ch == '.'))
                        return Results.BadRequest(new { message = "Invalid procedureName" });
                }

                var connectionString = config.GetConnectionString("DefaultConnection");
                if (string.IsNullOrWhiteSpace(connectionString))
                    return Results.Problem("Missing connection string: DefaultConnection");

                await using var con = new SqlConnection(connectionString);
                await con.OpenAsync();

                await using var cmd = new SqlCommand(request.ProcedureName, con)
                {
                    CommandType = CommandType.StoredProcedure
                };

                if (request.Parameters != null)
                {
                    foreach (var kv in request.Parameters)
                    {
                        var paramName = "@" + kv.Key;
                        var value = ConvertJson(kv.Value) ?? DBNull.Value;

                        cmd.Parameters.Add(new SqlParameter(paramName, value));
                    }
                }

                var resultSets = new List<List<Dictionary<string, object?>>>();

                await using var reader = await cmd.ExecuteReaderAsync();

                do
                {
                    var rows = new List<Dictionary<string, object?>>();

                    while (await reader.ReadAsync())
                    {
                        var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            row[reader.GetName(i)] =
                                await reader.IsDBNullAsync(i) ? null : reader.GetValue(i);
                        }
                        rows.Add(row);
                    }

                    resultSets.Add(rows);

                } while (await reader.NextResultAsync());

                return Results.Ok(new { resultSets });
            });

            app.Run();
        }

        public class ExecRequest
        {
            public string ProcedureName { get; set; } = "";
            public Dictionary<string, JsonElement>? Parameters { get; set; }
        }

        private static object? ConvertJson(JsonElement je)
        {
            return je.ValueKind switch
            {
                JsonValueKind.String => je.GetString(),
                JsonValueKind.Number => je.TryGetInt64(out var l) ? l : je.GetDouble(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Null => null,
                JsonValueKind.Undefined => null,
                JsonValueKind.Object => je.GetRawText(), 
                JsonValueKind.Array => je.GetRawText(), 
                _ => je.GetRawText()
            };
        }
    }
}