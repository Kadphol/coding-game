# ---- Build Stage ----
FROM oven/bun:1.1.13 as build
WORKDIR /app
COPY . .
RUN bun install

# ---- Run Stage ----
FROM oven/bun:1.1.13 as run
WORKDIR /app
COPY --from=build /app /app
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
