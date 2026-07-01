# 1. Build the React SPA
FROM node:20 AS client
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# 2. Build the .NET API (with the SPA already in wwwroot)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY server/ ./server/
COPY --from=client /server/wwwroot ./server/wwwroot
RUN dotnet publish server/ -c Release -o /app

# 3. Minimal runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app ./
ENTRYPOINT ["dotnet", "AnimalGlobe.dll"]