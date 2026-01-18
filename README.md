This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Running with Docker 🐳

If you prefer to run the project inside Docker instead of installing Node locally:

1. Run directly with Docker

```bash
docker run -it --rm \
  -v ${PWD}:/app \
  -w /app \
  -p 3000:3000 \
  node:22-alpine \
  sh -c "npm install && npm run dev -- --hostname 0.0.0.0"
```
Then open http://localhost:3000 in your browser.

2. Run with Docker Compose (Optional)

Create a docker-compose.yml in your project root:

```yaml
services:
  web:
    image: node:22-alpine
    working_dir: /app
    volumes:
      - .:/app
    ports:
      - "3000:3000"
    command: sh -c "npm install && npm run dev -- --hostname 0.0.0.0"
```

Start the container with:

```bash
docker compose up
```


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

Copyright (c) 2025 Vallabh Dasari

All rights reserved.

This software and its source code are the intellectual property of Vallabh Dasari.  
No part of this repository may be copied, modified, distributed, or used in any form,  
with or without modification, without explicit written permission from the author.

Unauthorized use, reproduction, or distribution of this code is strictly prohibited  
and may result in legal action.

For permissions or inquiries, contact: vallabh.dasari@gmail.com
