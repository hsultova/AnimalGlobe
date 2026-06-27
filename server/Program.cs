using Api.Configuration;
using Api.Data;
using Api.Services;
using Api.Services.XenoCanto;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options =>
	options.UseSqlite(builder.Configuration.GetConnectionString("Default")));

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
.AddStandardResilienceHandler();
builder.Services.AddHttpClient<XenoCantoClient>((provider, client) =>
{
	var options = provider.GetRequiredService<IOptions<XenoCantoOptions>>().Value;
	client.BaseAddress = new Uri(options.BaseUrl);
})
.AddStandardResilienceHandler();

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

var app = builder.Build();

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
	// Apply migrations but don't let a stuck migration block startup indefinitely.
	try
	{
		var migrateTask = Task.Run(() => db.Database.Migrate());
		if (!migrateTask.Wait(TimeSpan.FromSeconds(10)))
		{
			var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
			logger.LogWarning("Database migration timed out after 10s; continuing without applying migrations.");
		}
		else
		{
			DbSeeder.Seed(db); // inserts the animals if the table is empty
		}
	}
	catch (Exception ex)
	{
		var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
		logger.LogError(ex, "Exception while applying migrations or seeding database");
	}
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

app.MapControllers();

app.Run();
