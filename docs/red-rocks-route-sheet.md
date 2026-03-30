# Red Rocks Route Sheet

## Canonical Winner

### DCC hub
- `/red-rocks-transportation`
  - role: `understand`
  - status: `canonical`
  - cluster role: `hub`
  - job: main Red Rocks transport decision page

### PARR shared booking
- `https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared`
  - role: `act`
  - status: `canonical`
  - job: primary shared booking path

### PARR private booking
- `https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private`
  - role: `act`
  - status: `keep`
  - job: private/group booking path

## Active Feeders

- `/red-rocks-shuttle-vs-uber`
  - role: `understand`
  - status: `keep`
  - cluster role: `feeder`
  - job: compare shuttle vs rideshare and push to hub or booking

- `/red-rocks-shuttle`
  - role: `understand`
  - status: `keep`
  - cluster role: `feeder`
  - job: shuttle-specific entry into the transport cluster

- `/red-rocks-parking`
  - role: `understand`
  - status: `keep`
  - cluster role: `feeder`
  - job: parking-friction lane that should feed the hub

- `/how-to-get-to-red-rocks-without-parking-hassle`
  - role: `understand`
  - status: `keep`
  - cluster role: `feeder`
  - job: no-car / no-parking lane

- `/private-vs-shared-shuttles-to-red-rocks-denver-guide`
  - role: `understand`
  - status: `keep`
  - cluster role: `feeder`
  - job: narrow compare page that should not replace the hub

- `/guide/local/denver-pickups`
  - role: `understand`
  - status: `keep`
  - cluster role: `feeder`
  - job: pickup-location lane feeding the hub

## Support Pages

- `/red-rocks`
  - role: `understand`
  - status: `keep`
  - cluster role: `support`

- `/red-rocks-events`
  - role: `understand`
  - status: `keep`
  - cluster role: `support`

- `/red-rocks-complete-guide`
  - role: `understand`
  - status: `keep`
  - cluster role: `support`

- `/red-rocks-concert-guide`
  - role: `understand`
  - status: `keep`
  - cluster role: `support`

- `/denver/concert-transportation`
  - role: `understand`
  - status: `keep`
  - cluster role: `support`

## Redirects

- `/best-transportation-options-denver-to-red-rocks`
  - status: `redirect_pending`
  - canonical target: `/red-rocks-transportation`

- `/denver-concert-shuttle`
  - status: `redirect_pending`
  - canonical target: `/red-rocks-transportation`

- `/book/red-rocks`
  - status: `redirect_pending`
  - canonical target: `https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared`

- `/book/red-rocks-amphitheatre`
  - status: `redirect_pending`
  - canonical target: `https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared`

- `/book/red-rocks-amphitheatre/private`
  - status: `redirect_pending`
  - canonical target: `https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private`

## Review Questions

- Which remaining Red Rocks pages still behave like competing hubs?
- Which support pages should stay indexed vs feed the hub more aggressively?
- Are any remaining booking-adjacent routes still publicly discoverable in Google?
