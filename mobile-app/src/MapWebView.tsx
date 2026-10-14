import React, { useCallback, useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  active: boolean;
}

export interface MapFocus {
  latitude: number;
  longitude: number;
  key: number;
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
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap'
  }).addTo(map);
  var layer = L.layerGroup().addTo(map);
  var fitted = false;
  window.setMarkers = function(list){
    layer.clearLayers();
    list.forEach(function(m){
      var icon = L.divIcon({className:'', iconSize:[16,16],
        html:'<div class="pin" style="background:'+(m.active?'#22c55e':'#8a94a3')+'"></div>'});
      L.marker([m.latitude, m.longitude], {icon:icon}).bindPopup(m.label).addTo(layer);
    });
    if(!fitted && list.length){
      map.fitBounds(L.latLngBounds(list.map(function(m){return [m.latitude,m.longitude]})), {padding:[40,40], maxZoom:16});
      fitted = true;
    }
  };
  window.focusOn = function(lat, lng){ map.setView([lat, lng], 16); };
</script></body></html>`;

export default function MapWebView({ markers, focus }: { markers: MapMarker[]; focus: MapFocus | null }) {
  const ref = useRef<WebView>(null);
  const ready = useRef(false);

  const push = useCallback(() => {
    if (!ready.current) return;
    ref.current?.injectJavaScript(`window.setMarkers(${JSON.stringify(markers)}); true;`);
  }, [markers]);

  useEffect(push, [push]);

  useEffect(() => {
    if (focus && ready.current) {
      ref.current?.injectJavaScript(`window.focusOn(${focus.latitude}, ${focus.longitude}); true;`);
    }
  }, [focus]);

  return (
    <WebView
      ref={ref}
      style={{ flex: 1, backgroundColor: '#0b0d10' }}
      originWhitelist={['*']}
      source={{ html: HTML, baseUrl: 'https://localhost' }}
      javaScriptEnabled
      onLoadEnd={() => {
        ready.current = true;
        push();
      }}
    />
  );
}
