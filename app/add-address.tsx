import { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, I18nManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";
import { addressesAPI } from "../lib/api";
import { useCart } from "../lib/cart-context";

// Promise.race against a timer — if the wrapped promise hasn't resolved
// within `ms` milliseconds, reject with a timeout error. Keeps the
// "Use current location" button from spinning forever when GPS hangs.
function withTimeout<T>(promise: Promise<T>, ms: number, label = "operation"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

export default function AddAddress() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showToast } = useCart();

  // Localized label tabs — we keep the canonical "Home"/"Work"/"Other"
  // as the stored value, but display the translated label in the UI.
  const labels: { value: string; display: string; icon: "home" | "briefcase" | "location" }[] = [
    { value: "Home", display: t("addresses.home_label"), icon: "home" },
    { value: "Work", display: t("addresses.work_label"), icon: "briefcase" },
    { value: "Other", display: t("addresses.other_label"), icon: "location" },
  ];

  const [label, setLabel] = useState("Home");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [building, setBuilding] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState(t("addresses.city_placeholder"));
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
          t("addresses.location_permission_title"),
          t("addresses.location_permission_sub"),
          [{ text: t("common.ok") }]
        );
        return;
      }

      // 2. Get current position. `Balanced` is faster + uses less battery
      // than `High`. Plenty accurate for an address. We wrap it in a
      // 12-second timeout so the spinner can't hang forever on flaky GPS.
      const position = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        12000,
        "GPS"
      );

      // 3. Try Expo's built-in reverse geocoder first (free, no network).
      // It works fine in the US/EU but is unreliable in regions where
      // Google Play Services data is sparse (Palestine, parts of MENA,
      // Africa, etc.). If it fails we fall back to Nominatim, the free
      // OpenStreetMap reverse-geocode service that covers everywhere.
      let place: any = null;
      try {
        const results = await withTimeout(
          Location.reverseGeocodeAsync({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
          3000,
          "OS geocoder"
        );
        place = results?.[0] || null;
      } catch (geoErr) {
        place = null;
      }

      // 3b. Nominatim fallback — runs only when the OS geocoder gave us
      // nothing usable. Free, no API key. We hit it directly from the
      // device. Their TOS allows up to 1 req/sec; a user tapping this
      // button is well under that. 8-second timeout so a slow network
      // doesn't hang the spinner.
      if (!place || (!place.city && !place.street && !place.name)) {
        try {
          const resp = await withTimeout(
            fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=en`,
              {
                headers: {
                  // Required by Nominatim TOS — identifies the app
                  "User-Agent": "KafuDeal/1.0 (kafudeal.com)",
                },
              }
            ),
            8000,
            "Nominatim"
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
        } catch (nomErr) {
          // Network error / timeout — fall through to the "couldn't auto-fill" path
          console.warn("Nominatim geocode failed:", nomErr);
        }
      }

      if (!place || (!place.city && !place.street && !place.name && !place.district)) {
        setLocating(false);
        Alert.alert(
          t("addresses.got_location_title"),
          t("addresses.got_location_sub"),
          [{ text: t("common.ok") }]
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
      // Confirm success with a toast so the user knows the form was filled.
      showToast({ message: t("addresses.location_set_toast"), kind: "save" });
    } catch (err: any) {
      setLocating(false);
      // Friendlier message for the common timeout case.
      const msg = (err?.message || "").toLowerCase().includes("timed out")
        ? t("addresses.gps_slow")
        : err?.message || t("addresses.gps_generic");
      Alert.alert(t("addresses.location_error_title"), msg);
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
          : (error as any)?.message || t("addresses.couldnt_save_sub");
      Alert.alert(t("addresses.couldnt_save_title"), msg);
      return;
    }

    // Match the UX of saving a product to favourites — a toast confirms
    // the action without making the user wait on a modal Alert.
    showToast({ message: t("addresses.saved_toast"), kind: "save" });
    router.back();
  };

  const backIconStyle = I18nManager.isRTL ? { transform: [{ scaleX: -1 }] as any } : undefined;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.root}>
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={s.iconBtn}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" style={backIconStyle} />
          </Pressable>
          <Text style={s.topTitle}>{t("addresses.new_address_title")}</Text>
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
                <Text style={s.locBtnText}>{t("addresses.use_current_location")}</Text>
              </>
            )}
          </Pressable>

          <View style={s.orRow}>
            <View style={s.orLine} />
            <Text style={s.orText}>{t("addresses.or_enter_manually")}</Text>
            <View style={s.orLine} />
          </View>

          {/* Label tabs */}
          <Text style={s.label}>{t("addresses.label_field")}</Text>
          <View style={s.tabRow}>
            {labels.map((l) => (
              <Pressable
                key={l.value}
                onPress={() => setLabel(l.value)}
                style={[s.tab, label === l.value && s.tabActive]}
              >
                <Ionicons
                  name={l.icon}
                  size={14}
                  color={label === l.value ? "#FF6B2C" : "#64748B"}
                />
                <Text style={[s.tabText, label === l.value && s.tabTextActive]}>{l.display}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>{t("addresses.full_name")}</Text>
          <TextInput
            value={name} onChangeText={setName}
            placeholder={t("addresses.name_placeholder")}
            placeholderTextColor="#94A3B8"
            style={s.input}
          />

          <Text style={s.label}>{t("addresses.phone_field")}</Text>
          <TextInput
            value={phone} onChangeText={setPhone}
            placeholder={t("addresses.phone_placeholder")}
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            style={s.input}
          />

          <Text style={s.label}>{t("addresses.building_apartment")}</Text>
          <TextInput
            value={building} onChangeText={setBuilding}
            placeholder={t("addresses.building_placeholder")}
            placeholderTextColor="#94A3B8"
            style={s.input}
          />

          <Text style={s.label}>{t("addresses.street_optional")}</Text>
          <TextInput
            value={street} onChangeText={setStreet}
            placeholder={t("addresses.street_placeholder")}
            placeholderTextColor="#94A3B8"
            style={s.input}
          />

          <Text style={s.label}>{t("addresses.area_neighborhood")}</Text>
          <TextInput
            value={area} onChangeText={setArea}
            placeholder={t("addresses.area_placeholder")}
            placeholderTextColor="#94A3B8"
            style={s.input}
          />

          <Text style={s.label}>{t("addresses.city_field")}</Text>
          <TextInput
            value={city} onChangeText={setCity}
            placeholder={t("addresses.city_placeholder")}
            placeholderTextColor="#94A3B8"
            style={s.input}
          />

          <Text style={s.label}>{t("addresses.notes_optional")}</Text>
          <TextInput
            value={notes} onChangeText={setNotes}
            placeholder={t("addresses.notes_placeholder_field")}
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
            <Text style={s.checkText}>{t("addresses.set_default_address")}</Text>
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
              <Text style={s.saveBtnText}>{t("addresses.save_address")}</Text>
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
