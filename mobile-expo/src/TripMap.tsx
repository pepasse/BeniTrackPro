import React, { useCallback, useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';

export interface TripPoint {
  latitude: number;
  longitude: number;
}

const HTML = `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{height:100%;margin:0;background:#0b0d10}
  .pin{width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,.6)}
</style></head>
<body><div id="map"></div>
<script>
  var map = L.map('map', {zoomControl:false}).setView([4.0511, 9.7679], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);
  var layer = L.layerGroup().addTo(map);
  function dot(color){ return L.divIcon({className:'', iconSize:[16,16], html:'<div class="pin" style="background:'+color+'"></div>'}); }
  window.setTrip = function(pts){
    layer.clearLayers();
    if(!pts.length) return;
    var ll = pts.map(function(p){return [p.latitude,p.longitude]});
    L.polyline(ll, {color:'#f5a524', weight:4}).addTo(layer);
    L.marker(ll[0], {icon:dot('#22c55e')}).bindPopup('Départ').addTo(layer);
    L.marker(ll[ll.length-1], {icon:dot('#ef4444')}).bindPopup('Dernière position').addTo(layer);
    map.fitBounds(L.latLngBounds(ll), {padding:[30,30], maxZoom:17});
  };
</script></body></html>`;

export default function TripMap({ points }: { points: TripPoint[] }) {
  const ref = useRef<WebView>(null);
  const ready = useRef(false);

  const push = useCallback(() => {
    if (!ready.current) return;
    ref.current?.injectJavaScript(`window.setTrip(${JSON.stringify(points)}); true;`);
  }, [points]);

  useEffect(push, [push]);

  return (
    <WebView
      ref={ref}
      style={{ flex: 1, backgroundColor: '#0b0d10' }}
      originWhitelist={['*']}
      source={{ html: HTML, baseUrl: 'https://localhost' }}
      javaScriptEnabled
      nestedScrollEnabled
      onLoadEnd={() => {
        ready.current = true;
        push();
      }}
    />
  );
}
