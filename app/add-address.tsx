import { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Location from "expo-location";
import { addressesAPI } from "../lib/api";

const labels = ["Home", "Work", "Other"];

export default function AddAddress() {
  const insets = useSafeAreaInsets();
  const [label, setLabel] = useState("Home");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [building, setBuilding] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("Dubai");
  const [notes, setNotes] = useState("");
  const [setDefault, setSetDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const canSave = building.length > 0 && area.length > 0 && phone.length > 0 && !saving;

  // "Use my current location" — asks for permission, gets GPS coords, then
  // reverse-geocodes to fill the form fields. User can still edit anything
  // before saving. Falls back gracefully if permission denied / no GPS.
  const useCurrentLocation = async () => {
    try {
      setLocating(true);

      // 1. Ask permission (only when user explicitly tapped this button)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocating(false);
        Alert.alert(
          "Location permission needed",
          "We can't get your address without location access. You can still type it in manually.",
          [{ text: "OK" }]
        );
        return;
      }

      // 2. Get current position. `Balanced` is faster + uses less battery
      // than `High`. Plenty accurate for an address.
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 3. Try Expo's built-in reverse geocoder first (free, no network).
      // It works fine in the US/EU but is unreliable in regions where
      // Google Play Services data is sparse (Palestine, parts of MENA,
      // Africa, etc.). If it fails we fall back to Nominatim, the free
      // OpenStreetMap reverse-geocode service that covers everywhere.
      let place: any = null;
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        place = results?.[0] || null;
      } catch (geoErr) {
        place = null;
      }

      // 3b. Nominatim fallback — runs only when the OS geocoder gave us
      // nothing usable. Free, no API key. We hit it directly from the
      // device. Their TOS allows up to 1 req/sec; a user tapping this
      // button is well under that.
      if (!place || (!place.city && !place.street && !place.name)) {
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=en`,
            {
              headers: {
                // Required by Nominatim TOS — identifies the app
                "User-Agent": "KafuDeal/1.0 (kafudeal.com)",
              },
            }
          );
          if (resp.ok) {
            const data = await resp.json();
            const a = data?.address || {};
            place = {
              name: a.building || a.house_name || a.shop || null,
              street: [a.house_number, a.road].filter(Boolean).join(" ") || null,
              district: a.neighbourhood || a.suburb || a.quarter || a.city_district || null,
              subregion: a.county || a.state_district || null,
              city: a.city || a.town || a.village || a.municipality || null,
            };
          }
        } catch {
          // Network error — fall through to the "couldn't auto-fill" path
        }
      }

      if (!place || (!place.city && !place.street && !place.name && !place.district)) {
        setLocating(false);
        Alert.alert(
          "Got your location",
          "We pinned your spot but couldn't auto-fill the address text. Please type it in below — your GPS location is saved.",
          [{ text: "OK" }]
        );
        return;
      }

      // 4. Fill the form. We map the geocoder's fields onto ours:
      //   - building / street name → Building
      //   - district / sublocality → Area
      //   - city → City
      // Whatever's missing, the user can fill in.
      const buildingParts = [place.name, place.street]
        .filter(Boolean)
        .filter((p, i, arr) => arr.indexOf(p) === i); // dedupe
      if (buildingParts.length > 0) setBuilding(buildingParts.join(", "));
      if (place.street) setStreet(place.street);
      if (place.district || place.subregion) setArea(place.district || place.subregion || "");
      if (place.city) setCity(place.city);

      setLocating(false);
    } catch (err: any) {
      setLocating(false);
      Alert.alert(
        "Location error",
        err?.message || "Couldn't get your location. Please type the address in."
      );
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const { error } = await addressesAPI.create({
      label,
      building,
      street,
      area,
      city,
      phone,
      is_default: setDefault,
    });
    setSaving(false);

    if (error) {
      const msg =
        typeof error === "string"
          ? error
          : (error as any)?.message || "Couldn't save the address. Please try again.";
      Alert.alert("Couldn't save", msg);
      return;
    }

    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.root}>
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={s.iconBtn}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </Pressable>
          <Text style={s.topTitle}>New address</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
          {/* "Use my current location" — auto-fills form via GPS + reverse-geocode */}
          <Pressable
            onPress={useCurrentLocation}
            disabled={locating}
            style={[s.locBtn, locating && { opacity: 0.6 }]}
          >
            {locating ? (
              <ActivityIndicator color="#FF6B2C" />
            ) : (
              <>
                <Ionicons name="locate" size={20} color="#FF6B2C" />
                <Text style={s.locBtnText}>Use my current location</Text>
              </>
            )}
          </Pressable>

          <View style={s.orRow}>
            <View style={s.orLine} />
            <Text style={s.orText}>OR ENTER MANUALLY</Text>
            <View style={s.orLine} />
          </View>

          {/* Label tabs */}
          <Text style={s.label}>Label</Text>
          <View style={s.tabRow}>
            {labels.map((l) => (
              <Pressable
                key={l}
                onPress={() => setLabel(l)}
                style={[s.tab, label === l && s.tabActive]}
              >
                <Ionicons
                  name={l === "Home" ? "home" : l === "Work" ? "briefcase" : "location"}
                  size={14}
                  color={label === l ? "#FF6B2C" : "#64748B"}
                />
                <Text style={[s.tabText, label === l && s.tabTextActive]}>{l}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>Full name</Text>
          <TextInput
            value={name} onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#94A3B8"
            style={s.input}
          />

          <Text style={s.label}>Phone</Text>
          <TextInput
            value={phone} onChangeText={setPhone}
            placeholder="+971 50 000 0000"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            style={s.input}
          />

          <Text style={s.label}>Building / Apartment</Text>
          <TextInput
            value={building} onChangeText={setBuilding}
            placeholder="e.g. Marina Towers, Tower 3, Apt 1402"
            placeholderTextColor="#94A3B8"
            style={s.input}
          />

          <Text style={s.label}>Street (optional)</Text>
          <TextInput
            value={street} onChangeText={setStreet}
            placeholder="e.g. Sheikh Zayed Rd"
            placeholderTextColor="#94A3B8"
            style={s.input}
          />

          <Text style={s.label}>Area / Neighbourhood</Text>
          <TextInput
            value={area} onChangeText={setArea}
            placeholder="e.g. Dubai Marina"
            placeholderTextColor="#94A3B8"
            style={s.input}
          />

          <Text style={s.label}>City</Text>
          <TextInput
            value={city} onChangeText={setCity}
            placeholder="Dubai"
            placeholderTextColor="#94A3B8"
            style={s.input}
          />

          <Text style={s.label}>Delivery notes (optional)</Text>
          <TextInput
            value={notes} onChangeText={setNotes}
            placeholder="e.g. Leave at reception"
            placeholderTextColor="#94A3B8"
            multiline
            style={[s.input, { height: 80, textAlignVertical: "top", paddingTop: 12 }]}
          />

          <Pressable
            onPress={() => setSetDefault(!setDefault)}
            style={s.checkRow}
          >
            <View style={[s.check, setDefault && s.checkOn]}>
              {setDefault && <Ionicons name="checkmark" size={14} color="white" />}
            </View>
            <Text style={s.checkText}>Set as default address</Text>
          </Pressable>
        </ScrollView>

        <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={handleSave}
            style={[s.saveBtn, !canSave && { backgroundColor: "#FFD0B4" }]}
            disabled={!canSave}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={s.saveBtnText}>Save address</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingBottom: 12,
    backgroundColor: "white",
    borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)",
  },
  iconBtn: { padding: 6 },
  topTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  mapPreview: {
    height: 130, backgroundColor: "#F1EFE8",
    borderRadius: 14, alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(255,107,44,0.20)",
    borderStyle: "dashed",
  },
  mapText: { color: "#64748B", fontSize: 12, fontWeight: "700", marginTop: 6 },
  locBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#FF6B2C",
    backgroundColor: "#FFF4EC",
    marginBottom: 16,
  },
  locBtnText: { color: "#FF6B2C", fontSize: 14, fontWeight: "800" },
  orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  orLine: { flex: 1, height: 1, backgroundColor: "rgba(15,23,42,0.08)" },
  orText: { fontSize: 10, fontWeight: "800", color: "#94A3B8", letterSpacing: 0.6 },
  label: { fontSize: 12, fontWeight: "800", color: "#334155", marginBottom: 6, letterSpacing: 0.3, marginTop: 12 },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(15,23,42,0.10)",
  },
  tabActive: { backgroundColor: "#FFE7D1", borderColor: "#FF6B2C" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  tabTextActive: { color: "#FF6B2C" },
  input: {
    backgroundColor: "white",
    borderWidth: 1, borderColor: "rgba(15,23,42,0.10)",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#0F172A",
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20 },
  check: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: "#CBD5E1",
    alignItems: "center", justifyContent: "center",
  },
  checkOn: { backgroundColor: "#FF6B2C", borderColor: "#FF6B2C" },
  checkText: { fontSize: 13, color: "#0F172A", fontWeight: "600" },
  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 16, backgroundColor: "white",
    borderTopWidth: 0.5, borderTopColor: "rgba(15,23,42,0.08)",
  },
  saveBtn: {
    backgroundColor: "#FF6B2C", borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
  },
  saveBtnText: { color: "white", fontSize: 15, fontWeight: "800" },
});
