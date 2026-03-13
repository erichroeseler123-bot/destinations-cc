# DCC Special Pages (Microfrontend Target)

This is a lightweight Next.js app intended to be deployed as its own Vercel project.

## Routes
- `/mighty-argo-shuttle`
- `/vegas`
- `/alaska`
- `/cruises`
- `/national-parks`
- `/new-orleans`

## Deploy on Vercel
1. Create/select a Vercel project.
2. Set **Root Directory** to `apps/special-pages`.
3. Deploy.

## Microfrontends Routing (Vercel)
In the main `www.destinationcommandcenter.com` Vercel project, route these paths to the special-pages project using Vercel Microfrontends path routing.
