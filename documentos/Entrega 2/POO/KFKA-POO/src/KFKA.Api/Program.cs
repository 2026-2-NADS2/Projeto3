using System.Text.Json.Serialization;
using KFKA.Api.Data;
using KFKA.Api.Infra;
using KFKA.Api.Infra.Seguranca;
using KFKA.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// ---------- 1. Banco de dados (SQLite) ----------
string? conexao = builder.Configuration.GetConnectionString("Kfka");
if (string.IsNullOrWhiteSpace(conexao))
{
    throw new InvalidOperationException("Configure a connection string 'Kfka'.");
}
builder.Services.AddDbContext<KfkaDbContext>(opcoes => opcoes.UseSqlite(conexao));

// ---------- 2. Login com JWT ----------
// A chave vem de variável de ambiente (Jwt__Chave), nunca do código.
JwtOptions jwt = new JwtOptions();
builder.Configuration.GetSection("Jwt").Bind(jwt);
if (jwt.Chave.Length < 32)
{
    throw new InvalidOperationException("Configure Jwt__Chave com pelo menos 32 caracteres.");
}
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(opcoes =>
{
    opcoes.MapInboundClaims = false;
    opcoes.TokenValidationParameters = new TokenValidationParameters
    {
        ValidIssuer = jwt.Emissor,
        ValidAudience = jwt.Audiencia,
        IssuerSigningKey = jwt.ChaveAssinatura(),
        NameClaimType = ClaimsKfka.Nome,
        RoleClaimType = ClaimsKfka.Perfil
    };

    // A cada requisição, confere no banco se o usuário do token ainda está ativo.
    // Assim, desativar alguém corta o acesso na hora (401), sem esperar o token expirar.
    opcoes.Events = new JwtBearerEvents
    {
        OnTokenValidated = async contexto =>
        {
            KfkaDbContext db = contexto.HttpContext.RequestServices.GetRequiredService<KfkaDbContext>();
            string? id = contexto.Principal?.FindFirst(ClaimsKfka.Id)?.Value;

            bool ativo = int.TryParse(id, out int usuarioId)
                && await db.Usuarios.AnyAsync(u => u.Id == usuarioId && u.Ativo);
            if (!ativo)
            {
                contexto.Fail("Usuário inativo ou inexistente.");
            }
        }
    };
});
builder.Services.AddAuthorization();

// ---------- 3. Injeção de dependência ----------
// Singleton: uma instância para a aplicação toda.
// Scoped: uma instância nova a cada requisição HTTP.
builder.Services.AddSingleton<IRelogio, RelogioSistema>();
builder.Services.AddSingleton<IHasherSenha, BCryptHasherSenha>();
builder.Services.AddSingleton<GeradorToken>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UsuarioService>();
builder.Services.AddScoped<EscolaService>();
builder.Services.AddScoped<VinculoService>();
builder.Services.AddScoped<AcompanhamentoService>();
builder.Services.AddScoped<ResponsavelService>();

// Enums aparecem no JSON como texto ("Publicado") em vez de número.
builder.Services.AddControllers()
    .AddJsonOptions(opcoes => opcoes.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<TratadorDeExcecoes>();
builder.Services.AddHealthChecks();

// ---------- 4. Swagger (documentação e teste da API pelo navegador) ----------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opcoes =>
{
    opcoes.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "KFKA – Plataforma de Acompanhamento Escolar",
        Version = "v1",
        Description = "Faça login em /api/auth/login e clique em Authorize com o token."
    });
    opcoes.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Cole apenas o token retornado pelo login."
    });
    opcoes.AddSecurityRequirement(documento => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", documento)] = new List<string>()
    });
});

WebApplication app = builder.Build();

// ---------- 5. Cria o banco e carrega os dados de demonstração ----------
using (IServiceScope escopo = app.Services.CreateScope())
{
    KfkaDbContext db = escopo.ServiceProvider.GetRequiredService<KfkaDbContext>();
    db.Database.EnsureCreated();

    if (app.Configuration.GetValue("Seed:Habilitado", true))
    {
        string senhaPadrao = app.Configuration["Seed:SenhaPadrao"] ?? "Kfka@2026";
        IHasherSenha hasher = escopo.ServiceProvider.GetRequiredService<IHasherSenha>();
        await DbSeeder.PopularAsync(db, hasher, senhaPadrao);
    }
}

// ---------- 6. Pipeline: a ordem importa ----------
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseSwagger();
app.UseSwaggerUI();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

app.Run();

// Necessário para os testes de integração enxergarem a classe Program.
public partial class Program
{
}
