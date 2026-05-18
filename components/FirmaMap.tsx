'use client'

import { useEffect, useRef } from 'react'

interface FirmaMapProps {
  lat: number
  lng: number
  nazev: string
}

type LeafletMap = ReturnType<typeof import('leaflet')['map']>

export default function FirmaMap({ lat, lng, nazev }: FirmaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return

      const customIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })

      mapRef.current = L.map(containerRef.current).setView([lat, lng], 15)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current)

      L.marker([lat, lng], { icon: customIcon })
        .addTo(mapRef.current)
        .bindPopup(`<strong>${nazev}</strong>`)
        .openPopup()
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [lat, lng, nazev])

  return <div ref={containerRef} style={{ height: '300px', width: '100%' }} />
}
