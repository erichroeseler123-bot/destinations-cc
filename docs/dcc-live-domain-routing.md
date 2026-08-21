# DCC live domain routing

`destinationcommandcenter.com` is currently attached in Vercel to the `dcc-v2-monolith` project. That project has historically deployed from the `dcc-cruise-port-authority-pages` branch of `erichroeseler123-bot/destinations-cc`.

The live branch should track the verified coordinate-first DCC implementation from `main`. The coordinate system is the source of truth: latitude/longitude identify a location, human pages render the applicable intelligence modules, and `/api/location/{lat}/{lng}` exposes the same location context as structured JSON.
