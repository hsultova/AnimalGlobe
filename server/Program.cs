using Api.Configuration;
using Api.Data;
using Api.Services;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Net;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(opt =>
	opt.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
	options.Password.RequireNonAlphanumeric = false;
})
	.AddEntityFrameworkStores<AppDbContext>()
	.AddDefaultTokenProviders();

builder.Services.Configure<INaturalistOptions>(builder.Configuration.GetSection(INaturalistOptions.SectionName));
builder.Services.Configure<XenoCantoOptions>(builder.Configuration.GetSection(XenoCantoOptions.SectionName));

builder.Services.AddHttpClient<INaturalistClient>((provider, client) =>
{
	var options = provider.GetRequiredService<IOptions<INaturalistOptions>>().Value;
	client.BaseAddress = new Uri(options.BaseUrl);
	// iNaturalist asks API consumers to identify themselves with a User-Agent.
	client.DefaultRequestHeaders.UserAgent.ParseAdd("AnimalGlobe/1.0");
})
// The observations response is large (~2MB uncompressed). Ask for and transparently
// decompress gzip/brotli so the ~3s transfer shrinks to a fraction of the bytes.
.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
	AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Brotli | DecompressionMethods.Deflate,
})
// Photos are the critical path. Give each attempt a generous window so a slow
// iNaturalist response isn't cancelled at the default 10s and retried into a
// timeout storm; typical latency is ~3s.
.AddStandardResilienceHandler(o =>
{
	o.AttemptTimeout.Timeout = TimeSpan.FromSeconds(15);
	o.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds(30);
	// CircuitBreaker.SamplingDuration must be >= 2 * AttemptTimeout.
	o.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(30);
});
builder.Services.AddHttpClient<XenoCantoClient>((provider, client) =>
{
	var options = provider.GetRequiredService<IOptions<XenoCantoOptions>>().Value;
	client.BaseAddress = new Uri(options.BaseUrl);
})
.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
	AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Brotli | DecompressionMethods.Deflate,
})
// Sound is an optional enrichment, so fail fast instead of letting a slow or
// flaky Xeno-canto stall the import preview behind the default ~30s timeout.
.AddStandardResilienceHandler(o =>
{
	o.AttemptTimeout.Timeout = TimeSpan.FromSeconds(4);
	o.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds(10);
	// CircuitBreaker.SamplingDuration must be >= 2 * AttemptTimeout.
	o.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(8);
});

// Cache external API previews so re-searching a species doesn't re-hit the APIs.
builder.Services.AddMemoryCache();

builder.Services.ConfigureApplicationCookie(options =>
{
	options.Cookie.Name = "AnimalGlobe.AuthCookie";
	options.Cookie.HttpOnly = true;
	options.ExpireTimeSpan = TimeSpan.FromHours(8);
	options.SlidingExpiration = true;

	// API behaviour: don't redirect, just answer with a status code
	options.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = 401; return Task.CompletedTask; };
	options.Events.OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = 403; return Task.CompletedTask; };
});

builder.Services.AddAuthorization();

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
	ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

using (var scope = app.Services.CreateScope())
{
	var services = scope.ServiceProvider;

	// create the single admin if it doesn't exist
	var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
	const string adminEmail = "admin@animalglobe.local";
	if (await userManager.FindByEmailAsync(adminEmail) is null)
	{
		var admin = new IdentityUser { UserName = adminEmail, Email = adminEmail, EmailConfirmed = true };
		await userManager.CreateAsync(admin, "Admin123!");
	}
	var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
	app.MapOpenApi();
	app.UseSwagger();
	app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
