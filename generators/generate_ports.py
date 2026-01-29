port['neighbors'] = [
    p['slug'] for p in ports
    if p['slug'] != port['slug'] and get_distance_km(
        port['lat'], port['lng'], p['lat'], p['lng']
    ) <= 200
]
