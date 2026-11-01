# ---------- build ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/KFKA.Api/KFKA.Api.csproj src/KFKA.Api/
RUN dotnet restore src/KFKA.Api/KFKA.Api.csproj
COPY src/KFKA.Api/ src/KFKA.Api/
RUN dotnet publish src/KFKA.Api/KFKA.Api.csproj -c Release -o /app --no-restore

# ---------- runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
RUN mkdir -p /app/data && chown -R $APP_UID /app/data
USER $APP_UID

ENV ConnectionStrings__Kfka="Data Source=/app/data/kfka.db"
EXPOSE 8080

# Render/Railway informam a porta em $PORT; localmente usa 8080.
ENTRYPOINT ["sh", "-c", "ASPNETCORE_HTTP_PORTS=${PORT:-8080} exec dotnet KFKA.Api.dll"]
